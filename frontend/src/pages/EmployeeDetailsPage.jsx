import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { employeeApi } from '../api/employees';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import ConfirmModal from '../components/ConfirmModal';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Mail,
  Phone,
  Building,
  Briefcase,
  Calendar,
  DollarSign,
  Clock,
  User,
  ShieldCheck,
} from 'lucide-react';

export const EmployeeDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useAuth();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
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
  }, [id, navigate, addToast]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await employeeApi.delete(id);
      addToast(`Employee '${employee.fullName}' deleted successfully.`, 'success');
      navigate('/');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete employee.', 'error');
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const calculateTenure = (joiningDate) => {
    if (!joiningDate) return 'N/A';
    const start = new Date(joiningDate);
    const now = new Date();
    const diffMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    if (diffMonths < 1) return 'Less than a month';
    const years = Math.floor(diffMonths / 12);
    const months = diffMonths % 12;
    if (years === 0) return `${months} month${months > 1 ? 's' : ''}`;
    return `${years} yr${years > 1 ? 's' : ''}${months > 0 ? `, ${months} mo${months > 1 ? 's' : ''}` : ''}`;
  };

  if (loading) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
        <div className="spinner spinner-primary" style={{ width: '32px', height: '32px' }} />
      </div>
    );
  }

  if (!employee) return null;

  return (
    <div className="page-wrapper" style={{ maxWidth: '960px' }}>
      {/* Top back button & actions */}
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
            <span>Delete Employee</span>
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
            background: 'linear-gradient(to right, #fafbfc, #ffffff)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)' }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, var(--primary), #6366f1)',
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
              border: '1px solid #c7d2fe',
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
        }}
      >
        {/* Contact Info Card */}
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
                Direct Phone Number
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

        {/* Employment & Tenure Card */}
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
                  {employee.dateOfJoining}
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

        {/* Audit Meta Card */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="var(--primary)" />
              <span>Audit & Timestamps</span>
            </h3>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                Record Created
              </span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {employee.createdAt ? new Date(employee.createdAt).toLocaleString() : 'System Seed'}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                Last Modified
              </span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {employee.updatedAt ? new Date(employee.updatedAt).toLocaleString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Employee"
        message={`Are you sure you want to permanently delete the profile of ${employee.fullName} (${employee.employeeId})? This action cannot be reversed.`}
        confirmText="Confirm Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </div>
  );
};

export default EmployeeDetailsPage;
