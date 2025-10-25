import { Stack } from 'expo-router';
import { OnboardingProvider } from '@/contexts/OnboardingContext';

export default function OnboardingLayout() {
  return (
    <OnboardingProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="step1-welcome" />
        <Stack.Screen name="step2-basic-info" />
        <Stack.Screen name="step3-photo" />
        <Stack.Screen name="step4-intent" />
        <Stack.Screen name="step5-personality" />
        <Stack.Screen name="step6-location" />
      </Stack>
    </OnboardingProvider>
  );
}
