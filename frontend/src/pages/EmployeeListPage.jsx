import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { employeeApi } from '../api/employees';
import { departmentApi } from '../api/departments';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';
import {
  Search,
  Plus,
  Download,
  Filter,
  Eye,
  Edit2,
  Trash2,
  ArrowUpDown,
  RefreshCw,
  Building,
  UserCheck,
  AlertCircle,
  X,
} from 'lucide-react';

export const EmployeeListPage = () => {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('id');
  const [sortDir, setSortDir] = useState('asc');

  // Pagination state
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isFirst, setIsFirst] = useState(true);
  const [isLast, setIsLast] = useState(true);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { addToast } = useAuth();
  const navigate = useNavigate();

  // Load departments for filter dropdown
  useEffect(() => {
    departmentApi
      .getAll()
      .then((data) => setDepartments(data))
      .catch((err) => console.error('Failed to load departments', err));
  }, []);

  // Fetch employees
  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const data = await employeeApi.getEmployees({
        search: searchTerm,
        departmentId: selectedDept || undefined,
        status: selectedStatus,
        page,
        size: pageSize,
        sortBy,
        sortDir,
      });

      setEmployees(data.content || []);
      setTotalElements(data.totalElements || 0);
      setTotalPages(data.totalPages || 0);
      setIsFirst(data.first ?? true);
      setIsLast(data.last ?? true);
    } catch (err) {
      addToast('Failed to load employee records.', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedDept, selectedStatus, page, pageSize, sortBy, sortDir, addToast]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Debounced search reset to page 0
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  const handleDeptChange = (e) => {
    setSelectedDept(e.target.value);
    setPage(0);
  };

  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    setPage(0);
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
    setPage(0);
  };

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      await employeeApi.exportCsv({
        search: searchTerm,
        departmentId: selectedDept || undefined,
        status: selectedStatus,
      });
      addToast('Employees exported to CSV successfully.', 'success');
    } catch (err) {
      addToast('Failed to export employee records to CSV.', 'error');
    } finally {
      setExporting(false);
    }
  };

  const promptDelete = (emp) => {
    setEmployeeToDelete(emp);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!employeeToDelete) return;
    setDeleting(true);
    try {
      await employeeApi.delete(employeeToDelete.id);
      addToast(`Employee '${employeeToDelete.fullName}' deleted successfully.`, 'success');
      setDeleteModalOpen(false);
      setEmployeeToDelete(null);
      fetchEmployees();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete employee.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDept('');
    setSelectedStatus('ALL');
    setSortBy('id');
    setSortDir('asc');
    setPage(0);
  };

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  return (
    <div className="page-wrapper">
      {/* Header section */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: 'var(--space-1)' }}>Employee Directory</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem' }}>
            Manage staff profiles, departmental allocations, and salary records
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button
            onClick={handleExportCsv}
            disabled={exporting || totalElements === 0}
            className="btn btn-secondary"
            title="Download CSV file matching current filters"
          >
            {exporting ? (
              <div className="spinner spinner-primary" style={{ width: '16px', height: '16px' }} />
            ) : (
              <Download size={16} />
            )}
            <span>Export CSV</span>
          </button>

          <Link to="/employees/add" className="btn btn-primary">
            <Plus size={18} />
            <span>Add Employee</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          padding: 'var(--space-4) var(--space-5)',
          marginBottom: 'var(--space-6)',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
        }}
      >
        {/* Search Input */}
        <div style={{ flex: '1 1 260px', position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          >
            <Search size={17} />
          </div>
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '38px', paddingRight: searchTerm ? '34px' : '14px' }}
            placeholder="Search by name, email, or employee ID..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                setPage(0);
              }}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Department Filter */}
        <div style={{ flex: '0 1 220px', minWidth: '180px' }}>
          <select
            className="form-control"
            value={selectedDept}
            onChange={handleDeptChange}
            aria-label="Filter by department"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        {/* Employment Status Filter Toggle */}
        <div
          style={{
            display: 'inline-flex',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '3px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {['ALL', 'Active', 'Inactive'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => handleStatusChange(status)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-xs)',
                fontSize: '0.825rem',
                fontWeight: 600,
                backgroundColor: selectedStatus === status ? 'white' : 'transparent',
                color: selectedStatus === status ? 'var(--text-main)' : 'var(--text-muted)',
                boxShadow: selectedStatus === status ? 'var(--shadow-xs)' : 'none',
                transition: 'all var(--transition-fast)',
              }}
            >
              {status === 'ALL' ? 'All Status' : status}
            </button>
          ))}
        </div>

        {/* Reset Filters button if any filter active */}
        {(searchTerm || selectedDept || selectedStatus !== 'ALL') && (
          <button
            onClick={clearFilters}
            className="btn btn-secondary btn-sm"
            style={{ color: 'var(--danger-text)', borderColor: 'var(--danger-border)' }}
            title="Reset all filters"
          >
            <RefreshCw size={14} />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Main Employee Table Card */}
      <div className="card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th
                  onClick={() => handleSort('employeeId')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>Emp ID</span>
                    <ArrowUpDown size={13} color="var(--text-muted)" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('fullName')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>Employee Name</span>
                    <ArrowUpDown size={13} color="var(--text-muted)" />
                  </div>
                </th>
                <th>Contact</th>
                <th>Department & Designation</th>
                <th
                  onClick={() => handleSort('dateOfJoining')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>Joining Date</span>
                    <ArrowUpDown size={13} color="var(--text-muted)" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('salary')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>Salary</span>
                    <ArrowUpDown size={13} color="var(--text-muted)" />
                  </div>
                </th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <div className="spinner spinner-primary" style={{ width: '28px', height: '28px' }} />
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        Fetching employee records...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--bg-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-muted)',
                        }}
                      >
                        <UserCheck size={24} />
                      </div>
                      <h4 style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>No employees found</h4>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '380px' }}>
                        No records matched your search or filters. Try adjusting your query or add a new employee.
                      </p>
                      <button onClick={clearFilters} className="btn btn-secondary btn-sm" style={{ marginTop: 'var(--space-2)' }}>
                        Clear Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id}>
                    <td>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.825rem',
                          fontWeight: 600,
                          backgroundColor: 'var(--bg-subtle)',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-xs)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        {emp.employeeId}
                      </span>
                    </td>
                    <td>
                      <div>
                        <Link
                          to={`/employees/${emp.id}`}
                          style={{
                            fontWeight: 700,
                            color: 'var(--text-main)',
                            display: 'block',
                            fontSize: '0.925rem',
                          }}
                        >
                          {emp.fullName}
                        </Link>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {emp.email}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {emp.phoneNumber}
                      </span>
                    </td>
                    <td>
                      <div>
                        <span
                          className="badge badge-dept"
                          style={{ marginBottom: '3px', display: 'inline-flex' }}
                        >
                          {emp.departmentName || 'General'}
                        </span>
                        <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                          {emp.designation}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {emp.dateOfJoining}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                        {formatCurrency(emp.salary)}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={emp.status} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 'var(--space-1)',
                        }}
                      >
                        <Link
                          to={`/employees/${emp.id}`}
                          className="btn-icon"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </Link>
                        <Link
                          to={`/employees/edit/${emp.id}`}
                          className="btn-icon"
                          title="Edit Information"
                        >
                          <Edit2 size={16} />
                        </Link>
                        <button
                          onClick={() => promptDelete(emp)}
                          className="btn-icon"
                          title="Delete Employee"
                          style={{ color: 'var(--danger)' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        <Pagination
          pageNumber={page}
          pageSize={pageSize}
          totalElements={totalElements}
          totalPages={totalPages}
          first={isFirst}
          last={isLast}
          onPageChange={(newPage) => setPage(newPage)}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(0);
          }}
        />
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Employee Record"
        message={
          employeeToDelete
            ? `Are you sure you want to delete ${employeeToDelete.fullName} (${employeeToDelete.employeeId})? This action cannot be reversed.`
            : ''
        }
        confirmText="Confirm Delete"
        cancelText="Cancel"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setEmployeeToDelete(null);
        }}
      />
    </div>
  );
};

export default EmployeeListPage;
