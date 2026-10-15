import apiClient from './client';

export const employeeApi = {
  getEmployees: async ({ search, departmentId, status, page = 0, size = 10, sortBy = 'id', sortDir = 'asc' }) => {
    const params = new URLSearchParams();
    if (search && search.trim()) params.append('search', search.trim());
    if (departmentId) params.append('departmentId', departmentId);
    if (status && status !== 'ALL') params.append('status', status);
    params.append('page', page);
    params.append('size', size);
    params.append('sortBy', sortBy);
    params.append('sortDir', sortDir);

    const response = await apiClient.get(`/employees?${params.toString()}`);
    return response.data.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/employees/${id}`);
    return response.data.data;
  },

  create: async (data) => {
    const response = await apiClient.post('/employees', data);
    return response.data.data;
  },

  update: async (id, data) => {
    const response = await apiClient.put(`/employees/${id}`, data);
    return response.data.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/employees/${id}`);
    return response.data;
  },

  exportCsv: async ({ search, departmentId, status }) => {
    const params = new URLSearchParams();
    if (search && search.trim()) params.append('search', search.trim());
    if (departmentId) params.append('departmentId', departmentId);
    if (status && status !== 'ALL') params.append('status', status);

    const response = await apiClient.get(`/employees/export/csv?${params.toString()}`, {
      responseType: 'blob',
    });

    // Trigger browser file download
    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `employees_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
