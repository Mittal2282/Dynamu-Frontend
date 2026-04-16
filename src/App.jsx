import { Routes, Route, Navigate } from 'react-router-dom';
import CustomProvider from './CustomProvider';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import { customerRoutes } from './consoles/Customer/routes';
import { restaurantAdminRoutes } from './consoles/RestaurantAdmin/routes';
import { superAdminRoutes } from './consoles/SuperAdmin/routes';

function App() {
  return (
    <CustomProvider>
      <BrowserRouter>
        <Routes>
          {customerRoutes}
          {restaurantAdminRoutes}
          {superAdminRoutes}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<LandingPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </CustomProvider>
  );
}

export default App;
