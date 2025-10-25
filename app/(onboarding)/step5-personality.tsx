import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboarding } from '@/contexts/OnboardingContext';

const PERSONALITY_TAGS = [
  { value: 'jugueton', label: 'Juguetón', icon: '🎾' },
  { value: 'energico', label: 'Enérgico', icon: '⚡' },
  { value: 'tranquilo', label: 'Tranquilo', icon: '😌' },
  { value: 'guardian', label: 'Guardián', icon: '🛡️' },
  { value: 'amigable_ninos', label: 'Amigable con niños', icon: '👶' },
  { value: 'sociable', label: 'Sociable', icon: '🤝' },
  { value: 'timido', label: 'Tímido', icon: '🙈' },
  { value: 'inteligente', label: 'Inteligente', icon: '🧠' },
  { value: 'leal', label: 'Leal', icon: '💙' },
  { value: 'aventurero', label: 'Aventurero', icon: '🏔️' },
  { value: 'dormilon', label: 'Dormilón', icon: '😴' },
  { value: 'gloton', label: 'Glotón', icon: '😋' },
];

export default function Step5Personality() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  const [selectedTags, setSelectedTags] = useState<string[]>(data.personalityTags);

  const toggleTag = (tagValue: string) => {
    if (selectedTags.includes(tagValue)) {
      setSelectedTags(selectedTags.filter((t) => t !== tagValue));
    } else {
      if (selectedTags.length >= 3) {
        Alert.alert('Máximo 3 rasgos', 'Solo puedes seleccionar hasta 3 rasgos de personalidad');
        return;
      }
      setSelectedTags([...selectedTags, tagValue]);
    }
  };

  const handleContinue = () => {
    if (selectedTags.length === 0) {
      Alert.alert('Selección requerida', 'Por favor selecciona al menos 1 rasgo de personalidad');
      return;
    }

    updateData({ personalityTags: selectedTags });
    router.push('/(onboarding)/step6-location');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Atrás</Text>
        </TouchableOpacity>
        <Text style={styles.stepIndicator}>Paso 5 de 6</Text>
        <Text style={styles.title}>¿Cómo describirías a {data.petName}?</Text>
        <Text style={styles.subtitle}>
          Elige hasta 3 rasgos que definan su carácter. ¡Esto ayuda a romper el hielo!
        </Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Tags selection */}
        <View style={styles.tagsContainer}>
          {PERSONALITY_TAGS.map((tag) => {
            const isSelected = selectedTags.includes(tag.value);
            return (
              <TouchableOpacity
                key={tag.value}
                style={[styles.tag, isSelected && styles.tagActive]}
                onPress={() => toggleTag(tag.value)}
              >
                <Text style={styles.tagIcon}>{tag.icon}</Text>
                <Text style={[styles.tagLabel, isSelected && styles.tagLabelActive]}>
                  {tag.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selected count */}
        <View style={styles.counterContainer}>
          <Text style={styles.counterText}>
            {selectedTags.length} de 3 rasgos seleccionados
          </Text>
        </View>

        {/* Info box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoText}>
            La compatibilidad va más allá de la raza. ¡Conectemos por personalidades!
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>Continuar</Text>
        </TouchableOpacity>
      </View>
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
  scrollView: {
    flex: 1,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 30,
    gap: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  tagActive: {
    backgroundColor: '#FFE5E5',
    borderColor: '#FF6B6B',
  },
  tagIcon: {
    fontSize: 20,
    marginRight: 6,
  },
  tagLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  tagLabelActive: {
    color: '#FF6B6B',
  },
  counterContainer: {
    paddingHorizontal: 30,
    paddingVertical: 20,
    alignItems: 'center',
  },
  counterText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 30,
    marginBottom: 20,
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
