import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { employeeApi } from '../api/employees';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import ConfirmModal from '../components/ConfirmModal';
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Mail,
  Phone,
  Building,
  Briefcase,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  History,
  CheckCircle,
  FileText,
  AlertCircle,
} from 'lucide-react';

export const EmployeeDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useAuth();

  const [employee, setEmployee] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setLoading(true);
    employeeApi
      .getById(id)
      .then((data) => setEmployee(data))
      .catch((err) => {
        addToast('Employee not found.', 'error');
        navigate('/');
      })
      .finally(() => setLoading(false));

    // Fetch audit trail history
    setLogsLoading(true);
    employeeApi
      .getAuditLogs(id)
      .then((logs) => setAuditLogs(logs || []))
      .catch((err) => {
        console.warn('Could not load audit logs', err);
      })
      .finally(() => setLogsLoading(false));
  }, [id, navigate, addToast]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await employeeApi.delete(id);
      addToast(`Employee '${employee.fullName}' moved to Archive with 13-day retention policy.`, 'success');
      navigate('/');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to archive employee.', 'error');
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  const calculateTenure = (joiningDate) => {
    if (!joiningDate) return 'N/A';
    const start = new Date(joiningDate);
    const now = new Date();
    const diffMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    if (diffMonths < 1) return 'First month';
    const years = Math.floor(diffMonths / 12);
    const months = diffMonths % 12;
    if (years === 0) return `${months} month${months > 1 ? 's' : ''}`;
    return `${years} yr${years > 1 ? 's' : ''}${months > 0 ? `, ${months} mo${months > 1 ? 's' : ''}` : ''}`;
  };

  const getActionBadge = (action) => {
    switch (action) {
      case 'CREATED':
        return { label: 'Added', bg: 'var(--success-subtle)', color: 'var(--success-text)' };
      case 'UPDATED':
        return { label: 'Changed', bg: 'var(--primary-subtle)', color: 'var(--primary-text)' };
      case 'STATUS_CHANGE':
        return { label: 'Status Change', bg: 'var(--warning-subtle)', color: 'var(--warning-text)' };
      case 'RESTORED':
        return { label: 'Restored', bg: 'var(--primary-subtle)', color: 'var(--primary-text)' };
      case 'DELETED':
        return { label: 'Archived', bg: 'var(--danger-subtle)', color: 'var(--danger-text)' };
      default:
        return { label: action || 'Edited', bg: 'var(--bg-subtle)', color: 'var(--text-secondary)' };
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
        <div className="spinner spinner-primary" style={{ width: '32px', height: '32px' }} />
      </div>
    );
  }

  if (!employee) return null;

  // Latest edit log entry if any
  const latestLog = auditLogs.length > 0 ? auditLogs[0] : null;

  return (
    <div className="page-wrapper" style={{ maxWidth: '980px' }}>
      {/* Top back button & action buttons */}
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
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Employee List</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <Link to={`/employees/edit/${employee.id}`} className="btn btn-secondary">
            <Edit2 size={16} />
            <span>Edit Profile</span>
          </Link>
          <button
            onClick={() => setDeleteModalOpen(true)}
            className="btn btn-danger"
          >
            <Trash2 size={16} />
            <span>Archive Employee</span>
          </button>
        </div>
      </div>

      {/* Main Profile Header Card */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div
          style={{
            padding: 'var(--space-8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--space-6)',
            background: 'linear-gradient(to right, var(--bg-subtle), var(--bg-surface))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)' }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, var(--primary), #ec4899)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem',
                fontWeight: 800,
                boxShadow: '0 8px 16px var(--primary-glow)',
              }}
            >
              {employee.fullName.charAt(0)}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: '4px' }}>
                <h1 style={{ fontSize: '1.6rem' }}>{employee.fullName}</h1>
                <StatusBadge status={employee.status} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.825rem',
                    fontWeight: 700,
                    backgroundColor: 'var(--bg-subtle)',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  {employee.employeeId}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>•</span>
                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {employee.designation}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>•</span>
                <span className="badge badge-dept">{employee.departmentName}</span>
              </div>
            </div>
          </div>

          <div
            style={{
              padding: 'var(--space-4) var(--space-6)',
              backgroundColor: 'var(--primary-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              textAlign: 'right',
            }}
          >
            <div style={{ fontSize: '0.775rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary-text)', letterSpacing: '0.05em' }}>
              Annual Compensation
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-text)' }}>
              {formatCurrency(employee.salary)}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Details Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'var(--space-6)',
          marginBottom: 'var(--space-6)',
        }}
      >
        {/* Contact Information */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail size={18} color="var(--primary)" />
              <span>Contact Information</span>
            </h3>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                Corporate Email Address
              </span>
              <a
                href={`mailto:${employee.email}`}
                style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--primary)' }}
              >
                {employee.email}
              </a>
            </div>

            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                Direct Mobile Number
              </span>
              <a
                href={`tel:${employee.phoneNumber}`}
                style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}
              >
                {employee.phoneNumber}
              </a>
            </div>
          </div>
        </div>

        {/* Employment & Tenure */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Briefcase size={18} color="var(--primary)" />
              <span>Employment & Tenure</span>
            </h3>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                Department
              </span>
              <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                {employee.departmentName}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                  Date of Joining
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                  {formatDate(employee.dateOfJoining)}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                  Tenure
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--success-text)' }}>
                  {calculateTenure(employee.dateOfJoining)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Latest Modification Highlight */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="var(--primary)" />
              <span>Latest Activity</span>
            </h3>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {latestLog ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      backgroundColor: getActionBadge(latestLog.action).bg,
                      color: getActionBadge(latestLog.action).color,
                    }}
                  >
                    {getActionBadge(latestLog.action).label}
                  </span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    by {latestLog.performedBy || 'admin'}
                  </span>
                </div>
                <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  {latestLog.details}
                </div>
                <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {formatDateTime(latestLog.timestamp)}
                </div>
              </div>
            ) : (
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                  Record Registered
                </span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  {employee.createdAt ? formatDateTime(employee.createdAt) : 'System Seed'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History & Audit Log Section */}
      <div className="card">
        <div
          className="card-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={18} color="var(--primary)" />
            <span>Audit Trail & Change History</span>
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Timestamps recorded with exact seconds
          </span>
        </div>

        <div className="card-body" style={{ padding: 'var(--space-6)' }}>
          {logsLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-6)' }}>
              <div className="spinner spinner-primary" style={{ width: '24px', height: '24px' }} />
            </div>
          ) : auditLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-muted)' }}>
              <FileText size={32} style={{ margin: '0 auto var(--space-2)', opacity: 0.5 }} />
              <p style={{ margin: 0, fontSize: '0.9rem' }}>No audit history records found for this employee.</p>
            </div>
          ) : (
            <div className="timeline">
              {auditLogs.map((log) => {
                const badge = getActionBadge(log.action);
                return (
                  <div key={log.id} className="timeline-item">
                    <div className="timeline-dot" />
                    <div className="timeline-content">
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 'var(--space-2)',
                          marginBottom: '4px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '12px',
                              backgroundColor: badge.bg,
                              color: badge.color,
                            }}
                          >
                            {badge.label}
                          </span>
                          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
                            by {log.performedBy || 'admin'}
                          </span>
                        </div>

                        {/* Timestamp with exact seconds */}
                        <span
                          style={{
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--text-secondary)',
                            backgroundColor: 'var(--bg-subtle)',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-xs)',
                          }}
                        >
                          {formatDateTime(log.timestamp)}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {log.details}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Delete / Archive Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Move Employee to Archive"
        message={`Are you sure you want to archive ${employee.fullName} (${employee.employeeId})? The record will be safely retained in the Archive for 13 days (TTL policy) before permanent purge, and can be restored at any time.`}
        confirmText="Confirm Archive"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </div>
  );
};

export default EmployeeDetailsPage;
