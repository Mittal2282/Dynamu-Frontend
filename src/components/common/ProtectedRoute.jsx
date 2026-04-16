import { Navigate } from 'react-router-dom';
import { authStore } from '../../store/authStore';

export default function ProtectedRoute({ allowedRoles, children }) {
  const { adminAccessToken, adminRole } = authStore();

  if (!adminAccessToken) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(adminRole)) return <Navigate to="/login" replace />;

  return children;
}
