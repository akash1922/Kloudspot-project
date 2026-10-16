import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { employeeApi } from '../api/employees';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/ConfirmModal';
import { formatDate, formatCurrency } from '../utils/formatters';
import { Archive, RotateCcw, Trash2, ArrowLeft, Clock, AlertTriangle, ShieldAlert } from 'lucide-react';

export const ArchivePage = () => {
  const [archivedEmployees, setArchivedEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionModal, setActionModal] = useState({ open: false, type: '', employee: null });
  const [processing, setProcessing] = useState(false);

  const { addToast } = useAuth();

  const loadArchived = async () => {
    setLoading(true);
    try {
      const data = await employeeApi.getArchived();
      setArchivedEmployees(data);
    } catch (err) {
      addToast('Failed to load archived records.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArchived();
  }, []);

  const handleRestore = async (emp) => {
    setProcessing(true);
    try {
      await employeeApi.restore(emp.id);
      addToast(`Employee '${emp.fullName}' restored back to active directory!`, 'success');
      setActionModal({ open: false, type: '', employee: null });
      loadArchived();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to restore employee.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handlePermanentDelete = async (emp) => {
    setProcessing(true);
    try {
      await employeeApi.permanentDelete(emp.id);
      addToast(`Employee '${emp.fullName}' permanently purged from database.`, 'success');
      setActionModal({ open: false, type: '', employee: null });
      loadArchived();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to purge employee.', 'error');
    } finally {
      setProcessing(false);
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <ArrowLeft size={14} />
              <span>Back to Directory</span>
            </Link>
          </div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: 'var(--space-1)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Archive size={26} color="var(--primary)" />
            <span>Employee Archive (13-Day Retention)</span>
          </h1>

        </div>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Emp ID</th>
                <th>Employee Name</th>
                <th>Department & Role</th>
                <th>Deleted On</th>
                <th>TTL Remaining</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                    <div className="spinner spinner-primary" style={{ width: '28px', height: '28px', margin: '0 auto' }} />
                  </td>
                </tr>
              ) : archivedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
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
                        <Archive size={24} />
                      </div>
                      <h4 style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>Archive is Empty</h4>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '380px' }}>
                        No records currently residing in the 13-day recycle retention pool.
                      </p>
                      <Link to="/" className="btn btn-secondary btn-sm" style={{ marginTop: 'var(--space-2)' }}>
                        Return to Active Directory
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                archivedEmployees.map((emp) => (
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
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{emp.fullName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{emp.email}</div>
                    </td>
                    <td>
                      <span className="badge badge-dept" style={{ marginBottom: '2px', display: 'inline-flex' }}>
                        {emp.departmentName || 'General'}
                      </span>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{emp.designation}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {emp.archivedAt ? formatDate(emp.archivedAt.slice(0, 10)) : 'Recently'}
                      </span>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: emp.ttlDaysRemaining <= 3 ? 'var(--danger-subtle)' : 'var(--warning-subtle)',
                          color: emp.ttlDaysRemaining <= 3 ? 'var(--danger-text)' : 'var(--warning-text)',
                          border: `1px solid ${emp.ttlDaysRemaining <= 3 ? 'var(--danger-border)' : 'var(--warning-border)'}`,
                          gap: '6px',
                        }}
                      >
                        <Clock size={12} />
                        <span>{emp.ttlDaysRemaining !== null ? `${emp.ttlDaysRemaining} days remaining` : '13 days TTL'}</span>
                      </span>
                    </td>
                    <td className="col-actions">
                      <div style={{ display: 'inline-flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => setActionModal({ open: true, type: 'restore', employee: emp })}
                          className="btn btn-secondary btn-sm"
                          title="Restore back to active directory"
                          style={{ color: 'var(--success-text)', borderColor: 'var(--success-border)' }}
                        >
                          <RotateCcw size={14} />
                          <span>Restore</span>
                        </button>
                        <button
                          onClick={() => setActionModal({ open: true, type: 'purge', employee: emp })}
                          className="btn btn-icon"
                          title="Permanently Purge Now"
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
      </div>

      {/* Confirmation Modals */}
      {actionModal.open && actionModal.type === 'restore' && (
        <ConfirmModal
          isOpen={true}
          title="Restore Employee Record"
          message={`Are you sure you want to restore ${actionModal.employee?.fullName} (${actionModal.employee?.employeeId}) back to the active directory?`}
          confirmText="Restore Record"
          danger={false}
          loading={processing}
          onConfirm={() => handleRestore(actionModal.employee)}
          onCancel={() => setActionModal({ open: false, type: '', employee: null })}
        />
      )}

      {actionModal.open && actionModal.type === 'purge' && (
        <ConfirmModal
          isOpen={true}
          title="Permanently Purge Record"
          message={`WARNING: This will permanently erase ${actionModal.employee?.fullName} (${actionModal.employee?.employeeId}) and all audit history from the database immediately, bypassing the 13-day TTL. This cannot be undone.`}
          confirmText="Purge Permanently"
          danger={true}
          loading={processing}
          onConfirm={() => handlePermanentDelete(actionModal.employee)}
          onCancel={() => setActionModal({ open: false, type: '', employee: null })}
        />
      )}
    </div>
  );
};

export default ArchivePage;
