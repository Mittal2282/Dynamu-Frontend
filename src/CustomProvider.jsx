import { ToastProvider } from './components/ui/Toast';

/**
 * CustomProvider — wraps the app with global providers.
 * Add new providers here as the app grows.
 */
export default function CustomProvider({ children }) {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  );
}
