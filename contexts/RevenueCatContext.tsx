import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { checkSubscriptionStatus, configureRevenueCat } from '@/lib/revenuecat';

interface RevenueCatContextType {
  isSubscribed: boolean;
  isLoading: boolean;
  checkSubscription: () => Promise<void>;
}

const RevenueCatContext = createContext<RevenueCatContextType | undefined>(undefined);

export const RevenueCatProvider = ({ children }: { children: ReactNode }) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeRevenueCat();
  }, []);

  const initializeRevenueCat = async () => {
    try {
      await configureRevenueCat();
      await checkSubscription();
    } catch (error) {
      console.error('Error initializing RevenueCat:', error);
      // Si falla RevenueCat, continuar sin él
      setIsSubscribed(false);
    } finally {
      setIsLoading(false);
    }
  };

  const checkSubscription = async () => {
    try {
      const hasSubscription = await checkSubscriptionStatus();
      setIsSubscribed(hasSubscription);
    } catch (error) {
      console.error('Error checking subscription:', error);
      // Si falla, asumir que no está suscrito
      setIsSubscribed(false);
    }
  };

  return (
    <RevenueCatContext.Provider value={{ isSubscribed, isLoading, checkSubscription }}>
      {children}
    </RevenueCatContext.Provider>
  );
};

export const useRevenueCat = () => {
  const context = useContext(RevenueCatContext);
  if (context === undefined) {
    throw new Error('useRevenueCat must be used within a RevenueCatProvider');
  }
  return context;
};
