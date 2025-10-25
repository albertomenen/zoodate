import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboarding } from '@/contexts/OnboardingContext';
import * as ImagePicker from 'expo-image-picker';

export default function Step3Photo() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  const [photoUri, setPhotoUri] = useState<string | null>(data.profilePhotoUri);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tus fotos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu cámara');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleContinue = () => {
    if (!photoUri) {
      Alert.alert('Foto requerida', `¡${data.petName} necesita una foto para brillar!`);
      return;
    }

    updateData({ profilePhotoUri: photoUri });
    router.push('/(onboarding)/step4-intent');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Atrás</Text>
        </TouchableOpacity>
        <Text style={styles.stepIndicator}>Paso 3 de 6</Text>
        <Text style={styles.title}>¡Que {data.petName} brille!</Text>
        <Text style={styles.subtitle}>
          Una buena foto es la clave para un buen match. Sube su mejor foto de perfil.
        </Text>
      </View>

      <View style={styles.content}>
        {photoUri ? (
          <TouchableOpacity style={styles.photoContainer} onPress={pickImage}>
            <Image source={{ uri: photoUri }} style={styles.photo} />
            <View style={styles.changePhotoOverlay}>
              <Text style={styles.changePhotoText}>Cambiar foto</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.placeholderIcon}>📷</Text>
            <Text style={styles.placeholderText}>Aún no hay foto</Text>
          </View>
        )}

        <View style={styles.buttonGroup}>
          <TouchableOpacity style={styles.actionButton} onPress={pickImage}>
            <Text style={styles.actionButtonIcon}>🖼️</Text>
            <Text style={styles.actionButtonText}>Subir foto</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={takePhoto}>
            <Text style={styles.actionButtonIcon}>📸</Text>
            <Text style={styles.actionButtonText}>Tomar foto</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoText}>
            ¡El amor (perruno) entra por los ojos! Las fotos de calidad consiguen un 90% más de interés.
          </Text>
        </View>
      </View>

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
  content: {
    flex: 1,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  photoContainer: {
    width: 250,
    height: 250,
    borderRadius: 125,
    overflow: 'hidden',
    marginBottom: 30,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  changePhotoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 12,
    alignItems: 'center',
  },
  changePhotoText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  photoPlaceholder: {
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    marginBottom: 30,
  },
  placeholderIcon: {
    fontSize: 60,
    marginBottom: 10,
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  actionButtonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
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
