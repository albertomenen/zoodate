import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

interface LoadingDogProps {
  message?: string;
}

export default function LoadingDog({ message = 'Cargando...' }: LoadingDogProps) {
  return (
    <View style={styles.container}>
      <LottieView
        source={require('@/assets/animations/Long Dog.json')}
        autoPlay
        loop
        style={styles.animation}
      />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  animation: {
    width: 200,
    height: 200,
  },
  message: {
    marginTop: 20,
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
  },
});
