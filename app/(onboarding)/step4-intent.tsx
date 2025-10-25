import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboarding, UserIntent } from '@/contexts/OnboardingContext';
import LottieView from 'lottie-react-native';

export default function Step4Intent() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  const [selectedIntent, setSelectedIntent] = useState<UserIntent | null>(data.userIntent);

  const intents = [
    {
      value: 'breeding' as UserIntent,
      title: 'Cruza / Monta',
      icon: '💕',
      description: 'Busco activamente una pareja para criar',
    },
    {
      value: 'playdates' as UserIntent,
      title: 'Amigos y Juegos',
      icon: '🎾',
      description: 'Busco otros perros para socializar y jugar',
    },
    {
      value: 'open' as UserIntent,
      title: 'Abierto a todo',
      icon: '✨',
      description: '¡Explorando opciones!',
    },
  ];

  const handleContinue = () => {
    if (!selectedIntent) {
      Alert.alert('Selección requerida', 'Por favor selecciona qué buscas en ZooDate');
      return;
    }

    updateData({ userIntent: selectedIntent });
    router.push('/(onboarding)/step5-personality');
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>← Atrás</Text>
          </TouchableOpacity>
          <Text style={styles.stepIndicator}>Paso 4 de 6</Text>

          {/* Animación */}
          <View style={styles.animationContainer}>
            <LottieView
              source={require('@/assets/animations/Flirting Dog.json')}
              autoPlay
              loop
              style={styles.animation}
            />
          </View>

          <Text style={styles.title}>¿Qué buscas en ZooDate?</Text>
          <Text style={styles.subtitle}>
            Sé honesto, esto nos ayuda a mostrarte los perfiles correctos y a gestionar las expectativas de todos.
          </Text>
        </View>

        {/* Options */}
        <View style={styles.content}>
        {intents.map((intent) => (
          <TouchableOpacity
            key={intent.value}
            style={[
              styles.intentCard,
              selectedIntent === intent.value && styles.intentCardActive,
            ]}
            onPress={() => setSelectedIntent(intent.value)}
          >
            <Text style={styles.intentIcon}>{intent.icon}</Text>
            <View style={styles.intentTextContainer}>
              <Text
                style={[
                  styles.intentTitle,
                  selectedIntent === intent.value && styles.intentTitleActive,
                ]}
              >
                {intent.title}
              </Text>
              <Text style={styles.intentDescription}>{intent.description}</Text>
            </View>
            {selectedIntent === intent.value && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </TouchableOpacity>
        ))}

        {/* Info box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoText}>
            Para asegurarnos de que conectas con dueños que tienen los mismos objetivos que tú.
          </Text>
        </View>
      </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.button} onPress={handleContinue}>
            <Text style={styles.buttonText}>Continuar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 30,
    marginBottom: 20,
  },
  animationContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  animation: {
    width: 200,
    height: 200,
  },
  backButton: {
    marginBottom: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  stepIndicator: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '600',
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
  },
  intentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  intentCardActive: {
    backgroundColor: '#FFE5E5',
    borderColor: '#FF6B6B',
  },
  intentIcon: {
    fontSize: 40,
    marginRight: 15,
  },
  intentTextContainer: {
    flex: 1,
  },
  intentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  intentTitleActive: {
    color: '#FF6B6B',
  },
  intentDescription: {
    fontSize: 14,
    color: '#666',
  },
  checkmark: {
    fontSize: 24,
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
    alignItems: 'flex-start',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  footer: {
    padding: 30,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  button: {
    backgroundColor: '#FF6B6B',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
