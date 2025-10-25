import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export interface Pet {
  id: string;
  name: string;
  age: number;
  breed: string;
  bio: string;
  species: string;
  gender: string;
  photo_url?: string;
  personality_tags?: string[];
  user_intent?: string;
  distance?: number;
}

interface PetCardProps {
  pet: Pet;
}

export default function PetCard({ pet }: PetCardProps) {
  const getIntentIcon = (intent?: string) => {
    switch (intent) {
      case 'breeding':
        return '💕';
      case 'playdates':
        return '🎾';
      case 'open':
        return '✨';
      default:
        return '🐾';
    }
  };

  return (
    <View style={styles.card}>
      {/* Foto */}
      <View style={styles.imageContainer}>
        {pet.photo_url ? (
          <Image source={{ uri: pet.photo_url }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>🐕</Text>
          </View>
        )}
      </View>

      {/* Información */}
      <View style={styles.infoContainer}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>
            {pet.name}, {pet.age}
          </Text>
          <Text style={styles.genderIcon}>{pet.gender === 'male' ? '♂️' : '♀️'}</Text>
        </View>

        <Text style={styles.breed}>{pet.breed}</Text>

        {pet.distance && (
          <Text style={styles.distance}>📍 A {pet.distance.toFixed(1)} km</Text>
        )}

        {pet.bio && <Text style={styles.bio} numberOfLines={2}>{pet.bio}</Text>}

        {/* Tags de personalidad */}
        {pet.personality_tags && pet.personality_tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {pet.personality_tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Intención */}
        <View style={styles.intentContainer}>
          <Text style={styles.intentIcon}>{getIntentIcon(pet.user_intent)}</Text>
          <Text style={styles.intentText}>
            {pet.user_intent === 'breeding'
              ? 'Busca cruza'
              : pet.user_intent === 'playdates'
              ? 'Busca jugar'
              : 'Abierto a todo'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: width - 40,
    height: height * 0.7,
    borderRadius: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: '60%',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 80,
  },
  infoContainer: {
    flex: 1,
    padding: 20,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  genderIcon: {
    fontSize: 24,
    marginLeft: 10,
  },
  breed: {
    fontSize: 18,
    color: '#666',
    marginBottom: 5,
  },
  distance: {
    fontSize: 14,
    color: '#FF6B6B',
    marginBottom: 10,
  },
  bio: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  tag: {
    backgroundColor: '#FFE5E5',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 12,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  intentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 'auto',
  },
  intentIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  intentText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
});
