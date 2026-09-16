import { useEffect } from 'react';
import { Stack, useRouter, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SettingsProvider, useSettings } from '@/context/settings-context';
import { LocationProvider } from '@/context/location-context';
import { FarmerProvider, useFarmer } from '@/context/farmer-context';
import { ConversationProvider } from '@/context/conversation-context';

function RootLayoutNav() {
  const { theme, isDark } = useSettings();
  const { isReady, isRegistered } = useFarmer();
  const router = useRouter();
  const pathname = usePathname();

  // Send unregistered farmers to /register first -- everything downstream
  // (slot booking, the memory/RAG backend) needs a real farmer_id (phone
  // number), which only exists once this has run.
  useEffect(() => {
    if (!isReady) return;
    if (!isRegistered && pathname !== '/register') {
      router.replace('/register');
    }
  }, [isReady, isRegistered, pathname, router]);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="register" />
        <Stack.Screen name="chat" />
        <Stack.Screen name="voice-assistant" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="slots" />
        <Stack.Screen name="payments" />
        <Stack.Screen name="crops" />
        <Stack.Screen name="mandis" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SettingsProvider>
      <LocationProvider>
        <FarmerProvider>
          <ConversationProvider>
            <RootLayoutNav />
          </ConversationProvider>
        </FarmerProvider>
      </LocationProvider>
    </SettingsProvider>
  );
}

