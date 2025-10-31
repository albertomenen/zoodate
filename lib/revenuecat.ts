import Purchases, { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { Platform, Alert } from 'react-native';
import Constants from 'expo-constants';

const REVENUECAT_API_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ||
                           process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ||
                           'appl_hkzsUKuQzHqLadsRRqsRHxzqpro'; // Fallback hardcoded
const ENTITLEMENT_ID = 'Subscripcion Zoodates';

export const configureRevenueCat = async () => {
  try {
    if (!REVENUECAT_API_KEY || REVENUECAT_API_KEY === '') {
      console.error('RevenueCat API key is missing');
      return;
    }

    if (Platform.OS === 'ios') {
      await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
    }
    console.log('RevenueCat configured successfully');
  } catch (error) {
    console.error('Error configuring RevenueCat:', error);
  }
};

export const checkSubscriptionStatus = async (): Promise<boolean> => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const hasSubscription = typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
    return hasSubscription;
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return false;
  }
};

export const getOfferings = async (): Promise<PurchasesOffering | null> => {
  try {
    const offerings = await Purchases.getOfferings();
    if (offerings.current !== null) {
      return offerings.current;
    }
    return null;
  } catch (error) {
    console.error('Error getting offerings:', error);
    return null;
  }
};

export const purchasePackage = async (packageToPurchase: PurchasesPackage): Promise<{ success: boolean; cancelled?: boolean }> => {
  try {
    const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
    const hasSubscription = typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
    return { success: hasSubscription };
  } catch (error: any) {
    if (error.userCancelled) {
      return { success: false, cancelled: true };
    }
    console.error('Error purchasing package:', error);
    return { success: false };
  }
};

export const presentPaywall = async (): Promise<{ success: boolean; cancelled?: boolean }> => {
  try {
    // Obtener offerings
    const offering = await getOfferings();

    if (!offering || !offering.availablePackages || offering.availablePackages.length === 0) {
      Alert.alert('Error', 'No hay planes disponibles en este momento');
      return { success: false };
    }

    // Retornar el offering para que se muestre en un modal
    // La compra se manejará desde el componente
    return { success: false, cancelled: false };
  } catch (error) {
    console.error('Error presenting paywall:', error);
    return { success: false };
  }
};

export const restorePurchases = async () => {
  try {
    const customerInfo = await Purchases.restorePurchases();
    const hasSubscription = typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
    return { success: hasSubscription, customerInfo };
  } catch (error) {
    console.error('Error restoring purchases:', error);
    return { success: false, error };
  }
};
