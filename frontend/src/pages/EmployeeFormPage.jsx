import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { employeeApi } from '../api/employees';
import { departmentApi } from '../api/departments';
import { useAuth } from '../context/AuthContext';
import { clearQueryCache, updateCachedEmployee } from '../utils/cacheService';
import {
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  Building,
  Briefcase,
  Calendar,
  IndianRupee,
  Check,
  CheckCircle2,
} from 'lucide-react';
import { numberToWords } from '../utils/numberToWords';

export const EmployeeFormPage = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { addToast } = useAuth();

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [networkTimeLoading, setNetworkTimeLoading] = useState(!isEditMode);
  const [networkDate, setNetworkDate] = useState(new Date().toISOString().slice(0, 10));
  const [networkFormatted, setNetworkFormatted] = useState('');
  const [phone10, setPhone10] = useState('');
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    employeeId: '',
    fullName: '',
    email: '',
    departmentId: '',
    designation: '',
    dateOfJoining: new Date().toISOString().slice(0, 10),
    salary: '',
    status: 'Active',
  });

  // Fetch departments
  useEffect(() => {
    departmentApi
      .getAll()
      .then((data) => {
        setDepartments(data);
        if (!isEditMode && data.length > 0) {
          // Sort to find highest headcount priority department as default
          const sorted = [...data].sort((a, b) => (b.employeeCount || 0) - (a.employeeCount || 0));
          setFormData((prev) => ({ ...prev, departmentId: String(sorted[0].id) }));
        }
      })
      .catch((err) => {
        console.error('Failed to load departments', err);
        addToast('Failed to load department list.', 'error');
      });
  }, [isEditMode, addToast]);

  // Synchronize joining date from Network Time Server (IP / Google server time)
  useEffect(() => {
    employeeApi
      .getNetworkTime()
      .then((res) => {
        if (res && res.isoDate) {
          const iso = res.isoDate;
          const fmt = res.formattedDate || iso;
          setNetworkDate(iso);
          setNetworkFormatted(fmt);
          if (!isEditMode) {
            setFormData((prev) => ({ ...prev, dateOfJoining: prev.dateOfJoining || iso }));
          }
        }
      })
      .catch((err) => {
        console.warn('Network time fetch fallback to standard date', err);
        const todayIso = new Date().toISOString().slice(0, 10);
        setNetworkDate(todayIso);
        setNetworkFormatted(todayIso);
      })
      .finally(() => setNetworkTimeLoading(false));
  }, [isEditMode]);

  // Load existing employee if in edit mode
  useEffect(() => {
    if (isEditMode) {
      setLoading(true);
      employeeApi
        .getById(id)
        .then((emp) => {
          // Extract 10 digits from existing phone number (e.g. +91 9876543210 -> 9876543210)
          const digits = emp.phoneNumber ? emp.phoneNumber.replace(/\D/g, '').slice(-10) : '';
          setPhone10(digits);

          setFormData({
            employeeId: emp.employeeId,
            fullName: emp.fullName,
            email: emp.email,
            departmentId: String(emp.departmentId),
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
    if (name === 'salary') {
      const clean = value.replace(/[^0-9.]/g, '');
      const intPart = clean.split('.')[0];
      if (intPart.length > 7) return; // Strictly block typing more than 7 digits
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone10(val);
    if (errors.phoneNumber) {
      setErrors((prev) => ({ ...prev, phoneNumber: null }));
    }
  };

  const handleDeptSelect = (deptIdStr) => {
    setFormData((prev) => ({ ...prev, departmentId: deptIdStr }));
    if (errors.departmentId) {
      setErrors((prev) => ({ ...prev, departmentId: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.employeeId || !formData.employeeId.trim()) {
      newErrors.employeeId = 'Employee ID is required';
    } else if (!/^EMP[A-Za-z0-9_-]{1,27}$/i.test(formData.employeeId.trim())) {
      newErrors.employeeId = "Employee ID must strictly start with 'EMP' (e.g. EMP1001)";
    }

    if (!formData.fullName || !formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    if (!formData.email || !formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please provide a valid corporate email address';
    }

    // Strict 10-digit Indian Mobile Validation
    if (!phone10 || phone10.trim().length !== 10) {
      newErrors.phoneNumber = 'Exactly 10 digits required (excluding +91)';
    } else if (!/^[6-9]\d{9}$/.test(phone10.trim())) {
      newErrors.phoneNumber = 'Indian mobile numbers must start with 6, 7, 8, or 9';
    }

    if (!formData.departmentId) {
      newErrors.departmentId = 'Department selection is required';
    }

    if (!formData.designation || !formData.designation.trim()) {
      newErrors.designation = 'Designation is required';
    }

    if (!formData.dateOfJoining) {
      newErrors.dateOfJoining = 'Date of joining is required';
    } else if (formData.dateOfJoining > networkDate) {
      newErrors.dateOfJoining = 'Date of joining cannot be in the future';
    }

    if (!formData.salary) {
      newErrors.salary = 'Annual salary amount is required';
    } else if (Number(formData.salary) <= 0 || isNaN(Number(formData.salary))) {
      newErrors.salary = 'Salary must be a positive number';
    } else if (String(Math.floor(Number(formData.salary))).length > 7 || Number(formData.salary) > 9999999) {
      newErrors.salary = 'Salary cannot exceed 7 digits (maximum ₹99,99,999)';
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
      phoneNumber: `+91 ${phone10}`,
      departmentId: Number(formData.departmentId),
      salary: Number(formData.salary),
    };

    try {
      if (isEditMode) {
        const updated = await employeeApi.update(id, payload);
        if (updated) updateCachedEmployee(updated);
        addToast(`Employee '${payload.fullName}' updated successfully!`, 'success');
      } else {
        await employeeApi.create(payload);
        clearQueryCache();
        addToast(`Employee '${payload.fullName}' registered successfully!`, 'success');
      }
      navigate('/');
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
        addToast('Please resolve validation errors in the form.', 'error');
      } else {
        addToast(err.response?.data?.message || 'Failed to save employee information.', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Sort departments by headcount priority
  const sortedDepartments = [...departments].sort((a, b) => (b.employeeCount || 0) - (a.employeeCount || 0));
  const top3Departments = sortedDepartments.slice(0, 3);

  if (loading) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
        <div className="spinner spinner-primary" style={{ width: '32px', height: '32px' }} />
      </div>
    );
  }

  return (
    <div className="page-wrapper" style={{ maxWidth: '850px' }}>
      {/* Top back navigation */}
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
            ? 'Update the employee details and audit changes'
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
                <input
                  id="employeeId"
                  name="employeeId"
                  type="text"
                  className={`form-control ${errors.employeeId ? 'is-invalid' : ''}`}
                  placeholder="e.g. EMP1001"
                  value={formData.employeeId}
                  onChange={handleChange}
                  disabled={isEditMode}
                  required
                />
                {errors.employeeId && <div className="form-error">{errors.employeeId}</div>}

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
                  placeholder="e.g. AKASH"
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
                  placeholder="amanthesillent@gmail.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                {errors.email && <div className="form-error">{errors.email}</div>}
              </div>

              {/* Phone Number with Non-Editable +91 Prefix & Strict 10 Digits */}
              <div className="form-group">
                <label className="form-label required" htmlFor="phoneInput">
                  Mobile Number (India)
                </label>
                <div
                  className="phone-input-group"
                  style={{
                    border:
                      phone10.length === 10
                        ? '1.5px solid var(--success)'
                        : errors.phoneNumber || (phone10.length > 0 && phone10.length < 10)
                        ? '1.5px solid var(--danger)'
                        : '1px solid var(--border-default)',
                    backgroundColor: 'var(--bg-surface)',
                  }}
                >
                  <span className="phone-prefix">+91</span>
                  <input
                    id="phoneInput"
                    name="phone10"
                    type="tel"
                    className="phone-input"
                    placeholder="10-digit number"
                    value={phone10}
                    onChange={handlePhoneChange}
                    maxLength={10}
                    required
                  />
                </div>
                {errors.phoneNumber && <div className="form-error">{errors.phoneNumber}</div>}
                {phone10.length === 10 && !errors.phoneNumber && (
                  <div style={{ color: 'var(--success-text)', fontSize: '0.75rem', fontWeight: 600, marginTop: '4px' }}>
                    ✓ 10 Digits Valid
                  </div>
                )}
                {phone10.length > 0 && phone10.length < 10 && (
                  <div style={{ color: 'var(--danger-text)', fontSize: '0.75rem', fontWeight: 600, marginTop: '4px' }}>
                    Must enter exactly 10 digits ({phone10.length}/10 entered)
                  </div>
                )}

              </div>

              {/* Innovative Department Selector: Top 3 Headcount Priority Pills + Fallback Select */}
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label required" htmlFor="departmentId">
                  Department Selection
                </label>

                {top3Departments.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                       (Top {top3Departments.length} by most no.):
                    </div>
                    <div className="dept-pill-group">
                      {top3Departments.map((dept) => {
                        const isSelected = formData.departmentId === String(dept.id);
                        return (
                          <button
                            key={dept.id}
                            type="button"
                            className={`dept-pill ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleDeptSelect(String(dept.id))}
                          >
                            {isSelected && <Check size={14} />}
                            <span>{dept.name}</span>
                            <span
                              style={{
                                fontSize: '0.75rem',
                                padding: '1px 6px',
                                borderRadius: '10px',
                                backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : 'var(--bg-subtle)',
                                color: isSelected ? 'white' : 'var(--text-secondary)',
                                fontWeight: 700,
                              }}
                            >
                              {dept.employeeCount || 0}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div style={{ marginTop: '8px' }}>
                  <select
                    id="departmentId"
                    name="departmentId"
                    className={`form-control ${errors.departmentId ? 'is-invalid' : ''}`}
                    value={formData.departmentId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">— Or choose from all departments —</option>
                    {sortedDepartments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} ({dept.employeeCount || 0} employees)
                      </option>
                    ))}
                  </select>
                </div>
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
                  placeholder="Master of computer application"
                  value={formData.designation}
                  onChange={handleChange}
                  required
                />
                {errors.designation && <div className="form-error">{errors.designation}</div>}
              </div>

              {/* Date of Joining (Locked to Live IP / Google Network Time) */}
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
                  max={networkDate}
                  style={{
                    border:
                      errors.dateOfJoining || (formData.dateOfJoining && formData.dateOfJoining > networkDate)
                        ? '2px solid var(--danger)'
                        : undefined,
                    backgroundColor:
                      errors.dateOfJoining || (formData.dateOfJoining && formData.dateOfJoining > networkDate)
                        ? 'var(--danger-subtle)'
                        : undefined,
                  }}
                  required
                />
                {errors.dateOfJoining && <div className="form-error">{errors.dateOfJoining}</div>}
                {formData.dateOfJoining && formData.dateOfJoining > networkDate && !errors.dateOfJoining && (
                  <div className="form-error">
                    Future date is not allowed.
                  </div>
                )}

              </div>

              {/* Salary in INR */}
              <div className="form-group">
                <label className="form-label required" htmlFor="salary">
                  Annual Compensation (₹ INR)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="salary"
                    name="salary"
                    type="number"
                    step="1"
                    min="1"
                    max="9999999"
                    maxLength={7}
                    className={`form-control ${errors.salary ? 'is-invalid' : ''}`}
                    placeholder="e.g. 1250000 (Max 7 digits)"
                    value={formData.salary}
                    onChange={handleChange}
                    required
                  />
                </div>
                {errors.salary && <div className="form-error">{errors.salary}</div>}

                {/* Real-time Number in Words Display */}
                {formData.salary !== '' && numberToWords(formData.salary) && (
                  <div
                    style={{
                      marginTop: '6px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'var(--primary-subtle)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.825rem',
                      color: 'var(--primary-text)',
                      animation: 'fadeIn 0.2s ease',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 700, color: 'var(--primary)' }}>
                      <IndianRupee size={14} /> In Words:
                    </span>
                    <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>
                      {numberToWords(formData.salary)}
                    </span>
                  </div>
                )}


              </div>

              {/* Employment Status: Toggle Button */}
              <div className="form-group">
                <label className="form-label required">Employment Status</label>
                <div style={{ marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const next = formData.status === 'Active' ? 'Inactive' : 'Active';
                      setFormData((prev) => ({ ...prev, status: next }));
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 18px',
                      borderRadius: '24px',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: formData.status === 'Active' ? '1.5px solid var(--success-border)' : '1.5px solid var(--danger-border)',
                      backgroundColor: formData.status === 'Active' ? 'var(--success-subtle)' : 'var(--danger-subtle)',
                      color: formData.status === 'Active' ? 'var(--success-text)' : 'var(--danger-text)',
                      transition: 'all 0.2s ease',
                    }}
                    title="Click to toggle status between Active and Inactive"
                  >
                    <span
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: formData.status === 'Active' ? 'var(--success)' : 'var(--danger)',
                      }}
                    />
                    <span>{formData.status}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>(Click to switch)</span>
                  </button>
                </div>

              </div>
            </div>
          </div>

          {/* Form Actions Footer */}
          <div
            style={{
              padding: 'var(--space-5) var(--space-8)',
              backgroundColor: 'var(--bg-subtle)',
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
