import React from 'react';
import { Navigate } from 'react-router-dom';
import { authStore } from '../../store/authStore';

interface ProtectedRouteProps {
  allowedRoles?: string[];
  redirectTo?: string;
  children?: React.ReactNode;
}

export default function ProtectedRoute({ allowedRoles, children, redirectTo = '/login' }: ProtectedRouteProps) {
  const { adminAccessToken, adminRole } = authStore();

  if (!adminAccessToken) return <Navigate to={redirectTo} replace />;
  if (allowedRoles && !allowedRoles.includes(adminRole ?? '')) return <Navigate to={redirectTo} replace />;

  return <>{children}</>;
}
