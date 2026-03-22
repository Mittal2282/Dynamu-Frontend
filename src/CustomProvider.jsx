import { AppProvider } from './store/AppContext';

export default function CustomProvider({ children }) {
  return (
    <AppProvider>
      {children}
    </AppProvider>
  );
}
