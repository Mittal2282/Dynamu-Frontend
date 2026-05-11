import React from 'react';
import { ToastProvider } from './components/ui/Toast';

export interface CustomProviderProps {
  children: React.ReactNode;
}

/**
 * CustomProvider — wraps the app with global providers.
 * Add new providers here as the app grows.
 */
export default function CustomProvider({ children }: CustomProviderProps) {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  );
}
