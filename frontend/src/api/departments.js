import apiClient from './client';

export const departmentApi = {
  getAll: async () => {
    const response = await apiClient.get('/departments');
    return response.data.data || [];
  },

  getById: async (id) => {
    const response = await apiClient.get(`/departments/${id}`);
    return response.data.data;
  },

  create: async (data) => {
    const response = await apiClient.post('/departments', data);
    return response.data.data;
  },

  update: async (id, data) => {
    const response = await apiClient.put(`/departments/${id}`, data);
    return response.data.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/departments/${id}`);
    return response.data;
  },
};
