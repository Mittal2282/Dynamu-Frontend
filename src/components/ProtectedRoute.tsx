import React from 'react';
import { Navigate } from 'react-router-dom';
import { authStore } from '../store/authStore';

export interface ProtectedRouteProps {
  allowedRoles?: string[];
  children: React.ReactNode;
}

export default function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { adminAccessToken, adminRole } = authStore();

  if (!adminAccessToken) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(adminRole)) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
