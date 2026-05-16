import React, { createContext, useContext, useState, useEffect } from 'react';

interface LandingThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

const LandingThemeContext = createContext<LandingThemeContextType | undefined>(undefined);

export function LandingThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(() => {
    // Check localStorage first
    const saved = localStorage.getItem('landing-theme');
    if (saved) return saved === 'dark';
    // Then check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const toggleTheme = () => {
    setIsDark(prev => {
      const newValue = !prev;
      localStorage.setItem('landing-theme', newValue ? 'dark' : 'light');
      return newValue;
    });
  };

  return (
    <LandingThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </LandingThemeContext.Provider>
  );
}

export function useLandingTheme() {
  const context = useContext(LandingThemeContext);
  if (!context) {
    throw new Error('useLandingTheme must be used within LandingThemeProvider');
  }
  return context;
}
