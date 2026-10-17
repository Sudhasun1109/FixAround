import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROLES } from '../utils/constants';
import Spinner from '../components/common/Spinner';

export default function RoleRoute({ allowedRoles = [], children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <Spinner fullScreen label="Checking permissions..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isAllowed = allowedRoles.includes(user.role);

  if (!isAllowed) {
    // Redirect to proper role dashboard
    if (user.role === ROLES.ADMIN) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (user.role === ROLES.TECHNICIAN) {
      return <Navigate to="/technician/dashboard" replace />;
    }
    return <Navigate to="/customer/dashboard" replace />;
  }

  return children ? children : <Outlet />;
}
