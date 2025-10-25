import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configurar cómo se deben mostrar las notificaciones cuando la app está en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Solicita permisos de notificaciones y registra el token en la base de datos
 * @returns El token de notificación o null si no se otorgaron permisos
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6B6B',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('No se otorgaron permisos de notificación');
      return null;
    }

    try {
      // Obtener el token de Expo Push Notification
      token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('Push token:', token);

      // Guardar el token en la base de datos
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ push_token: token })
          .eq('id', user.id);
      }
    } catch (error) {
      console.error('Error obteniendo push token:', error);
    }
  } else {
    console.log('Debe usar un dispositivo físico para notificaciones push');
  }

  return token;
}

/**
 * Solicita permisos de notificaciones con un mensaje amigable
 * @returns true si se otorgaron permisos, false en caso contrario
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const token = await registerForPushNotificationsAsync();
    return token !== null;
  } catch (error) {
    console.error('Error al solicitar permisos de notificación:', error);
    return false;
  }
}

/**
 * Verifica si ya se tienen permisos de notificaciones
 */
export async function hasNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}
