import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Check,
  RefreshCw,
  Trash2,
  ShieldAlert,
  ArrowRight,
  FileSpreadsheet,
  FileText,
  AlertCircle,
} from 'lucide-react';
import apiClient from '../api/client';
import { employeeApi } from '../api/employees';
import { validateStagedRow, extract10PhoneDigits } from '../utils/universalFileParser';
import { numberToWords } from '../utils/numberToWords';

export const ImportReviewModal = ({
  isOpen,
  onClose,
  fileName = '',
  initialRows = [],
  departments = [],
  existingEmployees = [],
  onImportComplete,
}) => {
  const [rows, setRows] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'READY' | 'CONFLICTS'
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [saveProgress, setSaveProgress] = useState({ current: 0, total: 0 });
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState(null);

  // Synchronized Internet / Network time
  const [networkTime, setNetworkTime] = useState({
    isoDate: new Date().toISOString().slice(0, 10),
    formattedDate: '',
  });

  // Fetch live internet time from network time API
  useEffect(() => {
    employeeApi
      .getNetworkTime()
      .then((res) => {
        if (res && res.isoDate) {
          setNetworkTime({
            isoDate: res.isoDate,
            formattedDate: res.formattedDate || res.isoDate,
          });
        }
      })
      .catch((err) => console.warn('Failed to fetch network time', err));
  }, []);

  const [fullDbEmployees, setFullDbEmployees] = useState([]);

  // Fetch complete directory of all employees across the database (active, inactive, and archived) for 100% complete duplicate detection
  useEffect(() => {
    if (isOpen) {
      Promise.all([
        employeeApi.getEmployees({ size: 5000, status: 'ALL' }),
        employeeApi.getArchived(),
      ])
        .then(([activeAndInactiveRes, archivedRes]) => {
          const map = new Map();
          (activeAndInactiveRes?.content || []).forEach((e) => {
            if (e?.employeeId) map.set(String(e.employeeId).toLowerCase().trim(), e);
          });
          (archivedRes || []).forEach((e) => {
            if (e?.employeeId) map.set(String(e.employeeId).toLowerCase().trim(), e);
          });
          setFullDbEmployees(Array.from(map.values()));
        })
        .catch((err) => console.warn('Could not fetch full directory in modal', err));
    }
  }, [isOpen]);

  // Combined Directory from props and full database query
  const combinedExisting = useMemo(() => {
    const map = new Map();
    (existingEmployees || []).forEach((e) => {
      if (e?.employeeId) map.set(String(e.employeeId).toLowerCase().trim(), e);
    });
    (fullDbEmployees || []).forEach((e) => {
      if (e?.employeeId) map.set(String(e.employeeId).toLowerCase().trim(), e);
    });
    return Array.from(map.values());
  }, [existingEmployees, fullDbEmployees]);

  // Sets for duplicate detection against entire database
  const existingIdSet = useMemo(() => {
    const ids = new Set();
    combinedExisting.forEach((e) => {
      if (e?.employeeId) ids.add(String(e.employeeId).toLowerCase().trim());
    });
    return ids;
  }, [combinedExisting]);

  const existingEmailSet = useMemo(() => {
    const emails = new Set();
    combinedExisting.forEach((e) => {
      if (e?.email) emails.add(String(e.email).toLowerCase().trim());
    });
    return emails;
  }, [combinedExisting]);

  // Initialize staged rows whenever modal opens or directory updates
  useEffect(() => {
    if (isOpen && initialRows.length > 0) {
      setRows((prev) => {
        const sourceRows = prev.length === initialRows.length ? prev : initialRows;
        return sourceRows.map((r, idx, arr) => {
          const rowWithDefaults = {
            ...r,
            phoneNumber: extract10PhoneDigits(r.phoneNumber),
            status: r.status === 'Inactive' ? 'Inactive' : 'Active',
          };
          const v = validateStagedRow(rowWithDefaults, existingIdSet, existingEmailSet, arr, networkTime.isoDate);
          const isFailed = r.importStatus === 'FAILED';
          const isDupId = Boolean(
            v.isDuplicateId ||
            (isFailed && r.errorMessage?.toLowerCase().includes('already exists') && r.errorMessage?.toLowerCase().includes('id'))
          );
          const isDupEmail = Boolean(
            v.isDuplicateEmail ||
            (isFailed && r.errorMessage?.toLowerCase().includes('already exists') && r.errorMessage?.toLowerCase().includes('email'))
          );
          const isRowValid = Boolean(v.isValid && !isFailed && !isDupId && !isDupEmail);

          return {
            ...rowWithDefaults,
            isDuplicateId: isDupId,
            isDuplicateEmail: isDupEmail,
            errors: v.errors,
            missingFields: v.missingFields,
            isValid: isRowValid,
            selected: isRowValid ? (r.selected ?? true) : false,
          };
        });
      });

      setIsSavingAll(false);
      setSaveProgress({ current: 0, total: 0 });
    }
  }, [isOpen, initialRows, existingIdSet, existingEmailSet, networkTime.isoDate]);

  // Update a single field in a row with real-time strict revalidation
  const handleFieldChange = (stagingId, field, value) => {
    setRows((prev) => {
      return prev.map((r) => {
        if (r._stagingId !== stagingId) return r;

        const updated = { ...r, [field]: value };
        if (field === 'employeeId' || field === 'email') {
          updated.importStatus = 'PENDING';
          updated.errorMessage = null;
        }

        const v = validateStagedRow(updated, existingIdSet, existingEmailSet, prev, networkTime.isoDate);

        updated.isDuplicateId = v.isDuplicateId;
        updated.isDuplicateEmail = v.isDuplicateEmail;
        updated.errors = v.errors;
        updated.missingFields = v.missingFields;
        updated.isValid = v.isValid;

        // Auto-select if newly valid; unselect if incomplete
        if (v.isValid && !r.isValid) {
          updated.selected = true;
        } else if (!v.isValid) {
          updated.selected = false;
        }

        return updated;
      });
    });
  };

  // Toggle selection for a single row (only valid rows can be selected for batch save)
  const toggleSelectRow = (row) => {
    const isDup = row.isDuplicateId || (row.importStatus === 'FAILED' && row.errorMessage?.toLowerCase().includes('already exists'));
    if (!row.isValid || row.importStatus === 'FAILED' || isDup) {
      alert(`Cannot select this row: ${row.errorMessage || (row.missingFields?.length > 0 ? `please fill missing details (${row.missingFields.join(', ')})` : 'duplicate or invalid record')}.`);
      return;
    }
    setRows((prev) =>
      prev.map((r) => (r._stagingId === row._stagingId ? { ...r, selected: !r.selected } : r))
    );
  };

  // Remove a row from staging
  const removeRow = (stagingId) => {
    setRows((prev) => prev.filter((r) => r._stagingId !== stagingId));
  };

  // Filter rows by active tab
  const filteredRows = useMemo(() => {
    if (activeTab === 'READY') {
      return rows.filter(
        (r) =>
          r.isValid &&
          r.importStatus !== 'SUCCESS' &&
          r.importStatus !== 'FAILED' &&
          !r.isDuplicateId &&
          !r.isDuplicateEmail
      );
    }
    if (activeTab === 'CONFLICTS') {
      return rows.filter(
        (r) =>
          (!r.isValid || r.importStatus === 'FAILED' || r.isDuplicateId || r.isDuplicateEmail) &&
          r.importStatus !== 'SUCCESS'
      );
    }
    return rows;
  }, [rows, activeTab]);

  // Statistics
  const totalCount = rows.length;
  const readyCount = rows.filter(
    (r) =>
      r.isValid &&
      r.importStatus !== 'SUCCESS' &&
      r.importStatus !== 'FAILED' &&
      !r.isDuplicateId &&
      !r.isDuplicateEmail
  ).length;
  const conflictCount = rows.filter(
    (r) =>
      (!r.isValid || r.importStatus === 'FAILED' || r.isDuplicateId || r.isDuplicateEmail) &&
      r.importStatus !== 'SUCCESS'
  ).length;
  const successCount = rows.filter((r) => r.importStatus === 'SUCCESS').length;
  // Selected count: ONLY count rows that are strictly VALID, not already saved, and not failed/duplicate
  const validSelectedCount = rows.filter(
    (r) =>
      r.selected &&
      r.isValid &&
      r.importStatus !== 'SUCCESS' &&
      r.importStatus !== 'FAILED' &&
      !r.isDuplicateId &&
      !r.isDuplicateEmail
  ).length;

  const validRowsInCurrentView = filteredRows.filter(
    (r) =>
      r.isValid &&
      r.importStatus !== 'SUCCESS' &&
      r.importStatus !== 'FAILED' &&
      !r.isDuplicateId &&
      !r.isDuplicateEmail
  );
  const isAllSelected =
    validRowsInCurrentView.length > 0 &&
    validRowsInCurrentView.every((r) => r.selected);

  const toggleSelectAll = () => {
    const nextVal = !isAllSelected;
    const validFilteredIds = new Set(validRowsInCurrentView.map((r) => r._stagingId));
    setRows((prev) =>
      prev.map((r) => (validFilteredIds.has(r._stagingId) ? { ...r, selected: nextVal } : r))
    );
  };

  // Save single employee (STRICT CONSTRAINT: Cannot approve if any detail is missing or invalid)
  const handleApproveSingle = async (row) => {
    if (row.importStatus === 'SUCCESS') return;

    // Hard verification with network date check
    const v = validateStagedRow(row, existingIdSet, existingEmailSet, rows, networkTime.isoDate);
    if (!v.isValid) {
      alert(`Cannot approve: missing or invalid fields: ${v.errors.join('; ')}`);
      return;
    }

    setActionLoadingId(row._stagingId);

    const cleanPhoneDigits = extract10PhoneDigits(row.phoneNumber);

    const payload = {
      employeeId: row.employeeId.trim(),
      fullName: row.fullName.trim(),
      email: row.email.trim().toLowerCase(),
      phoneNumber: `+91 ${cleanPhoneDigits}`,
      departmentId: Number(row.departmentId),
      designation: row.designation.trim(),
      dateOfJoining: row.dateOfJoining.trim(),
      salary: Number(row.salary),
      status: (row.status || 'Active').trim(),
    };

    try {
      await apiClient.post('/employees', payload);
      // Immediately register in existing sets so future rows know it's in the DB
      if (row.employeeId) existingIdSet.add(row.employeeId.toLowerCase().trim());
      if (row.email) existingEmailSet.add(row.email.toLowerCase().trim());

      let isLast = false;
      setRows((prev) => {
        const next = prev.map((r) =>
          r._stagingId === row._stagingId
            ? { ...r, importStatus: 'SUCCESS', selected: false, errorMessage: null }
            : r
        );
        const remaining = next.filter((r) => r.importStatus !== 'SUCCESS');
        if (remaining.length === 0) {
          isLast = true;
        }
        return next;
      });
      if (onImportComplete) {
        onImportComplete(1, isLast);
      }
      if (isLast && onClose) {
        setTimeout(() => onClose(), 400);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save employee';
      const lowerMsg = msg.toLowerCase();
      const isDup = lowerMsg.includes('already exists') || lowerMsg.includes('duplicate');
      const isDupId = isDup && (lowerMsg.includes('employee with id') || lowerMsg.includes('id'));
      const isDupEmail = isDup && lowerMsg.includes('email');

      if (row.employeeId) existingIdSet.add(row.employeeId.toLowerCase().trim());
      if (row.email) existingEmailSet.add(row.email.toLowerCase().trim());

      setRows((prev) =>
        prev.map((r) =>
          r._stagingId === row._stagingId
            ? {
                ...r,
                importStatus: 'FAILED',
                errorMessage: msg,
                isValid: false,
                selected: false,
                isDuplicateId: isDupId || r.isDuplicateId,
                isDuplicateEmail: isDupEmail || r.isDuplicateEmail,
                errors: [msg, ...(r.errors || [])],
              }
            : r
        )
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  // Batch Save All Selected (STRICT CONSTRAINT: Only 100% complete and valid rows are pushed)
  const handleSaveAll = async () => {
    const toImport = rows.filter((r) => r.selected && r.isValid && r.importStatus !== 'SUCCESS');
    if (toImport.length === 0) {
      alert('No fully completed and approved records are currently selected.');
      return;
    }

    setIsSavingAll(true);
    setSaveProgress({ current: 0, total: toImport.length });

    let addedCount = 0;

    for (let i = 0; i < toImport.length; i++) {
      const row = toImport[i];
      setSaveProgress({ current: i + 1, total: toImport.length });

      // Secondary safety check
      const v = validateStagedRow(row, existingIdSet, existingEmailSet, rows, networkTime.isoDate);
      if (!v.isValid) {
        setRows((prev) =>
          prev.map((r) =>
            r._stagingId === row._stagingId
              ? { ...r, importStatus: 'FAILED', errorMessage: `Incomplete: ${v.missingFields.join(', ')}` }
              : r
          )
        );
        continue;
      }

      const rowPhoneDigits = extract10PhoneDigits(row.phoneNumber);

      const payload = {
        employeeId: row.employeeId.trim(),
        fullName: row.fullName.trim(),
        email: row.email.trim().toLowerCase(),
        phoneNumber: `+91 ${rowPhoneDigits}`,
        departmentId: Number(row.departmentId),
        designation: row.designation.trim(),
        dateOfJoining: row.dateOfJoining.trim(),
        salary: Number(row.salary),
        status: (row.status || 'Active').trim(),
      };

      try {
        await apiClient.post('/employees', payload);
        addedCount++;
        // Immediately register in existing sets so subsequent checks know it exists
        if (row.employeeId) existingIdSet.add(row.employeeId.toLowerCase().trim());
        if (row.email) existingEmailSet.add(row.email.toLowerCase().trim());

        setRows((prev) =>
          prev.map((r) =>
            r._stagingId === row._stagingId
              ? { ...r, importStatus: 'SUCCESS', selected: false, errorMessage: null }
              : r
          )
        );
      } catch (err) {
        const msg = err.response?.data?.message || 'Failed to save employee';
        const lowerMsg = msg.toLowerCase();
        const isDup = lowerMsg.includes('already exists') || lowerMsg.includes('duplicate');
        const isDupId = isDup && (lowerMsg.includes('employee with id') || lowerMsg.includes('id'));
        const isDupEmail = isDup && lowerMsg.includes('email');

        if (row.employeeId) existingIdSet.add(row.employeeId.toLowerCase().trim());
        if (row.email) existingEmailSet.add(row.email.toLowerCase().trim());

        setRows((prev) =>
          prev.map((r) =>
            r._stagingId === row._stagingId
              ? {
                  ...r,
                  importStatus: 'FAILED',
                  errorMessage: msg,
                  isValid: false,
                  selected: false,
                  isDuplicateId: isDupId || r.isDuplicateId,
                  isDuplicateEmail: isDupEmail || r.isDuplicateEmail,
                  errors: [msg, ...(r.errors || [])],
                }
              : r
          )
        );
      }
    }

    setIsSavingAll(false);
    if (addedCount > 0) {
      if (onImportComplete) {
        onImportComplete(addedCount, true);
      }
      if (onClose) {
        onClose();
      }
    } else {
      alert('None of the selected records could be saved. Please check the error messages on the rows.');
    }
  };

  if (!isOpen) return null;

  const isExcel =
    fileName.toLowerCase().endsWith('.xls') || fileName.toLowerCase().endsWith('.xlsx');
  const isPdf = fileName.toLowerCase().endsWith('.pdf');

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1320px',
          maxHeight: '94vh',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-surface)',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isPdf ? 'var(--danger-subtle)' : isExcel ? 'var(--success-subtle)' : 'var(--primary-subtle)',
                color: isPdf ? 'var(--danger)' : isExcel ? 'var(--success)' : 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isPdf ? <FileText size={22} /> : <FileSpreadsheet size={22} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Imported data
                </h3>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--bg-subtle)',
                    color: 'var(--text-secondary)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {fileName}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSavingAll}
            className="btn btn-ghost btn-sm"
            style={{
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Toolbar & Filter Tabs */}
        <div
          style={{
            padding: '12px 24px',
            backgroundColor: 'var(--bg-subtle)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          {/* Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setActiveTab('ALL')}
              className="btn btn-sm"
              style={{
                backgroundColor: activeTab === 'ALL' ? 'var(--primary)' : 'var(--bg-surface)',
                color: activeTab === 'ALL' ? 'var(--text-inverse)' : 'var(--text-main)',
                border: '1px solid var(--border-subtle)',
                fontWeight: activeTab === 'ALL' ? 700 : 500,
                borderRadius: '20px',
                padding: '4px 14px',
                fontSize: '0.825rem',
              }}
            >
              All Records ({totalCount})
            </button>
            <button
              onClick={() => setActiveTab('READY')}
              className="btn btn-sm"
              style={{
                backgroundColor: activeTab === 'READY' ? 'var(--success)' : 'var(--bg-surface)',
                color: activeTab === 'READY' ? 'white' : 'var(--text-main)',
                border: '1px solid var(--border-subtle)',
                fontWeight: activeTab === 'READY' ? 700 : 500,
                borderRadius: '20px',
                padding: '4px 14px',
                fontSize: '0.825rem',
              }}
            >
              Ready to Add ({readyCount})
            </button>
            {conflictCount > 0 && (
              <button
                onClick={() => setActiveTab('CONFLICTS')}
                className="btn btn-sm"
                style={{
                  backgroundColor: activeTab === 'CONFLICTS' ? 'var(--danger)' : 'var(--bg-surface)',
                  color: activeTab === 'CONFLICTS' ? 'white' : 'var(--danger-text)',
                  border: '1px solid var(--danger-border)',
                  fontWeight: activeTab === 'CONFLICTS' ? 700 : 500,
                  borderRadius: '20px',
                  padding: '4px 14px',
                  fontSize: '0.825rem',
                }}
              >
                Incomplete / Review ({conflictCount})
              </button>
            )}
            {successCount > 0 && (
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--success-text)',
                  marginLeft: '6px',
                }}
              >
                ✓ {successCount} Saved
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isSavingAll && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                <RefreshCw size={16} className="spin" style={{ color: 'var(--primary)' }} />
                <span>
                  Adding {saveProgress.current} of {saveProgress.total}...
                </span>
              </div>
            )}

            <button
              onClick={handleSaveAll}
              disabled={isSavingAll || validSelectedCount === 0}
              className="btn btn-primary btn-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 600,
                padding: '8px 18px',
                backgroundColor: validSelectedCount > 0 ? 'var(--success)' : 'var(--bg-surface)',
                borderColor: validSelectedCount > 0 ? 'var(--success)' : 'var(--border-subtle)',
                color: validSelectedCount > 0 ? 'var(--text-inverse)' : 'var(--text-muted)',
                cursor: validSelectedCount > 0 ? 'pointer' : 'not-allowed',
                opacity: validSelectedCount > 0 ? 1 : 0.65,
              }}
              title={
                validSelectedCount > 0
                  ? `Push ${validSelectedCount} fully verified employees to the database`
                  : 'Complete all required fields and check the rows to save all'
              }
            >
              <Upload size={16} />
              Save All Selected ({validSelectedCount})
            </button>
          </div>
        </div>

        {/* Staging Data Table */}
        <div style={{ flex: 1, overflowY: 'auto', maxHeight: 'calc(94vh - 215px)' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: '0.85rem',
            }}
          >
            <thead
              style={{
                position: 'sticky',
                top: 0,
                backgroundColor: 'var(--bg-subtle)',
                zIndex: 2,
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              }}
            >
              <tr>
                <th style={{ width: '40px', padding: '10px 12px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    disabled={validRowsInCurrentView.length === 0}
                    style={{
                      cursor: validRowsInCurrentView.length > 0 ? 'pointer' : 'not-allowed',
                      width: '16px',
                      height: '16px',
                    }}
                    title="Select / Deselect all ready records"
                  />
                </th>
                <th style={{ padding: '10px 12px', minWidth: '120px' }}>Status</th>
                <th style={{ padding: '10px 12px', minWidth: '110px' }}>Emp ID *</th>
                <th style={{ padding: '10px 12px', minWidth: '140px' }}>Full Name *</th>
                <th style={{ padding: '10px 12px', minWidth: '160px' }}>Email *</th>
                <th style={{ padding: '10px 12px', minWidth: '140px' }}>Phone (10 Digits) *</th>
                <th style={{ padding: '10px 12px', minWidth: '150px' }}>Department *</th>
                <th style={{ padding: '10px 12px', minWidth: '130px' }}>Designation *</th>
                <th style={{ padding: '10px 12px', minWidth: '150px' }}>Join Date *</th>
                <th style={{ padding: '10px 12px', minWidth: '110px' }}>Salary (₹) *</th>
                <th style={{ padding: '10px 12px', minWidth: '115px' }}>Status Toggle *</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', minWidth: '120px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={12} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No records found in this view.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const isSaved = row.importStatus === 'SUCCESS';
                  const isFailed = row.importStatus === 'FAILED';
                  const isDuplicateId = Boolean(
                    row.isDuplicateId ||
                    (isFailed && row.errorMessage?.toLowerCase().includes('already exists') && row.errorMessage?.toLowerCase().includes('id'))
                  );
                  const isDuplicateEmail = Boolean(
                    row.isDuplicateEmail ||
                    (isFailed && row.errorMessage?.toLowerCase().includes('already exists') && row.errorMessage?.toLowerCase().includes('email'))
                  );
                  const isRowValid = Boolean(row.isValid && !isFailed && !isDuplicateId && !isDuplicateEmail && !isSaved);
                  const isLoading = actionLoadingId === row._stagingId;
                  const hasMissing = row.missingFields && row.missingFields.length > 0;

                  // 10-digit phone calculation
                  const phoneDigits = extract10PhoneDigits(row.phoneNumber);
                  const isPhone10 = phoneDigits.length === 10;

                  // Date calculation relative to internet date
                  const isDateEmpty = !row.dateOfJoining;
                  const isDateFuture = Boolean(
                    row.dateOfJoining && row.dateOfJoining > networkTime.isoDate
                  );
                  const isDateValid = Boolean(row.dateOfJoining && !isDateFuture);

                  return (
                    <tr
                      key={row._stagingId}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        backgroundColor: isSaved
                          ? 'var(--success-subtle)'
                          : (isFailed || isDuplicateId || isDuplicateEmail)
                          ? 'var(--danger-subtle)'
                          : !row.isValid
                          ? 'var(--warning-subtle)'
                          : row.selected
                          ? 'var(--bg-subtle)'
                          : 'var(--bg-surface)',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      {/* Checkbox */}
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        {isSaved ? (
                          <Check size={18} style={{ color: 'var(--success)' }} />
                        ) : (
                          <input
                            type="checkbox"
                            checked={Boolean(row.selected && isRowValid)}
                            disabled={!isRowValid}
                            onChange={() => toggleSelectRow(row)}
                            style={{
                              cursor: isRowValid ? 'pointer' : 'not-allowed',
                              width: '16px',
                              height: '16px',
                              opacity: isRowValid ? 1 : 0.4,
                            }}
                            title={
                              !isRowValid
                                ? isDuplicateId
                                  ? 'Duplicate Employee ID already exists'
                                  : `Cannot select: please fill required fields: ${row.missingFields?.join(', ') || ''}`
                                : 'Select for batch save'
                            }
                          />
                        )}
                      </td>

                      {/* Status Badge */}
                      <td style={{ padding: '8px 12px' }}>
                        {isSaved ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              backgroundColor: 'var(--success-subtle)',
                              color: 'var(--success-text)',
                            }}
                          >
                            <CheckCircle2 size={13} /> Saved
                          </span>
                        ) : (!isRowValid || isFailed || isDuplicateId || isDuplicateEmail || !row.isValid) ? (
                          <div title={row.errors?.join('\n') || row.errorMessage || 'Review needed'}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '0.725rem',
                                fontWeight: 700,
                                backgroundColor:
                                  isDuplicateId || isDuplicateEmail || isFailed ? 'var(--danger-subtle)' : 'var(--warning-subtle)',
                                color:
                                  isDuplicateId || isDuplicateEmail || isFailed ? 'var(--danger-text)' : 'var(--warning-text)',
                              }}
                            >
                              <AlertTriangle size={12} />
                              {isDuplicateId
                                ? 'Duplicate ID'
                                : isDuplicateEmail
                                ? 'Duplicate Email'
                                : isFailed
                                ? 'Failed'
                                : hasMissing
                                ? `Missing (${row.missingFields.length})`
                                : 'Invalid'}
                            </span>
                            {isFailed && row.errorMessage && (
                              <div style={{ color: 'var(--danger)', fontSize: '0.7rem', marginTop: '2px', fontWeight: 600 }}>
                                {row.errorMessage}
                              </div>
                            )}
                            {!isFailed && hasMissing && (
                              <div
                                style={{
                                  fontSize: '0.675rem',
                                  color: 'var(--warning-text)',
                                  marginTop: '3px',
                                  maxWidth: '120px',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                Need: {row.missingFields.join(', ')}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '0.725rem',
                              fontWeight: 600,
                              backgroundColor: 'var(--success-subtle)',
                              color: 'var(--success-text)',
                            }}
                          >
                            <CheckCircle2 size={12} /> Ready
                          </span>
                        )}
                      </td>

                      {/* Editable Employee ID */}
                      <td style={{ padding: '6px 8px' }}>
                        <input
                          type="text"
                          value={row.employeeId}
                          disabled={isSaved}
                          placeholder="Required *"
                          onChange={(e) =>
                            handleFieldChange(row._stagingId, 'employeeId', e.target.value)
                          }
                          style={{
                            width: '100%',
                            padding: '4px 6px',
                            fontSize: '0.825rem',
                            borderRadius: '4px',
                            border: isDuplicateId
                              ? '2px solid var(--danger)'
                              : !row.employeeId
                              ? '1.5px solid var(--danger)'
                              : '1.5px solid var(--success)',
                            backgroundColor:
                              isDuplicateId || !row.employeeId
                                ? 'var(--danger-subtle)'
                                : 'var(--bg-surface)',
                            color: 'var(--text-main)',
                            fontWeight: 600,
                          }}
                        />
                      </td>

                      {/* Editable Full Name */}
                      <td style={{ padding: '6px 8px' }}>
                        <input
                          type="text"
                          value={row.fullName}
                          disabled={isSaved}
                          placeholder="Required *"
                          onChange={(e) =>
                            handleFieldChange(row._stagingId, 'fullName', e.target.value)
                          }
                          style={{
                            width: '100%',
                            padding: '4px 6px',
                            fontSize: '0.825rem',
                            borderRadius: '4px',
                            border: !row.fullName
                              ? '1.5px solid var(--danger)'
                              : '1.5px solid var(--success)',
                            backgroundColor: !row.fullName ? 'var(--danger-subtle)' : 'var(--bg-surface)',
                            color: 'var(--text-main)',
                          }}
                        />
                      </td>

                      {/* Editable Email */}
                      <td style={{ padding: '6px 8px' }}>
                        <input
                          type="email"
                          value={row.email}
                          disabled={isSaved}
                          placeholder="Required *"
                          onChange={(e) =>
                            handleFieldChange(row._stagingId, 'email', e.target.value)
                          }
                          style={{
                            width: '100%',
                            padding: '4px 6px',
                            fontSize: '0.825rem',
                            borderRadius: '4px',
                            border:
                              row.isDuplicateEmail || !row.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)
                                ? '1.5px solid var(--danger)'
                                : '1.5px solid var(--success)',
                            backgroundColor:
                              row.isDuplicateEmail || !row.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)
                                ? 'var(--danger-subtle)'
                                : 'var(--bg-surface)',
                            color: 'var(--text-main)',
                          }}
                        />
                      </td>

                      {/* Phone Number: Strict 10 Digits Constraint with +91 Prefix */}
                      <td style={{ padding: '6px 8px' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            borderRadius: '4px',
                            border: isPhone10 ? '1.5px solid var(--success)' : '1.5px solid var(--danger)',
                            backgroundColor: 'var(--bg-surface)',
                            overflow: 'hidden',
                          }}
                        >
                          <span
                            style={{
                              padding: '4px 6px',
                              fontSize: '0.75rem',
                              color: 'var(--text-secondary)',
                              backgroundColor: 'var(--bg-subtle)',
                              borderRight: '1px solid var(--border-subtle)',
                              fontWeight: 700,
                              userSelect: 'none',
                            }}
                          >
                            +91
                          </span>
                          <input
                            type="tel"
                            value={phoneDigits}
                            disabled={isSaved}
                            placeholder="10 digits *"
                            maxLength={10}
                            onChange={(e) => {
                              // ONLY numeric digits allowed, clean subscriber number up to 10 digits
                              const clean = extract10PhoneDigits(e.target.value);
                              handleFieldChange(row._stagingId, 'phoneNumber', clean);
                            }}
                            style={{
                              width: '100%',
                              border: 'none',
                              outline: 'none',
                              padding: '4px 6px',
                              fontSize: '0.825rem',
                              backgroundColor: 'transparent',
                              color: 'var(--text-main)',
                              fontWeight: 600,
                            }}
                          />
                        </div>
                        {!isPhone10 && (
                          <div style={{ color: 'var(--danger-text)', fontSize: '0.675rem', fontWeight: 600, marginTop: '2px' }}>
                            {phoneDigits.length === 0 ? 'Required (10 digits)' : `10 digits needed (${phoneDigits.length}/10)`}
                          </div>
                        )}
                        {isPhone10 && (
                          <div style={{ color: 'var(--success-text)', fontSize: '0.675rem', fontWeight: 600, marginTop: '2px' }}>
                            ✓ 10 Digits Valid
                          </div>
                        )}
                      </td>

                      {/* Department Select */}
                      <td style={{ padding: '6px 8px' }}>
                        <select
                          value={row.departmentId}
                          disabled={isSaved}
                          onChange={(e) =>
                            handleFieldChange(row._stagingId, 'departmentId', e.target.value)
                          }
                          style={{
                            width: '100%',
                            padding: '4px 6px',
                            fontSize: '0.825rem',
                            borderRadius: '4px',
                            border: !row.departmentId
                              ? '1.5px solid var(--danger)'
                              : '1.5px solid var(--success)',
                            backgroundColor: !row.departmentId
                              ? 'var(--danger-subtle)'
                              : 'var(--bg-surface)',
                            color: 'var(--text-main)',
                            cursor: isSaved ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <option value="">-- Select Department * --</option>
                          {departments.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Designation */}
                      <td style={{ padding: '6px 8px' }}>
                        <input
                          type="text"
                          value={row.designation}
                          disabled={isSaved}
                          placeholder="Required *"
                          onChange={(e) =>
                            handleFieldChange(row._stagingId, 'designation', e.target.value)
                          }
                          style={{
                            width: '100%',
                            padding: '4px 6px',
                            fontSize: '0.825rem',
                            borderRadius: '4px',
                            border: !row.designation
                              ? '1.5px solid var(--danger)'
                              : '1.5px solid var(--success)',
                            backgroundColor: !row.designation ? 'var(--danger-subtle)' : 'var(--bg-surface)',
                            color: 'var(--text-main)',
                          }}
                        />
                      </td>

                      {/* Date of Joining (Locked to Internet Time max; Red if future, Green if valid) */}
                      <td style={{ padding: '6px 8px' }}>
                        <input
                          type="date"
                          value={row.dateOfJoining}
                          disabled={isSaved}
                          max={networkTime.isoDate}
                          onChange={(e) =>
                            handleFieldChange(row._stagingId, 'dateOfJoining', e.target.value)
                          }
                          style={{
                            width: '100%',
                            padding: '4px 6px',
                            fontSize: '0.8rem',
                            borderRadius: '4px',
                            border:
                              isDateEmpty || isDateFuture
                                ? '1.5px solid var(--danger)'
                                : '1.5px solid var(--success)',
                            backgroundColor:
                              isDateEmpty || isDateFuture
                                ? 'var(--danger-subtle)'
                                : 'var(--bg-surface)',
                            color: 'var(--text-main)',
                          }}
                        />
                        {isDateFuture && (
                          <div style={{ color: 'var(--danger)', fontSize: '0.675rem', fontWeight: 600, marginTop: '2px' }}>
                            Future date not allowed
                          </div>
                        )}
                        {isDateEmpty && (
                          <div style={{ color: 'var(--danger)', fontSize: '0.675rem', fontWeight: 600, marginTop: '2px' }}>
                            Date required
                          </div>
                        )}
                      </td>

                      {/* Salary */}
                      <td style={{ padding: '6px 8px' }}>
                        <input
                          type="number"
                          value={row.salary}
                          disabled={isSaved}
                          placeholder="Amount *"
                          max="9999999"
                          maxLength={7}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, '');
                            if (val.split('.')[0].length > 7) return;
                            handleFieldChange(row._stagingId, 'salary', e.target.value);
                          }}
                          style={{
                            width: '100%',
                            padding: '4px 6px',
                            fontSize: '0.825rem',
                            borderRadius: '4px',
                            border:
                              row.salary === '' || isNaN(row.salary) || Number(row.salary) <= 0 || Number(row.salary) > 9999999
                                ? '1.5px solid var(--danger)'
                                : '1.5px solid var(--success)',
                            backgroundColor:
                              row.salary === '' || isNaN(row.salary) || Number(row.salary) <= 0 || Number(row.salary) > 9999999
                                ? 'var(--danger-subtle)'
                                : 'var(--bg-surface)',
                            color: 'var(--text-main)',
                          }}
                        />
                        {row.salary !== '' && !isNaN(row.salary) && Number(row.salary) > 0 && numberToWords(row.salary) && (
                          <div
                            style={{
                              color: 'var(--primary-text)',
                              fontSize: '0.675rem',
                              fontWeight: 700,
                              marginTop: '2px',
                              maxWidth: '140px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                            title={numberToWords(row.salary)}
                          >
                            🗣️ {numberToWords(row.salary)}
                          </div>
                        )}
                      </td>

                      {/* Employment Status: Interactive Toggle Switch Button (Not dropdown) */}
                      <td style={{ padding: '6px 8px' }}>
                        <button
                          type="button"
                          disabled={isSaved}
                          onClick={() => {
                            const current = row.status || 'Active';
                            const nextStatus = current === 'Active' ? 'Inactive' : 'Active';
                            handleFieldChange(row._stagingId, 'status', nextStatus);
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            padding: '5px 12px',
                            borderRadius: '20px',
                            fontSize: '0.775rem',
                            fontWeight: 700,
                            cursor: isSaved ? 'not-allowed' : 'pointer',
                            border:
                              (row.status || 'Active') === 'Active'
                                ? '1.5px solid var(--success-border)'
                                : '1.5px solid var(--danger-border)',
                            backgroundColor:
                              (row.status || 'Active') === 'Active'
                                ? 'var(--success-subtle)'
                                : 'var(--danger-subtle)',
                            color:
                              (row.status || 'Active') === 'Active'
                                ? 'var(--success-text)'
                                : 'var(--danger-text)',
                            transition: 'all 0.2s ease',
                            minWidth: '92px',
                            width: '100%',
                          }}
                          title="Click to toggle status between Active and Inactive"
                        >
                          <span
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor:
                                (row.status || 'Active') === 'Active'
                                  ? 'var(--success)'
                                  : 'var(--danger)',
                            }}
                          />
                          {row.status || 'Active'}
                        </button>
                      </td>

                      {/* Actions: Approve / Trash */}
                      <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                          }}
                        >
                          {!isSaved && (
                            <button
                              onClick={() => handleApproveSingle(row)}
                              disabled={!isRowValid || isLoading || isSavingAll}
                              className="btn btn-sm"
                              style={{
                                padding: '4px 10px',
                                fontSize: '0.775rem',
                                backgroundColor: isRowValid ? 'var(--primary)' : 'var(--bg-subtle)',
                                color: isRowValid ? 'var(--text-inverse)' : 'var(--text-muted)',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: isRowValid ? 'pointer' : 'not-allowed',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                opacity: isRowValid ? 1 : 0.6,
                              }}
                              title={
                                !isRowValid
                                  ? isDuplicateId
                                    ? 'Cannot approve: duplicate Employee ID already exists'
                                    : `Cannot approve: fill required fields (${(row.missingFields || [])
                                        .concat(row.errors || [])
                                        .join('; ')})`
                                  : 'Approve and add this employee'
                              }
                            >
                              {isLoading ? (
                                <RefreshCw size={12} className="spin" />
                              ) : (
                                <Check size={13} />
                              )}
                              Approve
                            </button>
                          )}

                          {!isSaved && (
                            <button
                              onClick={() => setDeleteConfirmTarget(row)}
                              disabled={isSavingAll}
                              className="btn btn-ghost btn-sm"
                              style={{
                                padding: '4px 6px',
                                color: 'var(--text-muted)',
                              }}
                              title="Delete this row from import"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}

                          {isSaved && (
                            <span
                              style={{
                                fontSize: '0.75rem',
                                color: 'var(--success-text)',
                                fontWeight: 600,
                              }}
                            >
                              ✓ Done
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '14px 24px',
            backgroundColor: 'var(--bg-subtle)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
            Showing <strong>{filteredRows.length}</strong> of <strong>{totalCount}</strong> staged records.
            {validSelectedCount > 0 && ` (${validSelectedCount} ready and selected for batch save)`}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={onClose}
              disabled={isSavingAll}
              className="btn btn-secondary btn-sm"
              style={{ fontWeight: 600 }}
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Popup Modal */}
      {deleteConfirmTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10005,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            animation: 'fadeIn 0.15s ease-out',
          }}
          onClick={() => setDeleteConfirmTarget(null)}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '440px',
              width: '100%',
              boxShadow: 'var(--shadow-xl)',
              border: '1px solid var(--border-subtle)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--danger-subtle)',
                  color: 'var(--danger)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Trash2 size={20} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Are you sure you want to delete this row?
                </h4>
                <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  This will discard <strong>{deleteConfirmTarget.fullName || deleteConfirmTarget.employeeId || 'this employee record'}</strong> from the staged import review.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '22px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setDeleteConfirmTarget(null)}
                style={{ fontWeight: 600, padding: '7px 16px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => {
                  removeRow(deleteConfirmTarget._stagingId);
                  setDeleteConfirmTarget(null);
                }}
                style={{
                  backgroundColor: 'var(--danger)',
                  color: 'white',
                  border: 'none',
                  fontWeight: 600,
                  padding: '7px 18px',
                  borderRadius: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <Trash2 size={14} />
                <span>Yes, Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportReviewModal;
