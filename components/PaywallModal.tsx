import React, { useEffect } from 'react';
import { Modal, Alert, Platform } from 'react-native';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaywallModal({ visible, onClose, onSuccess }: PaywallModalProps) {
  useEffect(() => {
    if (visible) {
      presentPaywall();
    }
  }, [visible]);

  const presentPaywall = async () => {
    try {
      const paywallResult = await RevenueCatUI.presentPaywall();

      switch (paywallResult) {
        case PAYWALL_RESULT.PURCHASED:
        case PAYWALL_RESULT.RESTORED:
          // Usuario compró o restauró suscripción
          Alert.alert('¡Éxito!', 'Suscripción activada correctamente');
          onSuccess();
          onClose();
          break;
        case PAYWALL_RESULT.CANCELLED:
          // Usuario cerró el paywall
          onClose();
          break;
        case PAYWALL_RESULT.ERROR:
          Alert.alert('Error', 'Ocurrió un error al mostrar el paywall');
          onClose();
          break;
        case PAYWALL_RESULT.NOT_PRESENTED:
          // El paywall no se pudo mostrar
          Alert.alert('Error', 'No se pudo cargar el paywall');
          onClose();
          break;
      }
    } catch (error) {
      console.error('Error presenting paywall:', error);
      Alert.alert('Error', 'Ocurrió un error al procesar la compra');
      onClose();
    }
  };

  // El paywall de RevenueCat se presenta automáticamente,
  // no necesitamos renderizar nada
  return (
    <Modal
      visible={false}
      transparent={true}
    />
  );
}
