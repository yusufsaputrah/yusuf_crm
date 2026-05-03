// Global authentication context.
// Stores user info and token, exposes login/logout helpers.

import { createContext, useContext, useState, useCallback } from 'react';
import { STORAGE_KEYS } from '../constants/appConstants';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  /**
   * Save token + user to state and localStorage after successful login.
   * @param {string} token
   * @param {Object} user
   */
  const login = useCallback((token, user) => {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
    setAuthUser(user);
  }, []);

  /** Clear session and redirect to login. */
  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    window.location.href = '/login';
  }, []);

  const isAuthenticated = !!authUser;
  const isManager = authUser?.role === 'manager';

  return (
    <AuthContext.Provider value={{ authUser, login, logout, isAuthenticated, isManager }}>
      {children}
    </AuthContext.Provider>
  );
};

/** Hook to consume AuthContext. */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
