import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, ApiError, apiFetch } from './api';
import { OutboxOp, Outcome, addOp, applyOutcome, classify, isDue } from './outbox-core';

const STORAGE_KEY = '@kissan_saathi_outbox_v1';

export interface FlushResult {
  sent: number;
  dropped: number;
  remaining: number;
}

const listeners = new Set<() => void>();
let inFlight: Promise<FlushResult> | null = null;

async function load(): Promise<OutboxOp[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as OutboxOp[]) : [];
  } catch {
    return [];
  }
}

async function save(ops: OutboxOp[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ops));
  listeners.forEach((listener) => listener());
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function pendingCount(): Promise<number> {
  return (await load()).length;
}

async function run(force: boolean): Promise<FlushResult> {
  const attempted = new Set<string>();
  let sent = 0;
  let dropped = 0;

  for (;;) {
    const now = Date.now();
    const online = force || sent > 0;
    const op = (await load()).find((candidate) => (online || isDue(candidate, now)) && !attempted.has(candidate.id));
    if (!op) break;
    attempted.add(op.id);

    let outcome: Outcome;
    try {
      await apiFetch(op.path, { method: op.method, body: op.body });
      outcome = { kind: 'ok' };
    } catch (error) {
      const status = error instanceof ApiError ? error.status : null;
      const reason = error instanceof Error ? error.message : 'unknown error';
      if (classify(status) === 'retry') {
        console.log(`[outbox] ${op.path} not delivered (${status === null ? `cannot reach ${API_BASE_URL}` : `HTTP ${status}`}); will retry`);
        outcome = { kind: 'retry' };
      } else {
        console.warn(`[outbox] ${op.path} rejected by the server (HTTP ${status}: ${reason}); it will NOT be retried`);
        outcome = { kind: 'drop', status: status ?? 0 };
      }
    }

    await save(applyOutcome(await load(), op.id, outcome, Date.now()));
    if (outcome.kind === 'ok') sent += 1;
    else if (outcome.kind === 'drop') dropped += 1;
    else break;
  }
  return { sent, dropped, remaining: (await load()).length };
}

// force ignores the retry delays: use it when the app opens or returns to the foreground.
export function flush(force = false): Promise<FlushResult> {
  if (!inFlight) {
    inFlight = run(force).finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

// Saved before it is sent, so closing the app mid-request cannot lose the action.
export async function enqueue(input: {
  id: string;
  path: string;
  body: unknown;
  method?: OutboxOp['method'];
}): Promise<FlushResult> {
  const ops = await load();
  const next = addOp(ops, {
    id: input.id,
    path: input.path,
    method: input.method ?? 'POST',
    body: input.body,
    attempts: 0,
    nextAttemptAt: 0,
    createdAt: Date.now(),
  });
  if (next !== ops) await save(next);
  return flush();
}
