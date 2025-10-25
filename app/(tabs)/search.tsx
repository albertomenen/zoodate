import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';
import LoadingDog from '@/components/LoadingDog';
import ErrorDog from '@/components/ErrorDog';

interface PetMarker {
  id: string;
  name: string;
  breed: string;
  age: number;
  gender: string;
  photo_url: string | null;
  user_intent: string;
  personality_tags: string[];
  latitude: number;
  longitude: number;
}

export default function SearchScreen() {
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [pets, setPets] = useState<PetMarker[]>([]);
  const [selectedPet, setSelectedPet] = useState<PetMarker | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadMapData();
  }, []);

  const loadMapData = async () => {
    try {
      // Solicitar permisos de ubicación
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a tu ubicación para mostrar el mapa');
        setLoading(false);
        return;
      }

      // Obtener ubicación del usuario
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (locationError) {
        // Si falla (simulador), usar ubicación por defecto (Madrid)
        console.log('No se pudo obtener ubicación, usando ubicación por defecto');
        setUserLocation({
          latitude: 40.4168,
          longitude: -3.7038,
        });
      }

      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Obtener mascotas cercanas con sus ubicaciones
      // Nota: Aquí usamos una consulta que obtiene todas las mascotas
      // En producción, deberías usar PostGIS para filtrar por distancia
      const { data: petsData, error } = await supabase
        .from('pets')
        .select(`
          id,
          name,
          breed,
          age,
          gender,
          user_intent,
          personality_tags,
          profiles!inner(location)
        `)
        .eq('is_active', true)
        .neq('user_id', user.id);

      if (error) throw error;

      // Procesar las mascotas y obtener sus fotos
      const petsWithLocation = await Promise.all(
        (petsData || []).map(async (pet: any) => {
          // Obtener foto
          const { data: photo } = await supabase
            .from('pet_photos')
            .select('photo_url')
            .eq('pet_id', pet.id)
            .eq('is_primary', true)
            .single();

          // Extraer coordenadas del campo location (formato PostGIS)
          // El formato es "POINT(longitude latitude)"
          const locationMatch = pet.profiles?.location?.match(/POINT\(([^ ]+) ([^ ]+)\)/);

          if (!locationMatch) {
            return null;
          }

          return {
            id: pet.id,
            name: pet.name,
            breed: pet.breed,
            age: pet.age,
            gender: pet.gender,
            photo_url: photo?.photo_url || null,
            user_intent: pet.user_intent,
            personality_tags: pet.personality_tags || [],
            longitude: parseFloat(locationMatch[1]),
            latitude: parseFloat(locationMatch[2]),
          };
        })
      );

      // Filtrar pets nulos (sin ubicación)
      const validPets = petsWithLocation.filter((pet): pet is PetMarker => pet !== null);
      setPets(validPets);
    } catch (error) {
      console.error('Error loading map data:', error);
      Alert.alert('Error', 'No pudimos cargar los datos del mapa');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerPress = (pet: PetMarker) => {
    setSelectedPet(pet);
    setModalVisible(true);
  };

  if (loading) {
    return <LoadingDog message="Cargando mapa..." />;
  }

  if (!userLocation) {
    return (
      <ErrorDog
        title="No pudimos obtener tu ubicación"
        message="Por favor activa los permisos de ubicación para usar esta función"
        onRetry={loadMapData}
        retryText="Reintentar"
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>🔍 Buscar</Text>
        <Text style={styles.subtitle}>{pets.length} mascotas cerca</Text>
      </View>

      {/* Map */}
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
        showsUserLocation
        showsMyLocationButton
      >
        {pets.map((pet) => (
          <Marker
            key={pet.id}
            coordinate={{
              latitude: pet.latitude,
              longitude: pet.longitude,
            }}
            onPress={() => handleMarkerPress(pet)}
          >
            <View style={styles.markerContainer}>
              <View style={styles.markerBubble}>
                <Text style={styles.markerText}>🐾</Text>
              </View>
              <View style={styles.markerArrow} />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Pet Detail Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedPet && (
              <ScrollView style={styles.modalScroll}>
                {selectedPet.photo_url ? (
                  <Image
                    source={{ uri: selectedPet.photo_url }}
                    style={styles.modalPhoto}
                  />
                ) : (
                  <View style={[styles.modalPhoto, styles.modalPhotoPlaceholder]}>
                    <Text style={styles.placeholderText}>🐾</Text>
                  </View>
                )}

                <View style={styles.modalInfo}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalName}>{selectedPet.name}</Text>
                    <Text style={styles.modalGender}>
                      {selectedPet.gender === 'male' ? '♂' : '♀'}
                    </Text>
                  </View>

                  <Text style={styles.modalBreed}>
                    {selectedPet.breed} • {selectedPet.age} años
                  </Text>

                  {selectedPet.personality_tags.length > 0 && (
                    <View style={styles.tagsContainer}>
                      {selectedPet.personality_tags.map((tag, index) => (
                        <View key={index} style={styles.tag}>
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {selectedPet.user_intent && (
                    <View style={styles.intentContainer}>
                      <Text style={styles.intentLabel}>Buscando:</Text>
                      <Text style={styles.intentValue}>
                        {selectedPet.user_intent === 'breeding' && '💕 Cruza / Monta'}
                        {selectedPet.user_intent === 'playdates' && '🎾 Amigos y Juegos'}
                        {selectedPet.user_intent === 'open' && '✨ Abierto a todo'}
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>Cerrar</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 15,
    alignItems: 'center',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1,
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
  },
  markerBubble: {
    backgroundColor: '#FF6B6B',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerText: {
    fontSize: 20,
  },
  markerArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FF6B6B',
    marginTop: -2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalScroll: {
    padding: 20,
  },
  modalPhoto: {
    width: '100%',
    height: 250,
    borderRadius: 16,
    marginBottom: 20,
  },
  modalPhotoPlaceholder: {
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 60,
  },
  modalInfo: {
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  modalGender: {
    fontSize: 24,
    color: '#FF6B6B',
  },
  modalBreed: {
    fontSize: 18,
    color: '#666',
    marginBottom: 15,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 15,
  },
  tag: {
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  intentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  intentLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  intentValue: {
    fontSize: 14,
    color: '#333',
  },
  closeButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
