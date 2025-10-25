import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboarding } from '@/contexts/OnboardingContext';

export default function Step2BasicInfo() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();

  const [name, setName] = useState(data.petName);
  const [breed, setBreed] = useState(data.breed);
  const [gender, setGender] = useState<'male' | 'female' | null>(data.gender);
  const [years, setYears] = useState(data.ageYears.toString());
  const [months, setMonths] = useState(data.ageMonths.toString());

  const handleContinue = () => {
    if (!name.trim()) {
      Alert.alert('Nombre requerido', 'Por favor ingresa el nombre de tu mascota');
      return;
    }
    if (!breed.trim()) {
      Alert.alert('Raza requerida', 'Por favor ingresa la raza de tu mascota');
      return;
    }
    if (!gender) {
      Alert.alert('Género requerido', 'Por favor selecciona el género');
      return;
    }

    updateData({
      petName: name.trim(),
      breed: breed.trim(),
      gender,
      ageYears: parseInt(years) || 0,
      ageMonths: parseInt(months) || 0,
    });

    router.push('/(onboarding)/step3-photo');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>← Atrás</Text>
          </TouchableOpacity>
          <Text style={styles.stepIndicator}>Paso 2 de 6</Text>
          <Text style={styles.title}>¡Hablemos de tu Mascota!</Text>
          <Text style={styles.subtitle}>
            Esta es la información clave que otros dueños verán primero.
          </Text>
        </View>

        {/* Formulario */}
        <View style={styles.form}>
          {/* Nombre */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Nombre de la mascota</Text>
            <TextInput
              style={styles.input}
              placeholder="ej: Max"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          {/* Raza */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Raza</Text>
            <TextInput
              style={styles.input}
              placeholder="ej: Golden Retriever"
              value={breed}
              onChangeText={setBreed}
              autoCapitalize="words"
            />
          </View>

          {/* Género */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Género</Text>
            <View style={styles.genderButtons}>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  gender === 'male' && styles.genderButtonActive,
                ]}
                onPress={() => setGender('male')}
              >
                <Text
                  style={[
                    styles.genderButtonText,
                    gender === 'male' && styles.genderButtonTextActive,
                  ]}
                >
                  Macho ♂️
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.genderButton,
                  gender === 'female' && styles.genderButtonActive,
                ]}
                onPress={() => setGender('female')}
              >
                <Text
                  style={[
                    styles.genderButtonText,
                    gender === 'female' && styles.genderButtonTextActive,
                  ]}
                >
                  Hembra ♀️
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Edad */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Edad</Text>
            <View style={styles.ageInputs}>
              <View style={styles.ageField}>
                <TextInput
                  style={styles.ageInput}
                  placeholder="0"
                  value={years}
                  onChangeText={setYears}
                  keyboardType="number-pad"
                  maxLength={2}
                />
                <Text style={styles.ageLabel}>años</Text>
              </View>

              <View style={styles.ageField}>
                <TextInput
                  style={styles.ageInput}
                  placeholder="0"
                  value={months}
                  onChangeText={setMonths}
                  keyboardType="number-pad"
                  maxLength={2}
                />
                <Text style={styles.ageLabel}>meses</Text>
              </View>
            </View>
          </View>

          {/* Info box */}
          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>💡</Text>
            <Text style={styles.infoText}>
              Estos datos son esenciales para encontrar matches compatibles.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer con botón */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>Continuar</Text>
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
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 30,
    marginBottom: 30,
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
  form: {
    paddingHorizontal: 30,
  },
  fieldContainer: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  genderButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  genderButtonActive: {
    backgroundColor: '#FFE5E5',
    borderColor: '#FF6B6B',
  },
  genderButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  genderButtonTextActive: {
    color: '#FF6B6B',
  },
  ageInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  ageField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  ageInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 16,
  },
  ageLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
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
