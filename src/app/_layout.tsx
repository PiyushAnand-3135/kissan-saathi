import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SettingsProvider, useSettings } from '@/context/settings-context';
import { LocationProvider } from '@/context/location-context';

function RootLayoutNav() {
  const { theme, isDark } = useSettings();

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
        <RootLayoutNav />
      </LocationProvider>
    </SettingsProvider>
  );
}

