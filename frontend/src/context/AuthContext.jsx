import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(authApi.getCurrentUser());
  const [token, setToken] = useState(authApi.getToken());
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const currentUser = authApi.getCurrentUser();
    const currentToken = authApi.getToken();
    setUser(currentUser);
    setToken(currentToken);
    setLoading(false);
  }, []);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const login = useCallback(async (username, password) => {
    try {
      const data = await authApi.login(username, password);
      setUser({ username: data.username, role: data.role });
      setToken(data.token);
      addToast(`Welcome back, ${data.username}!`, 'success');
      return data;
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please check your credentials.';
      addToast(message, 'error');
      throw err;
    }
  }, [addToast]);

  const logout = useCallback(() => {
    authApi.logout();
    setUser(null);
    setToken(null);
    addToast('You have been logged out.', 'success');
  }, [addToast]);

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    loading,
    login,
    logout,
    toasts,
    addToast,
    removeToast,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
