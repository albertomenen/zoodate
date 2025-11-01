import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { useRouter } from 'expo-router';
import LoadingDog from '@/components/LoadingDog';
import { AntDesign } from '@expo/vector-icons';

// Necesario para cerrar el navegador después de la autenticación
WebBrowser.maybeCompleteAuthSession();

export default function WelcomeScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Login con Email/Password
  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresa tu email y contraseña');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    });

    if (error) {
      setLoading(false);
      Alert.alert('Error de login', error.message);
      return;
    }

    if (data.session) {
      // Verificar si el usuario ya completó el onboarding
      const { data: pet } = await supabase
        .from('pets')
        .select('id')
        .eq('user_id', data.session.user.id)
        .eq('is_active', true)
        .single();

      setLoading(false);

      if (pet) {
        // Ya completó el onboarding, ir a tabs
        router.replace('/(tabs)');
      } else {
        // No ha completado el onboarding, ir al primer paso
        router.replace('/(onboarding)/step1-welcome');
      }
    }
  };

  // Registro con Email/Password
  const handleEmailSignUp = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresa tu email y contraseña');
      return;
    }

    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Email inválido', 'Por favor ingresa un email válido (ej: usuario@ejemplo.com)');
      return;
    }

    // Validación de contraseña
    if (password.length < 6) {
      Alert.alert('Contraseña muy corta', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password,
    });

    setLoading(false);

    if (error) {
      Alert.alert('Error de registro', error.message);
    } else if (data.session) {
      // Si hay sesión, el usuario fue registrado y logueado automáticamente
      router.replace('/(onboarding)/step1-welcome');
    } else {
      // Si no hay sesión, necesita confirmar email (no debería pasar si está desactivado)
      Alert.alert(
        '¡Cuenta creada! 🎉',
        'Por favor verifica tu email para activar tu cuenta.',
        [{ text: 'OK' }]
      );
    }
  };

  // Login con Google OAuth
  const handleGoogleLogin = async () => {
    setLoading(true);

    const redirectUrl = AuthSession.makeRedirectUri({
      scheme: 'zoodate',
      path: 'auth/callback'
    });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      setLoading(false);
      Alert.alert('Error', error.message);
      return;
    }

    if (data?.url) {
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUrl
      );

      if (result.type === 'success') {
        const url = result.url;
        const params = new URLSearchParams(url.split('#')[1] || url.split('?')[1]);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            Alert.alert('Error', sessionError.message);
          } else {
            router.replace('/(onboarding)/step1-welcome');
          }
        }
      }
    }

    setLoading(false);
  };


  if (loading) {
    return <LoadingDog message="Iniciando sesión..." />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>🐾 ZooDate</Text>
        <Text style={styles.subtitle}>Encuentra el match perfecto para tu mascota</Text>

        {/* Email Input */}
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading}
        />

        {/* Password Input */}
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />

        {/* Email Login Button */}
        <TouchableOpacity
          style={[styles.button, styles.emailButton]}
          onPress={handleEmailLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Iniciar Sesión</Text>
          )}
        </TouchableOpacity>

        {/* Sign Up Button */}
        <TouchableOpacity
          style={[styles.button, styles.signUpButton]}
          onPress={handleEmailSignUp}
          disabled={loading}
        >
          <Text style={[styles.buttonText, styles.signUpButtonText]}>
            Crear Cuenta
          </Text>
        </TouchableOpacity>

        <Text style={styles.divider}>O continúa con</Text>

        {/* Google Login Button */}
        <TouchableOpacity
          style={[styles.googleButton]}
          onPress={handleGoogleLogin}
          disabled={loading}
        >
          <View style={styles.googleButtonContent}>
            <AntDesign name="google" size={20} color="#fff" style={styles.googleIcon} />
            <Text style={styles.googleButtonText}>Continuar con Google</Text>
          </View>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  button: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  emailButton: {
    backgroundColor: '#FF6B6B',
  },
  signUpButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  signUpButtonText: {
    color: '#FF6B6B',
  },
  googleButton: {
    backgroundColor: '#131314',
    borderWidth: 1,
    borderColor: '#8e918f',
    borderRadius: 20,
    height: 40,
    paddingHorizontal: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  googleIcon: {
    marginRight: 12,
  },
  googleButtonText: {
    color: '#e3e3e3',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.25,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    textAlign: 'center',
    color: '#999',
    marginVertical: 20,
    fontSize: 14,
  },
});
