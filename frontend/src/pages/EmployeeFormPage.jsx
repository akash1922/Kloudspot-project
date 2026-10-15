import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { employeeApi } from '../api/employees';
import { departmentApi } from '../api/departments';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Save, User, Mail, Phone, Building, Briefcase, Calendar, DollarSign, CheckCircle2 } from 'lucide-react';

export const EmployeeFormPage = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { addToast } = useAuth();

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    employeeId: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    departmentId: '',
    designation: '',
    dateOfJoining: new Date().toISOString().slice(0, 10),
    salary: '',
    status: 'Active',
  });

  // Load departments
  useEffect(() => {
    departmentApi
      .getAll()
      .then((data) => {
        setDepartments(data);
        if (!isEditMode && data.length > 0) {
          setFormData((prev) => ({ ...prev, departmentId: data[0].id }));
        }
      })
      .catch((err) => {
        console.error('Failed to load departments', err);
        addToast('Failed to load department list.', 'error');
      });
  }, [isEditMode, addToast]);

  // If edit mode, fetch employee details
  useEffect(() => {
    if (isEditMode) {
      setLoading(true);
      employeeApi
        .getById(id)
        .then((emp) => {
          setFormData({
            employeeId: emp.employeeId,
            fullName: emp.fullName,
            email: emp.email,
            phoneNumber: emp.phoneNumber,
            departmentId: emp.departmentId,
            designation: emp.designation,
            dateOfJoining: emp.dateOfJoining,
            salary: emp.salary,
            status: emp.status,
          });
        })
        .catch((err) => {
          addToast('Could not find employee details.', 'error');
          navigate('/');
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEditMode, navigate, addToast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.employeeId || !formData.employeeId.trim()) {
      newErrors.employeeId = 'Employee ID is required';
    } else if (!/^[A-Za-z0-9_-]{2,30}$/.test(formData.employeeId.trim())) {
      newErrors.employeeId = 'ID must be 2-30 characters (letters, numbers, hyphens, underscores)';
    }

    if (!formData.fullName || !formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    if (!formData.email || !formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please provide a valid email address';
    }

    if (!formData.phoneNumber || !formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^[+0-9 ()-]{7,25}$/.test(formData.phoneNumber.trim())) {
      newErrors.phoneNumber = 'Valid phone number required (7-25 digits/symbols)';
    }

    if (!formData.departmentId) {
      newErrors.departmentId = 'Department selection is required';
    }

    if (!formData.designation || !formData.designation.trim()) {
      newErrors.designation = 'Designation is required';
    }

    if (!formData.dateOfJoining) {
      newErrors.dateOfJoining = 'Date of joining is required';
    } else {
      const selected = new Date(formData.dateOfJoining);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (selected > today) {
        newErrors.dateOfJoining = 'Joining date cannot be in the future';
      }
    }

    if (!formData.salary) {
      newErrors.salary = 'Salary amount is required';
    } else if (Number(formData.salary) <= 0 || isNaN(Number(formData.salary))) {
      newErrors.salary = 'Salary must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    const payload = {
      ...formData,
      departmentId: Number(formData.departmentId),
      salary: Number(formData.salary),
    };

    try {
      if (isEditMode) {
        await employeeApi.update(id, payload);
        addToast(`Employee '${payload.fullName}' updated successfully!`, 'success');
      } else {
        await employeeApi.create(payload);
        addToast(`Employee '${payload.fullName}' created successfully!`, 'success');
      }
      navigate('/');
    } catch (err) {
      if (err.response?.data?.errors) {
        // Backend validation errors map
        setErrors(err.response.data.errors);
        addToast('Please resolve validation errors in the form.', 'error');
      } else {
        addToast(err.response?.data?.message || 'Failed to save employee information.', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
        <div className="spinner spinner-primary" style={{ width: '32px', height: '32px' }} />
      </div>
    );
  }

  return (
    <div className="page-wrapper" style={{ maxWidth: '850px' }}>
      {/* Top navigation */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            marginBottom: 'var(--space-3)',
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Employee List</span>
        </Link>
        <h1 style={{ fontSize: '1.75rem' }}>
          {isEditMode ? 'Edit Employee Information' : 'Add New Employee'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem' }}>
          {isEditMode
            ? 'Update the employee details and save changes'
            : 'Fill in the information below to register a new employee record'}
        </p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} noValidate>
          <div className="card-body" style={{ padding: 'var(--space-8)' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 'var(--space-5)',
              }}
            >
              {/* Employee ID */}
              <div className="form-group">
                <label className="form-label required" htmlFor="employeeId">
                  Employee ID
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="employeeId"
                    name="employeeId"
                    type="text"
                    className={`form-control ${errors.employeeId ? 'is-invalid' : ''}`}
                    placeholder="e.g. EMP-1010"
                    value={formData.employeeId}
                    onChange={handleChange}
                    disabled={isEditMode} // Usually Emp ID is immutable once assigned
                    required
                  />
                </div>
                {errors.employeeId && <div className="form-error">{errors.employeeId}</div>}
                <div className="form-hint">Unique corporate identifier (e.g. EMP-0001)</div>
              </div>

              {/* Full Name */}
              <div className="form-group">
                <label className="form-label required" htmlFor="fullName">
                  Full Name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  className={`form-control ${errors.fullName ? 'is-invalid' : ''}`}
                  placeholder="e.g. Jane Doe"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
                {errors.fullName && <div className="form-error">{errors.fullName}</div>}
              </div>

              {/* Email Address */}
              <div className="form-group">
                <label className="form-label required" htmlFor="email">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                {errors.email && <div className="form-error">{errors.email}</div>}
              </div>

              {/* Phone Number */}
              <div className="form-group">
                <label className="form-label required" htmlFor="phoneNumber">
                  Phone Number
                </label>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="text"
                  className={`form-control ${errors.phoneNumber ? 'is-invalid' : ''}`}
                  placeholder="+1 (555) 000-0000"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                />
                {errors.phoneNumber && <div className="form-error">{errors.phoneNumber}</div>}
              </div>

              {/* Department */}
              <div className="form-group">
                <label className="form-label required" htmlFor="departmentId">
                  Department
                </label>
                <select
                  id="departmentId"
                  name="departmentId"
                  className={`form-control ${errors.departmentId ? 'is-invalid' : ''}`}
                  value={formData.departmentId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                {errors.departmentId && <div className="form-error">{errors.departmentId}</div>}
              </div>

              {/* Designation */}
              <div className="form-group">
                <label className="form-label required" htmlFor="designation">
                  Designation / Role
                </label>
                <input
                  id="designation"
                  name="designation"
                  type="text"
                  className={`form-control ${errors.designation ? 'is-invalid' : ''}`}
                  placeholder="e.g. Senior Software Engineer"
                  value={formData.designation}
                  onChange={handleChange}
                  required
                />
                {errors.designation && <div className="form-error">{errors.designation}</div>}
              </div>

              {/* Date of Joining */}
              <div className="form-group">
                <label className="form-label required" htmlFor="dateOfJoining">
                  Date of Joining
                </label>
                <input
                  id="dateOfJoining"
                  name="dateOfJoining"
                  type="date"
                  className={`form-control ${errors.dateOfJoining ? 'is-invalid' : ''}`}
                  value={formData.dateOfJoining}
                  onChange={handleChange}
                  max={new Date().toISOString().slice(0, 10)}
                  required
                />
                {errors.dateOfJoining && <div className="form-error">{errors.dateOfJoining}</div>}
              </div>

              {/* Salary */}
              <div className="form-group">
                <label className="form-label required" htmlFor="salary">
                  Annual Salary ($ USD)
                </label>
                <input
                  id="salary"
                  name="salary"
                  type="number"
                  step="0.01"
                  min="0.01"
                  className={`form-control ${errors.salary ? 'is-invalid' : ''}`}
                  placeholder="e.g. 95000.00"
                  value={formData.salary}
                  onChange={handleChange}
                  required
                />
                {errors.salary && <div className="form-error">{errors.salary}</div>}
              </div>

              {/* Employment Status */}
              <div className="form-group">
                <label className="form-label required">Employment Status</label>
                <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: '8px' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                    }}
                  >
                    <input
                      type="radio"
                      name="status"
                      value="Active"
                      checked={formData.status === 'Active'}
                      onChange={handleChange}
                    />
                    <span style={{ color: 'var(--success-text)' }}>Active</span>
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                    }}
                  >
                    <input
                      type="radio"
                      name="status"
                      value="Inactive"
                      checked={formData.status === 'Inactive'}
                      onChange={handleChange}
                    />
                    <span style={{ color: 'var(--danger-text)' }}>Inactive</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions Footer */}
          <div
            style={{
              padding: 'var(--space-5) var(--space-8)',
              backgroundColor: '#fafbfc',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 'var(--space-3)',
            }}
          >
            <Link to="/" className="btn btn-secondary">
              Cancel
            </Link>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className="spinner" style={{ width: '16px', height: '16px' }} />
                  <span>Saving Record...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>{isEditMode ? 'Update Employee' : 'Save Employee'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeFormPage;
