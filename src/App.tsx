import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CustomProvider from './CustomProvider';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from './pages/LoginPage';

// lazy: keeps three/gsap out of the customer/dashboard bundles
const LandingPage = lazy(() => import('./landing/LandingPage'));
import OutOfRangePage from './pages/OutOfRangePage';
import LocationRequiredPage from './pages/LocationRequiredPage';
import { customerRoutes } from './consoles/Customer/routes';
import { restaurantAdminRoutes } from './consoles/RestaurantAdmin/routes';
import { superAdminRoutes } from './consoles/SuperAdmin/routes';

function App() {
  return (
    <CustomProvider>
      <BrowserRouter>
        <Routes>
          {restaurantAdminRoutes}
          {superAdminRoutes}
          {customerRoutes}
          <Route path="/customer/out-of-range" element={<OutOfRangePage />} />
          <Route path="/customer/location-required" element={<LocationRequiredPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <Suspense fallback={<div style={{ minHeight: '100vh', background: '#1C1815' }} />}>
                <LandingPage />
              </Suspense>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </CustomProvider>
  );
}

export default App;
