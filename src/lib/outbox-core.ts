export interface OutboxOp {
  id: string;
  path: string;
  method: 'POST' | 'PUT' | 'PATCH';
  body: unknown;
  attempts: number;
  nextAttemptAt: number;
  createdAt: number;
}

export type Outcome = { kind: 'ok' } | { kind: 'retry' } | { kind: 'drop'; status: number };

const BASE_DELAY_MS = 5000;
const MAX_DELAY_MS = 30 * 1000;
const RETRYABLE_CLIENT_STATUSES = new Set([408, 425, 429]);

export function classify(status: number | null): 'retry' | 'drop' {
  if (status === null) return 'retry';
  if (status >= 500 || RETRYABLE_CLIENT_STATUSES.has(status)) return 'retry';
  return 'drop';
}

export function backoffMs(attempts: number): number {
  return Math.min(BASE_DELAY_MS * 2 ** Math.max(attempts - 1, 0), MAX_DELAY_MS);
}

export function isDue(op: OutboxOp, now: number): boolean {
  return op.nextAttemptAt <= now;
}

export function addOp(ops: OutboxOp[], op: OutboxOp): OutboxOp[] {
  return ops.some((existing) => existing.id === op.id) ? ops : [...ops, op];
}

export function applyOutcome(ops: OutboxOp[], id: string, outcome: Outcome, now: number): OutboxOp[] {
  if (outcome.kind !== 'retry') return ops.filter((op) => op.id !== id);
  return ops.map((op) =>
    op.id === id ? { ...op, attempts: op.attempts + 1, nextAttemptAt: now + backoffMs(op.attempts + 1) } : op
  );
}
