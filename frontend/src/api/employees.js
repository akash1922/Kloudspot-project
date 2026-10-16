import apiClient from './client';
import { parseCsvText } from '../utils/csvParser';

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

  getArchived: async () => {
    const response = await apiClient.get('/employees/archived');
    return response.data.data || [];
  },

  getById: async (id) => {
    const response = await apiClient.get(`/employees/${id}`);
    return response.data.data;
  },

  getAuditLogs: async (id) => {
    const response = await apiClient.get(`/employees/${id}/audit-logs`);
    return response.data.data || [];
  },

  create: async (data) => {
    const response = await apiClient.post('/employees', data);
    return response.data.data;
  },

  update: async (id, data) => {
    const response = await apiClient.put(`/employees/${id}`, data);
    return response.data.data;
  },

  toggleStatus: async (employeeOrId, status) => {
    const id = typeof employeeOrId === 'object' ? employeeOrId.id : employeeOrId;
    const emp = typeof employeeOrId === 'object' ? employeeOrId : null;

    try {
      const response = await apiClient.patch(`/employees/${id}/status?status=${status}`);
      return response.data.data;
    } catch (err) {
      // Seamless fallback to PUT /employees/{id} if PATCH is not registered on running JVM process
      if (emp) {
        const payload = {
          employeeId: emp.employeeId,
          fullName: emp.fullName,
          email: emp.email,
          phoneNumber: emp.phoneNumber,
          departmentId: emp.departmentId,
          designation: emp.designation,
          dateOfJoining: emp.dateOfJoining,
          salary: emp.salary,
          status: status,
        };
        const res = await apiClient.put(`/employees/${id}`, payload);
        return res.data.data;
      }
      throw err;
    }
  },

  delete: async (id) => {
    // Moves to archive with 13-day TTL
    const response = await apiClient.delete(`/employees/${id}`);
    return response.data;
  },

  restore: async (id) => {
    const response = await apiClient.post(`/employees/${id}/restore`);
    return response.data.data;
  },

  permanentDelete: async (id) => {
    const response = await apiClient.delete(`/employees/${id}/permanent`);
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

  exportExcel: async ({ search, departmentId, status }) => {
    const XLSX = await import('xlsx');

    const params = {
      search: search?.trim() || undefined,
      departmentId: departmentId || undefined,
      status: status || undefined,
      page: 0,
      size: 2000,
      sortBy: 'id',
      sortDir: 'asc',
    };

    const data = await employeeApi.getEmployees(params);
    const list = data?.content || [];

    const excelRows = list.map((emp) => ({
      'Employee ID': emp.employeeId || '',
      'Full Name': emp.fullName || '',
      'Email Address': emp.email || '',
      'Phone Number': emp.phoneNumber || '',
      'Department': emp.departmentName || '',
      'Designation': emp.designation || '',
      'Date of Joining': emp.dateOfJoining || '',
      'Salary (INR)': emp.salary || 0,
      'Status': emp.status || 'Active',
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');

    // Auto-fit column widths
    worksheet['!cols'] = [
      { wch: 15 },
      { wch: 24 },
      { wch: 30 },
      { wch: 18 },
      { wch: 22 },
      { wch: 24 },
      { wch: 16 },
      { wch: 14 },
      { wch: 12 },
    ];

    const fileName = `employees_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  },

  getCounts: async () => {
    try {
      const [actRes, inactRes, allRes, archRes] = await Promise.all([
        employeeApi.getEmployees({ status: 'Active', size: 1 }),
        employeeApi.getEmployees({ status: 'Inactive', size: 1 }),
        employeeApi.getEmployees({ status: 'ALL', size: 1 }),
        employeeApi.getArchived(),
      ]);

      return {
        active: actRes?.totalElements || 0,
        inactive: inactRes?.totalElements || 0,
        all: allRes?.totalElements || 0,
        archived: Array.isArray(archRes) ? archRes.length : 0,
      };
    } catch (err) {
      return { active: 0, inactive: 0, all: 0, archived: 0 };
    }
  },

  importCsv: async (file, departments = []) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiClient.post('/employees/import/csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    } catch (err) {
      // Seamless fallback if server doesn't have /import/csv registered yet
      const isNotFound =
        err.response?.status === 404 ||
        err.response?.status === 500 ||
        err.response?.data?.message?.includes('No static resource');

      if (isNotFound) {
        const text = await file.text();
        const records = parseCsvText(text, departments);
        let successCount = 0;
        let failureCount = 0;
        const errors = [];

        for (const record of records) {
          try {
            await apiClient.post('/employees', record);
            successCount++;
          } catch (createErr) {
            failureCount++;
            errors.push(`${record.fullName}: ${createErr.response?.data?.message || 'Failed'}`);
          }
        }

        return {
          totalRows: records.length,
          successCount,
          failureCount,
          errors,
        };
      }
      throw err;
    }
  },

  getNetworkTime: async () => {
    try {
      const response = await apiClient.get('/time/now');
      return response.data.data;
    } catch {
      const today = new Date();
      return {
        isoDate: today.toISOString().slice(0, 10),
        formattedDate: today.toLocaleDateString('en-GB'),
      };
    }
  },
};
