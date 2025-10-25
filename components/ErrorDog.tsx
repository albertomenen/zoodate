import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import LottieView from 'lottie-react-native';

interface ErrorDogProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryText?: string;
}

export default function ErrorDog({
  title = 'Oops!',
  message = 'Algo salió mal',
  onRetry,
  retryText = 'Reintentar',
}: ErrorDogProps) {
  console.log('ErrorDog rendering with title:', title);

  return (
    <View style={styles.container}>
      <LottieView
        source={require('@/assets/animations/Error State - Dog.json')}
        autoPlay
        loop
        style={styles.animation}
        resizeMode="contain"
      />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>{retryText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 40,
  },
  animation: {
    width: 300,
    height: 300,
  },
  title: {
    marginTop: 20,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  message: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    marginTop: 30,
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
