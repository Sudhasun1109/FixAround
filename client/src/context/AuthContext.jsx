
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import { authApi } from '../services/api';


const AuthContext = createContext(null);

const TOKEN_KEY = 'fixaround_token';
const USER_KEY = 'fixaround_user';

/**
 * Supports API responses such as:
 * { user: {...}, token: "..." }
 * { data: { user: {...}, token: "..." } }
 * { data: { data: { user: {...}, token: "..." } } }
 */
const normalizeAuthResponse = (response) => {
  let payload = response;

  for (let i = 0; i < 4; i++) {
    if (!payload || typeof payload !== 'object') break;

    const user = payload.user;
    const token =
      payload.token ||
      payload.accessToken ||
      payload.access_token;

    if (user && typeof user === 'object' && token) {
      return { user, token };
    }

    if (payload.data && typeof payload.data === 'object') {
      payload = payload.data;
    } else {
      break;
    }
  }

  return { user: null, token: null };
};

/**
 * Supports profile responses such as:
 * { user: {...} }
 * { data: { user: {...} } }
 * { data: {...user fields} }
 */
const normalizeUserResponse = (response) => {
  let payload = response;

  for (let i = 0; i < 4; i++) {
    if (!payload || typeof payload !== 'object') return null;

    if (
      payload.user &&
      typeof payload.user === 'object'
    ) {
      return payload.user;
    }

    if (
      payload.id != null ||
      payload.user_id != null ||
      payload.email
    ) {
      return payload;
    }

    if (payload.data && typeof payload.data === 'object') {
      payload = payload.data;
    } else {
      break;
    }
  }

  return null;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem(USER_KEY);
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.error('Could not read saved user:', error);
      localStorage.removeItem(USER_KEY);
      return null;
    }
  });

  const [token, setToken] = useState(
    () => localStorage.getItem(TOKEN_KEY)
  );

  const [loading, setLoading] = useState(true);

  const saveAuth = useCallback((userData, tokenValue) => {
    if (!userData || typeof userData !== 'object') {
      throw new Error('Valid user details were not returned by the server.');
    }

    if (!tokenValue || typeof tokenValue !== 'string') {
      throw new Error('Authentication token was not returned by the server.');
    }

    localStorage.setItem(TOKEN_KEY, tokenValue);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));

    setToken(tokenValue);
    setUser(userData);
  }, []);

  // Restore and verify an existing session.
  useEffect(() => {
    let cancelled = false;

    const initializeAuth = async () => {
      const savedToken = localStorage.getItem(TOKEN_KEY);

      if (!savedToken) {
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const response = await authApi.getMe();
        const currentUser = normalizeUserResponse(response);

        if (!currentUser) {
          throw new Error('Could not retrieve valid user details.');
        }

        if (!cancelled) {
          localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
          setUser(currentUser);
          setToken(savedToken);
        }
      } catch (error) {
        console.error('Session verification failed:', error);

        if (!cancelled) {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const response = await authApi.login(credentials);
    const { user: userData, token: tokenValue } =
      normalizeAuthResponse(response);

    if (!userData || !tokenValue) {
      console.error('Unexpected login response:', response);
      throw new Error(
        'Login response is missing user details or token. Check the backend response.'
      );
    }

    saveAuth(userData, tokenValue);

    return { user: userData, token: tokenValue };
  }, [saveAuth]);

  const register = useCallback(async (userData) => {
    const response = await authApi.register(userData);
    const auth = normalizeAuthResponse(response);

    if (!auth.user || !auth.token) {
      console.error('Unexpected registration response:', response);
      throw new Error(
        'Registration response is missing user details or token.'
      );
    }

    saveAuth(auth.user, auth.token);

    return { user: auth.user, token: auth.token };
  }, [saveAuth]);

  const googleLogin = useCallback(async (credential, role = 'CUSTOMER') => {
    const response = await authApi.googleLogin({
      credential,
      role,
    });

    const auth = normalizeAuthResponse(response);

    if (!auth.user || !auth.token) {
      console.error('Unexpected Google login response:', response);
      throw new Error(
        'Google login response is missing user details or token.'
      );
    }

    saveAuth(auth.user, auth.token);

    return { user: auth.user, token: auth.token };
  }, [saveAuth]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setUser(null);
      setToken(null);
    }
  }, []);

  const updateUser = useCallback((updatedUser) => {
    if (!updatedUser || typeof updatedUser !== 'object') return;

    setUser((currentUser) => {
      const mergedUser = { ...(currentUser || {}), ...updatedUser };

      localStorage.setItem(USER_KEY, JSON.stringify(mergedUser));

      return mergedUser;
    });
  }, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(user && token),
    login,
    register,
    googleLogin,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
export { AuthContext };

export default AuthContext;
