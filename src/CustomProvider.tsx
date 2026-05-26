import React, { useEffect, useState } from 'react';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { StyleProvider } from '@ant-design/cssinjs';
import { ToastProvider } from './components/ui/Toast';
import { LandingThemeProvider } from './context/LandingThemeContext';

export interface CustomProviderProps {
  children: React.ReactNode;
}

/**
 * CustomProvider — wraps the app with global providers.
 * Add new providers here as the app grows.
 */
export default function CustomProvider({ children }: CustomProviderProps) {
  const [isDark, setIsDark] = useState(
    () => document.documentElement.getAttribute('data-color-mode') !== 'light',
  );

  useEffect(() => {
    const obs = new MutationObserver(() => {
      setIsDark(document.documentElement.getAttribute('data-color-mode') !== 'light');
    });
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-color-mode'],
    });
    return () => obs.disconnect();
  }, []);

  return (
    <LandingThemeProvider>
      {/* StyleProvider with hashPriority="low" keeps antd selectors low-specificity while
          still letting antd's dynamic <style> tags appear after Tailwind's static bundle,
          which means antd component styles win over Preflight resets. */}
      <StyleProvider hashPriority="low">
        <ConfigProvider
          theme={{
            algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
            token: {
              colorPrimary:          '#FF6B00',
              colorSuccess:          '#22c55e',
              colorWarning:          '#f59e0b',
              colorError:            '#ef4444',
              fontFamily:            "'Outfit', sans-serif",
              borderRadius:           8,
              borderRadiusSM:         6,
              borderRadiusLG:        12,
              borderRadiusXS:         4,
              // Always provide surface tokens explicitly so hashPriority="low" (zero-specificity
              // :where() selectors) never loses to a background reset from Tailwind/DaisyUI.
              colorBgContainer:     isDark ? '#11141C' : '#ffffff',
              colorBgElevated:      isDark ? '#1A1D26' : '#ffffff',
              colorBgLayout:        isDark ? '#0A0C10' : '#f5f5f5',
              colorText:            isDark ? '#F5F6FA' : 'rgba(0,0,0,0.88)',
              colorTextSecondary:   isDark ? '#7B8594' : 'rgba(0,0,0,0.45)',
              colorBorder:          isDark ? 'rgba(255,255,255,0.08)' : '#d9d9d9',
              colorBorderSecondary: isDark ? 'rgba(255,255,255,0.08)' : '#f0f0f0',
              colorSplit:           isDark ? 'rgba(255,255,255,0.06)' : 'rgba(5,5,5,0.06)',
            },
            components: {
              Table: {
                headerBg:    isDark ? '#1A1D26' : '#fafafa',
                rowHoverBg:  isDark ? '#1A1D26' : '#fafafa',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#f0f0f0',
              },
              DatePicker: {
                activeBorderColor: '#FF6B00',
                cellHoverBg:       isDark ? '#1A1D26' : undefined,
              },
              Modal: {
                contentBg: isDark ? '#11141C' : '#ffffff',
                headerBg:  isDark ? '#11141C' : '#ffffff',
                footerBg:  isDark ? '#11141C' : '#ffffff',
              },
              Select: {
                optionSelectedBg: isDark ? '#FF6B001A' : undefined,
              },
              Segmented: {
                itemSelectedBg: isDark ? '#FF6B00' : undefined,
                itemSelectedColor: isDark ? '#fff' : undefined,
              },
              Input: {
                activeBorderColor: '#FF6B00',
                hoverBorderColor:  '#FF6B00',
              },
              InputNumber: {
                activeBorderColor: '#FF6B00',
                hoverBorderColor:  '#FF6B00',
              },
              Progress: {
                defaultColor: '#FF6B00',
              },
            },
          }}
        >
          <ToastProvider>
            {children}
          </ToastProvider>
        </ConfigProvider>
      </StyleProvider>
    </LandingThemeProvider>
  );
}
