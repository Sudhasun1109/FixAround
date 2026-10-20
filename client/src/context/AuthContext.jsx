
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
 * Normalize authentication response.
 *
 * Backend format:
 * {
 *   success: true,
 *   message: "Login successful",
 *   data: {
 *     user: {...},
 *     token: "..."
 *   }
 * }
 */
const normalizeAuthResponse = (response) => {
  const candidates = [
    response?.data,
    response?.data?.data,
    response?.result,
    response?.data?.result,
    response,
  ].filter(Boolean);

  for (const item of candidates) {
    const userData =
      item?.user ||
      item?.profile ||
      item?.customer ||
      null;

    const tokenValue =
      item?.token ||
      item?.accessToken ||
      item?.access_token ||
      null;

    if (
      userData &&
      typeof userData === 'object' &&
      typeof tokenValue === 'string' &&
      tokenValue.length > 0
    ) {
      return {
        user: userData,
        token: tokenValue,
      };
    }
  }

  return {
    user: null,
    token: null,
  };
};

/**
 * Normalize user profile response.
 */
const normalizeUserResponse = (response) => {
  const candidates = [
    response?.data,
    response?.data?.data,
    response?.user,
    response,
  ].filter(Boolean);

  for (const item of candidates) {
    if (item?.user && typeof item.user === 'object') {
      return item.user;
    }

    if (
      item &&
      typeof item === 'object' &&
      (item.id != null ||
        item.user_id != null ||
        item.email)
    ) {
      return item;
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
      console.error('Failed to restore saved user:', error);
      localStorage.removeItem(USER_KEY);
      return null;
    }
  });

  const [token, setToken] = useState(() =>
    localStorage.getItem(TOKEN_KEY)
  );

  const [loading, setLoading] = useState(true);

  /**
   * Save user and token after successful authentication.
   */
  const saveAuth = useCallback((userData, tokenValue) => {
    if (!userData || typeof userData !== 'object') {
      throw new Error('Invalid user details received from server.');
    }

    if (
      typeof tokenValue !== 'string' ||
      tokenValue.length === 0
    ) {
      throw new Error('Invalid authentication token received from server.');
    }

    localStorage.setItem(TOKEN_KEY, tokenValue);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));

    setToken(tokenValue);
    setUser(userData);
  }, []);

  /**
   * Verify an existing session when the app loads.
   */
  useEffect(() => {
    let cancelled = false;

    const initializeAuth = async () => {
      const savedToken = localStorage.getItem(TOKEN_KEY);

      if (!savedToken) {
        if (!cancelled) {
          setLoading(false);
        }
        return;
      }

      try {
        const response = await authApi.getMe();
        const currentUser = normalizeUserResponse(response);

        if (!currentUser) {
          throw new Error('Unable to retrieve the authenticated user.');
        }

        if (!cancelled) {
          localStorage.setItem(
            USER_KEY,
            JSON.stringify(currentUser)
          );

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
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Email and password login.
   */
  const login = useCallback(
    async (credentials) => {
      const response = await authApi.login(credentials);

      // Log response structure for debugging.
      // Do not log or share the actual token.
      console.log('FixAround login response:', {
        success: response?.success,
        message: response?.message,
        dataExists: Boolean(response?.data),
        userExists: Boolean(
          response?.data?.user ||
          response?.user
        ),
        tokenExists: Boolean(
          response?.data?.token ||
          response?.data?.accessToken ||
          response?.token
        ),
      });

      const { user: userData, token: tokenValue } =
        normalizeAuthResponse(response);

      if (!userData || !tokenValue) {
        console.error(
          'Unexpected login response structure:',
          response
        );

        throw new Error(
          'Login response is missing user details or token. Check the backend response.'
        );
      }

      saveAuth(userData, tokenValue);

      return {
        user: userData,
        token: tokenValue,
      };
    },
    [saveAuth]
  );

  /**
   * Register a new user.
   */
  const register = useCallback(
    async (userData) => {
      const response = await authApi.register(userData);

      const {
        user: createdUser,
        token: tokenValue,
      } = normalizeAuthResponse(response);

      if (!createdUser || !tokenValue) {
        console.error(
          'Unexpected registration response structure:',
          response
        );

        throw new Error(
          'Registration response is missing user details or token.'
        );
      }

      saveAuth(createdUser, tokenValue);

      return {
        user: createdUser,
        token: tokenValue,
      };
    },
    [saveAuth]
  );

  /**
   * Google login.
   */
  const googleLogin = useCallback(
    async (credential, role = 'customer') => {
      const response = await authApi.googleLogin({
        credential,
        role,
      });

      const {
        user: googleUser,
        token: tokenValue,
      } = normalizeAuthResponse(response);

      if (!googleUser || !tokenValue) {
        console.error(
          'Unexpected Google login response structure:',
          response
        );

        throw new Error(
          'Google login response is missing user details or token.'
        );
      }

      saveAuth(googleUser, tokenValue);

      return {
        user: googleUser,
        token: tokenValue,
      };
    },
    [saveAuth]
  );

  /**
   * Log out the current user.
   */
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);

      setToken(null);
      setUser(null);
    }
  }, []);

  /**
   * Update user details in the local session.
   */
  const updateUser = useCallback(
    (updatedData) => {
      setUser((currentUser) => {
        if (!currentUser) {
          return currentUser;
        }

        const nextUser = {
          ...currentUser,
          ...updatedData,
        };

        localStorage.setItem(
          USER_KEY,
          JSON.stringify(nextUser)
        );

        return nextUser;
      });
    },
    []
  );

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
    throw new Error(
      'useAuth must be used within an AuthProvider'
    );
  }

  return context;
};

// Required if another file imports { AuthContext }.
export { AuthContext };

export default AuthContext;
