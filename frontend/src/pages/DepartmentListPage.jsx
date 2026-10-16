import React, { useState, useEffect } from 'react';
import { departmentApi } from '../api/departments';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/ConfirmModal';
import { formatDate } from '../utils/formatters';
import { Building2, Plus, Edit2, Trash2, Users, AlertCircle, X, Check } from 'lucide-react';

export const DepartmentListPage = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { addToast } = useAuth();

  const loadDepartments = async () => {
    setLoading(true);
    try {
      const data = await departmentApi.getAll();
      setDepartments(data);
    } catch (err) {
      addToast('Failed to load departments', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const openAddModal = () => {
    setEditingDept(null);
    setFormData({ name: '', description: '' });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (dept) => {
    setEditingDept(dept);
    setFormData({ name: dept.name, description: dept.description || '' });
    setFormErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = 'Department name is required';
    } else if (formData.name.trim().length < 2) {
      errs.name = 'Department name must be at least 2 characters';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      if (editingDept) {
        await departmentApi.update(editingDept.id, formData);
        addToast(`Department '${formData.name}' updated successfully`, 'success');
      } else {
        await departmentApi.create(formData);
        addToast(`Department '${formData.name}' created successfully`, 'success');
      }
      setModalOpen(false);
      loadDepartments();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save department';
      addToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const promptDelete = (dept) => {
    if (dept.employeeCount > 0) {
      addToast(
        `Cannot delete '${dept.name}' because it currently has ${dept.employeeCount} active employee(s) assigned.`,
        'error'
      );
      return;
    }
    setDeptToDelete(dept);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deptToDelete) return;
    setDeleting(true);
    try {
      await departmentApi.delete(deptToDelete.id);
      addToast(`Department '${deptToDelete.name}' deleted successfully`, 'success');
      setDeleteModalOpen(false);
      setDeptToDelete(null);
      loadDepartments();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete department', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page-wrapper">
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
          <h1 style={{ fontSize: '1.75rem', marginBottom: 'var(--space-1)' }}>Department Management</h1>

        </div>

        <button onClick={openAddModal} className="btn btn-primary">
          <Plus size={18} />
          <span>Add Department</span>
        </button>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Department Name</th>
                <th>Description</th>
                <th>Count</th>
                <th>Created Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                    <div className="spinner spinner-primary" style={{ width: '28px', height: '28px', margin: '0 auto' }} />
                  </td>
                </tr>
              ) : departments.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                    <p style={{ color: 'var(--text-muted)' }}>No departments found. Add one to get started.</p>
                  </td>
                </tr>
              ) : (
                departments.map((dept) => (
                  <tr key={dept.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--primary-subtle)',
                            color: 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Building2 size={16} />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{dept.name}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {dept.description || '—'}
                      </span>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: dept.employeeCount > 0 ? 'var(--primary-subtle)' : 'var(--bg-subtle)',
                          color: dept.employeeCount > 0 ? 'var(--primary-text)' : 'var(--text-muted)',
                          border: `1px solid ${dept.employeeCount > 0 ? '#c7d2fe' : 'var(--border-subtle)'}`,
                          gap: '6px',
                        }}
                      >
                        <Users size={13} />
                        <span>{dept.employeeCount} employee{dept.employeeCount !== 1 ? 's' : ''}</span>
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {dept.createdAt ? formatDate(dept.createdAt) : '—'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 'var(--space-1)' }}>
                        <button
                          onClick={() => openEditModal(dept)}
                          className="btn-icon"
                          title="Edit Department"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => promptDelete(dept)}
                          className="btn-icon"
                          title={dept.employeeCount > 0 ? 'Cannot delete with active staff' : 'Delete Department'}
                          style={{ color: dept.employeeCount > 0 ? 'var(--text-muted)' : 'var(--danger)' }}
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
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => !submitting && setModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="card-header">
              <h3 style={{ fontSize: '1.15rem' }}>
                {editingDept ? 'Edit Department' : 'Create New Department'}
              </h3>
              <button
                className="btn-icon"
                onClick={() => setModalOpen(false)}
                disabled={submitting}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label required" htmlFor="deptName">
                    Department Name
                  </label>
                  <input
                    id="deptName"
                    type="text"
                    className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
                    placeholder="e.g. Artificial Intelligence Research"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData((p) => ({ ...p, name: e.target.value }));
                      if (formErrors.name) setFormErrors((p) => ({ ...p, name: null }));
                    }}
                    required
                  />
                  {formErrors.name && <div className="form-error">{formErrors.name}</div>}
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="deptDesc">
                    Description (Optional)
                  </label>
                  <textarea
                    id="deptDesc"
                    rows={3}
                    className="form-control"
                    placeholder="Brief summary of department responsibilities..."
                    value={formData.description}
                    onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  />
                </div>
              </div>

              <div
                style={{
                  padding: 'var(--space-4) var(--space-6)',
                  backgroundColor: 'var(--bg-subtle)',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 'var(--space-3)',
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? (
                    <div className="spinner" style={{ width: '16px', height: '16px' }} />
                  ) : (
                    <span>{editingDept ? 'Save Changes' : 'Create Department'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Department"
        message={
          deptToDelete
            ? `Are you sure you want to delete the department '${deptToDelete.name}'? This action cannot be reversed.`
            : ''
        }
        confirmText="Confirm Delete"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setDeptToDelete(null);
        }}
      />
    </div>
  );
};

export default DepartmentListPage;
