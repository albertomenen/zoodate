import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

export default function Index() {
  const [session, setSession] = useState<Session | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthAndOnboarding();
  }, []);

  const checkAuthAndOnboarding = async () => {
    try {
      // Verificar sesión
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (session) {
        // Verificar si el usuario ya completó el onboarding (tiene una mascota activa)
        const { data: pet } = await supabase
          .from('pets')
          .select('id')
          .eq('user_id', session.user.id)
          .eq('is_active', true)
          .single();

        setHasCompletedOnboarding(!!pet);
      }
    } catch (error) {
      console.error('Error checking auth and onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  // Sin sesión → ir a welcome
  if (!session) {
    return <Redirect href="/(auth)/welcome" />;
  }

  // Con sesión pero sin onboarding → ir a onboarding
  if (session && !hasCompletedOnboarding) {
    return <Redirect href="/(onboarding)/step1-welcome" />;
  }

  // Con sesión y onboarding completado → ir a tabs
  return <Redirect href="/(tabs)" />;
}
