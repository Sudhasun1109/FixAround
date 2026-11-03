import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Spinner from '../components/common/Spinner';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Spinner fullScreen label="Verifying session..." />;
  }

  if (!isAuthenticated) {
    const target = location.pathname.startsWith('/admin') ? '/admin/login' : '/login';
    return <Navigate to={target} state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
}
