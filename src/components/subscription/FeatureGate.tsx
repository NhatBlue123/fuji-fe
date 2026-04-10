import React, { ReactNode } from 'react';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { FeatureAccessData } from '@/types/feature-access';

interface FeatureGateProps {
  feature: keyof FeatureAccessData['features'];
  fallback?: ReactNode;
  children: ReactNode;
  // Optional custom check, e.g., if flashcardMode === 'full'
  condition?: (featureValue: any) => boolean;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({ feature, fallback = null, children, condition }) => {
  const { features, isLoading } = useFeatureAccess();

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-10 w-full rounded-md"></div>;
  }

  const featureValue = features?.[feature];
  
  let accessGranted = false;
  
  if (condition) {
    accessGranted = condition(featureValue);
  } else if (typeof featureValue === 'boolean') {
    accessGranted = featureValue;
  } else if (typeof featureValue === 'number') {
    accessGranted = featureValue > 0 || featureValue === -1;
  } else {
    // For string specific features like 'trial' | 'basic' | 'full'
    accessGranted = !!featureValue && featureValue !== 'trial' && featureValue !== 'basic';
  }

  if (!accessGranted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
