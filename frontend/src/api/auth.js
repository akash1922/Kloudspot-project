import apiClient from './client';

export const authApi = {
  login: async (username, password) => {
    const response = await apiClient.post('/auth/login', { username, password });
    if (response.data && response.data.data) {
      const { token, username: user, role } = response.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({ username: user, role }));
      return response.data.data;
    }
    throw new Error('Invalid response structure from server');
  },

  register: async (username, password) => {
    const response = await apiClient.post('/auth/register', { username, password });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  getToken: () => localStorage.getItem('token'),
};
