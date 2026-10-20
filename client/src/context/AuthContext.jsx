import React, { createContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('fixaround_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('fixaround_token'));
  const [loading, setLoading] = useState(true);

  // Initialize and verify user on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('fixaround_token');
      if (!storedToken) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await authApi.getMe();
        if (response && response.data) {
          setUser(response.data);
          localStorage.setItem('fixaround_user', JSON.stringify(response.data));
        } else if (response && response.user) {
          setUser(response.user);
          localStorage.setItem('fixaround_user', JSON.stringify(response.user));
        }
      } catch (err) {
        console.error('Failed to restore auth session:', err);
        localStorage.removeItem('fixaround_token');
        localStorage.removeItem('fixaround_user');
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    const res = await authApi.login(credentials);
    const tokenVal = res.data?.token || res.token;
    const userData = res.data?.user || res.data || res.user;

    if (tokenVal) {
      localStorage.setItem('fixaround_token', tokenVal);
      setToken(tokenVal);
    }
    if (userData) {
      localStorage.setItem('fixaround_user', JSON.stringify(userData));
      setUser(userData);
    }
    return { user: userData, token: tokenVal };
  };

  const register = async (registrationData) => {
    const res = await authApi.register(registrationData);
    const tokenVal = res.data?.token || res.token;
    const userData = res.data?.user || res.data || res.user;

    if (tokenVal) {
      localStorage.setItem('fixaround_token', tokenVal);
      setToken(tokenVal);
    }
    if (userData) {
      localStorage.setItem('fixaround_user', JSON.stringify(userData));
      setUser(userData);
    }
    return { user: userData, token: tokenVal };
  };

  const googleLogin = async (credential, role = 'customer') => {
    const res = await authApi.googleLogin({ credential, role });
    const tokenVal = res.data?.token || res.token;
    const userData = res.data?.user || res.data || res.user;

    if (tokenVal) {
      localStorage.setItem('fixaround_token', tokenVal);
      setToken(tokenVal);
    }
    if (userData) {
      localStorage.setItem('fixaround_user', JSON.stringify(userData));
      setUser(userData);
    }
    return { user: userData, token: tokenVal };
  };

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore backend logout failure
    } finally {
      localStorage.removeItem('fixaround_token');
      localStorage.removeItem('fixaround_user');
      setUser(null);
      setToken(null);
    }
  }, []);

  const updateUser = (updatedFields) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedFields };
      localStorage.setItem('fixaround_user', JSON.stringify(merged));
      return merged;
    });
  };

  const hasRole = (role) => {
    if (!user) return false;
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(user && token),
    login,
    googleLogin,
    register,
    logout,
    updateUser,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
