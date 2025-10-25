import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserIntent = 'breeding' | 'playdates' | 'open';

export interface OnboardingData {
  // Paso 2: Datos básicos
  petName: string;
  breed: string;
  gender: 'male' | 'female' | null;
  ageYears: number;
  ageMonths: number;

  // Paso 3: Foto
  profilePhotoUri: string | null;

  // Paso 4: Intención
  userIntent: UserIntent | null;

  // Paso 5: Personalidad
  personalityTags: string[];

  // Paso 6: Ubicación y dueño
  ownerName: string;
  location: {
    latitude: number | null;
    longitude: number | null;
    cityName: string;
  };
}

interface OnboardingContextType {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  resetData: () => void;
}

const initialData: OnboardingData = {
  petName: '',
  breed: '',
  gender: null,
  ageYears: 0,
  ageMonths: 0,
  profilePhotoUri: null,
  userIntent: null,
  personalityTags: [],
  ownerName: '',
  location: {
    latitude: null,
    longitude: null,
    cityName: '',
  },
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<OnboardingData>(initialData);

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const resetData = () => {
    setData(initialData);
  };

  return (
    <OnboardingContext.Provider value={{ data, updateData, resetData }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}
