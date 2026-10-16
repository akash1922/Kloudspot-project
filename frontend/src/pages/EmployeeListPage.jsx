import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { employeeApi } from '../api/employees';
import { departmentApi } from '../api/departments';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';
import ImportReviewModal from '../components/ImportReviewModal';
import { parseUploadedFile } from '../utils/universalFileParser';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  getQueryCache,
  setQueryCache,
  updateCachedEmployee,
  removeCachedEmployee,
  clearQueryCache,
} from '../utils/cacheService';
import {
  Search,
  Plus,
  Download,
  Upload,
  Eye,
  Edit2,
  Trash2,
  ArrowUpDown,
  RefreshCw,
  Building,
  UserCheck,
  X,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  Archive,
  ChevronDown,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';

export const EmployeeListPage = () => {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isBackgroundSyncing, setIsBackgroundSyncing] = useState(false);
  const [isOfflineCached, setIsOfflineCached] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [exportingType, setExportingType] = useState(null); // 'csv' | 'xlsx' | null
  const [statusCounts, setStatusCounts] = useState({ active: 0, inactive: 0, all: 0, archived: 0 });
  const [importing, setImporting] = useState(false);

  // Universal Import Review & Staging state (CSV, Excel .xls/.xlsx, PDF)
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [stagedRows, setStagedRows] = useState([]);
  const [stagedFileName, setStagedFileName] = useState('');
  const [parsingFile, setParsingFile] = useState(false);
  const [fullExistingEmployees, setFullExistingEmployees] = useState([]);

  // Search & Filters - Defaults to 'Active'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Active');
  const [sortBy, setSortBy] = useState('id');
  const [sortDir, setSortDir] = useState('asc');

  // Pagination state
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isFirst, setIsFirst] = useState(true);
  const [isLast, setIsLast] = useState(true);

  // Modals for Archive/Delete
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Status Change Confirmation Pop Target
  const [statusPopupTarget, setStatusPopupTarget] = useState(null);
  const [togglingStatus, setTogglingStatus] = useState(false);

  const fileInputRef = useRef(null);
  const { addToast } = useAuth();
  const navigate = useNavigate();

  // Fetch real count summaries across Active, Inactive, All, and Archive
  const fetchStatusCounts = useCallback(async () => {
    try {
      const counts = await employeeApi.getCounts();
      setStatusCounts(counts);
    } catch (err) {
      console.warn('Failed to load employee status counts', err);
    }
  }, []);

  // Load departments and real count badges
  useEffect(() => {
    departmentApi
      .getAll()
      .then((data) => setDepartments(data))
      .catch((err) => console.error('Failed to load departments', err));
    fetchStatusCounts();
  }, [fetchStatusCounts]);

  // Compute unique query key for client caching
  const currentCacheKey = `emp_${searchTerm}_${selectedDept}_${selectedStatus}_${page}_${pageSize}_${sortBy}_${sortDir}`;

  // Stale-While-Revalidate: Instant 0ms Paint from IndexedDB + Silent Background Network Sync
  const fetchEmployees = useCallback(
    async (forceBackgroundOnly = false) => {
      // 1. Instant Paint: Render cached data from IndexedDB in 0ms (no wiping screen, no spinner)
      if (!forceBackgroundOnly) {
        try {
          const cached = await getQueryCache(currentCacheKey);
          if (cached && Array.isArray(cached.content) && cached.content.length > 0) {
            setEmployees(cached.content);
            setTotalElements(cached.totalElements || 0);
            setTotalPages(cached.totalPages || 0);
            setIsFirst(cached.first ?? true);
            setIsLast(cached.last ?? true);
            setIsInitialLoading(false);
          }
        } catch (e) {
          // Continue to network fetch
        }
      }

      // 2. Silent Background Synchronization
      setIsBackgroundSyncing(true);

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
        setIsOfflineCached(false);

        // Update IndexedDB cache with latest server truth
        setQueryCache(currentCacheKey, data);
        fetchStatusCounts();
      } catch (err) {
        console.warn('Network sync slow or offline, serving local cache', err);
        setIsOfflineCached(true);
      } finally {
        setIsBackgroundSyncing(false);
        setIsInitialLoading(false);
      }
    },
    [currentCacheKey, searchTerm, selectedDept, selectedStatus, page, pageSize, sortBy, sortDir]
  );

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  const handleDeptChange = (e) => {
    setSelectedDept(e.target.value);
    setPage(0);
  };

  // Clickable Department Badge: Quick Filter by Department
  const handleDepartmentFilterClick = (deptId) => {
    if (deptId) {
      setSelectedDept(String(deptId));
      setPage(0);
    }
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
    setExportingType('csv');
    setExportDropdownOpen(false);
    try {
      await employeeApi.exportCsv({
        search: searchTerm,
        departmentId: selectedDept || undefined,
        status: selectedStatus,
      });
      addToast('Employees exported to CSV (.csv) successfully.', 'success');
    } catch (err) {
      addToast('Failed to export employee records to CSV.', 'error');
    } finally {
      setExportingType(null);
    }
  };

  const handleExportExcel = async () => {
    setExportingType('xlsx');
    setExportDropdownOpen(false);
    try {
      await employeeApi.exportExcel({
        search: searchTerm,
        departmentId: selectedDept || undefined,
        status: selectedStatus,
      });
      addToast('Employees exported to Excel (.xlsx) successfully.', 'success');
    } catch (err) {
      addToast('Failed to export employee records to Excel.', 'error');
    } finally {
      setExportingType(null);
    }
  };

  // Universal File Import Trigger & Handler (CSV, Excel, PDF)
  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so re-selecting the same file works reliably
    e.target.value = '';

    const lower = file.name.toLowerCase();
    const isSupported =
      lower.endsWith('.csv') ||
      lower.endsWith('.xlsx') ||
      lower.endsWith('.xls') ||
      lower.endsWith('.pdf');

    if (!isSupported) {
      addToast('Please upload a valid .csv, .xlsx, .xls, or .pdf file.', 'error');
      return;
    }

    setParsingFile(true);
    try {
      // Query complete employee directory (active, inactive, and archived) for 100% duplicate pre-detection
      let fullDirectory = [];
      try {
        const [activeAndInactiveRes, archivedRes] = await Promise.all([
          employeeApi.getEmployees({ size: 5000, status: 'ALL' }),
          employeeApi.getArchived(),
        ]);
        const map = new Map();
        (activeAndInactiveRes?.content || []).forEach((e) => {
          if (e?.employeeId) map.set(String(e.employeeId).toLowerCase().trim(), e);
        });
        (archivedRes || []).forEach((e) => {
          if (e?.employeeId) map.set(String(e.employeeId).toLowerCase().trim(), e);
        });
        fullDirectory = Array.from(map.values());
      } catch (fetchErr) {
        console.warn('Could not fetch full employee directory before parsing', fetchErr);
        fullDirectory = employees;
      }

      setFullExistingEmployees(fullDirectory);

      const parsed = await parseUploadedFile(file, departments, fullDirectory);

      if (!parsed || parsed.length === 0) {
        addToast('No employee records could be identified in the uploaded file.', 'error');
        return;
      }

      setStagedRows(parsed);
      setStagedFileName(file.name);
      setImportModalOpen(true);
      addToast(`Detected ${parsed.length} employee record(s). Review and approve them below.`, 'info');
    } catch (err) {
      addToast(err.message || 'Failed to parse uploaded file.', 'error');
    } finally {
      setParsingFile(false);
    }
  };

  const handleImportModalComplete = (addedCount, shouldClose = true) => {
    addToast(`Import Completed: ${addedCount} employee(s) added successfully!`, 'success');
    if (shouldClose) {
      setImportModalOpen(false);
      setStagedRows([]);
      setStagedFileName('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
    clearQueryCache();
    fetchEmployees(true);
    fetchStatusCounts();
  };

  // Status Toggle Execution (Instant Feedback, Closes Pop Immediately, Syncs List)
  const executeStatusToggle = async (emp) => {
    if (!emp) return;
    const targetStatus = emp.status === 'Active' ? 'Inactive' : 'Active';

    // 1. Immediately dismiss the popup dialog so it never lingers or gets stuck
    setStatusPopupTarget(null);

    // 2. Immediate optimistic update in the table:
    // When filtering by 'Active' or 'Inactive', remove the employee from this filtered view
    if (selectedStatus === 'Active' || selectedStatus === 'Inactive') {
      setEmployees((prev) => prev.filter((item) => item.id !== emp.id));
      setTotalElements((prev) => Math.max(0, prev - 1));
    } else {
      // If viewing 'ALL', flip status in place
      setEmployees((prev) =>
        prev.map((item) => (item.id === emp.id ? { ...item, status: targetStatus } : item))
      );
    }

    // 3. Persist change to backend silently
    setTogglingStatus(true);
    updateCachedEmployee({ ...emp, status: targetStatus });
    try {
      await employeeApi.toggleStatus(emp, targetStatus);
      addToast(`Status of '${emp.fullName}' updated to ${targetStatus}.`, 'success');
      fetchEmployees(true);
      fetchStatusCounts();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update status.', 'error');
      fetchEmployees(false);
    } finally {
      setTogglingStatus(false);
    }
  };

  // Soft delete / Move to Archive (Instant Optimistic Removal 0ms)
  const promptDelete = (emp) => {
    setEmployeeToDelete(emp);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!employeeToDelete) return;
    const target = employeeToDelete;
    setDeleting(true);

    // Optimistic removal from table and cache immediately
    setEmployees((prev) => prev.filter((item) => item.id !== target.id));
    setTotalElements((prev) => Math.max(0, prev - 1));
    removeCachedEmployee(target.id);
    setDeleteModalOpen(false);
    setEmployeeToDelete(null);

    try {
      await employeeApi.delete(target.id);
      addToast(`Employee '${target.fullName}' moved to Archive (13-day TTL policy).`, 'success');
      fetchEmployees(true);
      fetchStatusCounts();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to archive employee.', 'error');
      fetchEmployees(false);
    } finally {
      setDeleting(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDept('');
    setSelectedStatus('Active');
    setPage(0);
  };

  const activeDeptName = departments.find((d) => String(d.id) === String(selectedDept))?.name;

  return (
    <div className="page-wrapper">
      {/* Hidden file input for Universal Import (.csv, .xlsx, .xls, .pdf) */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        accept=".csv, .xlsx, .xls, .pdf, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, application/pdf"
        style={{ display: 'none' }}
      />

      {/* Page Header */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.75rem', margin: 0 }}>Employee Directory</h1>
            {isBackgroundSyncing && (
              <span
                style={{
                  fontSize: '0.725rem',
                  fontWeight: 600,
                  color: 'var(--primary)',
                  backgroundColor: 'var(--primary-subtle)',
                  padding: '3px 9px',
                  borderRadius: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
                title="Synchronizing live changes with server in background"
              >
                <RefreshCw size={11} className="spin" />
                Syncing...
              </span>
            )}
            {isOfflineCached && (
              <span
                style={{
                  fontSize: '0.725rem',
                  fontWeight: 600,
                  color: '#b45309',
                  backgroundColor: '#fef3c7',
                  padding: '3px 9px',
                  borderRadius: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                title="Displaying records from local persistent cache"
              >
                ● Offline Mode (Cached)
              </span>
            )}
          </div>

        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          {/* Universal Import Button */}
          <button
            onClick={handleImportClick}
            className="btn btn-secondary"
            disabled={parsingFile}
            title="Import employees from CSV, Excel (.xls/.xlsx), or PDF"
          >
            {parsingFile ? (
              <div className="spinner spinner-primary" style={{ width: '16px', height: '16px' }} />
            ) : (
              <Upload size={16} />
            )}
            <span>Import (CSV / Excel / PDF)</span>
          </button>

          {/* Export Dropdown Menu (Strictly CSV or .xlsx Excel - No PDF) */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setExportDropdownOpen((prev) => !prev)}
              className="btn btn-secondary"
              disabled={Boolean(exportingType)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 600,
              }}
              title="Export filtered records as CSV or Excel (.xlsx)"
            >
              {exportingType ? (
                <div className="spinner spinner-primary" style={{ width: '15px', height: '15px' }} />
              ) : (
                <Download size={16} />
              )}
              <span>Export {exportingType ? `(${exportingType.toUpperCase()})...` : 'Data'}</span>
              <ChevronDown
                size={14}
                style={{
                  transition: 'transform 0.2s ease',
                  transform: exportDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  color: 'var(--text-muted)',
                }}
              />
            </button>

            {exportDropdownOpen && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 998 }}
                  onClick={() => setExportDropdownOpen(false)}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    right: 0,
                    width: '260px',
                    backgroundColor: 'var(--bg-surface)',
                    borderRadius: '12px',
                    boxShadow: 'var(--shadow-xl)',
                    border: '1px solid var(--border-subtle)',
                    padding: '8px',
                    zIndex: 999,
                    animation: 'fadeIn 0.15s ease-out',
                  }}
                >
                  <div
                    style={{
                      padding: '6px 10px 8px',
                      fontSize: '0.725rem',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      borderBottom: '1px solid var(--border-subtle)',
                      marginBottom: '6px',
                    }}
                  >
                    Select Export Format
                  </div>

                  {/* Option 1: CSV */}
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '10px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--primary-subtle)',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <FileText size={17} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        CSV Document (.csv)
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Raw comma-separated table data
                      </div>
                    </div>
                  </button>

                  {/* Option 2: Excel (.xlsx) */}
                  <button
                    type="button"
                    onClick={handleExportExcel}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '10px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--success-subtle)',
                        color: 'var(--success-text)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <FileSpreadsheet size={17} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        Excel Workbook (.xlsx)
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Styled spreadsheet with auto-width columns
                      </div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Add Employee CTA */}
          <Link to="/employees/add" className="btn btn-primary">
            <Plus size={16} />
            <span>Add Employee</span>
          </Link>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1, minWidth: '320px' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
            <Search
              size={16}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: '36px' }}
              placeholder="Search by name, email, or employee ID..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Department Filter Dropdown */}
          <div style={{ width: '220px' }}>
            <select
              className="form-control"
              value={selectedDept}
              onChange={handleDeptChange}
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} ({dept.employeeCount || 0})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Segmented Switch with Real Notification Counter Badges */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              display: 'inline-flex',
              backgroundColor: 'var(--bg-subtle)',
              padding: '3px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {[
              {
                id: 'Active',
                label: 'Active',
                count: statusCounts.active,
                badgeColor: 'var(--success-text)',
                badgeBg: 'var(--success-subtle)',
                activeBadgeColor: 'var(--success-text)',
                activeBadgeBg: 'var(--success-border)',
              },
              {
                id: 'ALL',
                label: 'All',
                count: statusCounts.all,
                badgeColor: 'var(--text-secondary)',
                badgeBg: 'var(--bg-subtle)',
                activeBadgeColor: 'var(--text-main)',
                activeBadgeBg: 'var(--border-subtle)',
              },
              {
                id: 'Inactive',
                label: 'Inactive',
                count: statusCounts.inactive,
                badgeColor: 'var(--danger-text)',
                badgeBg: 'var(--danger-subtle)',
                activeBadgeColor: 'var(--danger-text)',
                activeBadgeBg: 'var(--danger-border)',
              },
            ].map((tab) => {
              const isSelected = selectedStatus === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleStatusChange(tab.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 12px',
                    borderRadius: 'var(--radius-xs)',
                    fontSize: '0.825rem',
                    fontWeight: 600,
                    backgroundColor: isSelected ? 'var(--bg-surface)' : 'transparent',
                    color: isSelected ? 'var(--text-main)' : 'var(--text-muted)',
                    boxShadow: isSelected ? 'var(--shadow-xs)' : 'none',
                    transition: 'all var(--transition-fast)',
                    cursor: 'pointer',
                    border: 'none',
                  }}
                >
                  <span>{tab.label}</span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '1px 6px',
                      borderRadius: '10px',
                      fontSize: '0.725rem',
                      fontWeight: 700,
                      backgroundColor: isSelected ? tab.activeBadgeBg : tab.badgeBg,
                      color: isSelected ? tab.activeBadgeColor : tab.badgeColor,
                      lineHeight: '1.2',
                      minWidth: '18px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Archive Icon Button with Real Notification Counter Badge */}
          <Link
            to="/archive"
            className="btn btn-secondary"
            style={{
              padding: '6px 12px',
              height: '35px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-surface)',
              boxShadow: 'var(--shadow-xs)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
              position: 'relative',
              textDecoration: 'none',
            }}
            title={`Employee Archive (${statusCounts.archived} records in 13-day retention)`}
          >
            <Archive size={16} />
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1px 6px',
                borderRadius: '10px',
                fontSize: '0.725rem',
                fontWeight: 700,
                backgroundColor: statusCounts.archived > 0 ? 'var(--warning-subtle)' : 'var(--bg-subtle)',
                color: statusCounts.archived > 0 ? 'var(--warning-text)' : 'var(--text-muted)',
                lineHeight: '1.2',
                minWidth: '18px',
              }}
            >
              {statusCounts.archived}
            </span>
          </Link>
        </div>

        {/* Reset Filters button if altered */}
        {(searchTerm || selectedDept || selectedStatus !== 'Active') && (
          <button
            onClick={clearFilters}
            className="btn btn-secondary btn-sm"
            style={{ color: 'var(--danger-text)', borderColor: 'var(--danger-border)' }}
            title="Reset filters to default"
          >
            <RefreshCw size={14} />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Active Filter Chips Banner */}
      {selectedDept && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            backgroundColor: 'var(--primary-subtle)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.825rem',
            color: 'var(--primary-text)',
            fontWeight: 600,
            marginBottom: 'var(--space-4)',
          }}
        >
          <span>Filtered by Department: <strong>{activeDeptName || 'Department'}</strong></span>
          <button
            onClick={() => setSelectedDept('')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              color: 'var(--primary-text)',
            }}
            title="Clear department filter"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main Employee Table Card */}
      <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Subtle Background Sync Bar (Zero Screen Wipe, Non-intrusive) */}
        {isBackgroundSyncing && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              zIndex: 10,
              overflow: 'hidden',
              backgroundColor: 'rgba(99, 102, 241, 0.12)',
            }}
          >
            <div className="sync-progress-bar" />
          </div>
        )}

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th
                  onClick={() => handleSort('employeeId')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>EMP ID</span>
                    <ArrowUpDown size={13} color="var(--text-muted)" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('fullName')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>EMPLOYEE NAME</span>
                    <ArrowUpDown size={13} color="var(--text-muted)" />
                  </div>
                </th>
                <th>CONTACT</th>
                <th>DEPARTMENT & DESIGNATION</th>
                <th
                  onClick={() => handleSort('dateOfJoining')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>JOINING DATE</span>
                    <ArrowUpDown size={13} color="var(--text-muted)" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('salary')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>SALARY</span>
                    <ArrowUpDown size={13} color="var(--text-muted)" />
                  </div>
                </th>
                <th>STATUS</th>
                <th className="col-actions">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {isInitialLoading && employees.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <div className="spinner spinner-primary" style={{ width: '28px', height: '28px' }} />
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        Loading employee directory...
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
                        Show All Active Employees
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id}>
                    {/* Emp ID */}
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

                    {/* Employee Name & Clickable Email Link */}
                    <td>
                      <div>
                        <Link
                          to={`/employees/${emp.id}`}
                          style={{
                            fontWeight: 700,
                            color: 'var(--text-main)',
                            display: 'block',
                            fontSize: '0.925rem',
                            marginBottom: '2px',
                          }}
                        >
                          {emp.fullName}
                        </Link>
                        {/* Clickable Email directly directing to mailto */}
                        <a
                          href={`mailto:${emp.email}`}
                          className="contact-link"
                          title={`Click to email ${emp.email}`}
                        >
                          <Mail size={12} color="var(--primary)" />
                          <span>{emp.email}</span>
                        </a>
                      </div>
                    </td>

                    {/* Contact: Clickable Phone Number directly directing to tel */}
                    <td>
                      <a
                        href={`tel:${emp.phoneNumber}`}
                        className="contact-link contact-link-phone"
                        title={`Click to call ${emp.phoneNumber}`}
                      >
                        <Phone size={13} color="var(--primary)" />
                        <span>{emp.phoneNumber}</span>
                      </a>
                    </td>

                    {/* Department & Designation: Clickable Department Pill Badge */}
                    <td>
                      <div>
                        <span
                          className="badge badge-dept badge-dept-clickable"
                          onClick={() => handleDepartmentFilterClick(emp.departmentId)}
                          title={`Click to show only employees from ${emp.departmentName || 'this department'}`}
                          style={{ marginBottom: '3px', display: 'inline-flex' }}
                        >
                          {emp.departmentName || 'General'}
                        </span>
                        <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                          {emp.designation}
                        </div>
                      </div>
                    </td>

                    {/* Reusable Formatted Joining Date (dd-MMM-yyyy) */}
                    <td>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {formatDate(emp.dateOfJoining)}
                      </span>
                    </td>

                    {/* Reusable Formatted Salary with INR (₹) Symbol */}
                    <td>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                        {formatCurrency(emp.salary)}
                      </span>
                    </td>

                    {/* Status with Inline Confirmation Popover (No Full-Screen Modal) */}
                    {/* Status Column with Clickable Badge */}
                    <td>
                      <StatusBadge
                        status={emp.status}
                        clickable={true}
                        onClick={() => setStatusPopupTarget(emp)}
                      />
                    </td>

                    {/* Actions */}
                    <td className="col-actions">
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          justifyContent: 'flex-end',
                        }}
                      >
                        <Link
                          to={`/employees/${emp.id}`}
                          className="btn-icon"
                          title="View Profile & Audit Trail"
                        >
                          <Eye size={15} />
                        </Link>
                        <Link
                          to={`/employees/edit/${emp.id}`}
                          className="btn-icon"
                          title="Edit Employee"
                        >
                          <Edit2 size={15} />
                        </Link>
                        <button
                          onClick={() => promptDelete(emp)}
                          className="btn-icon btn-icon-danger"
                          title="Move to Archive (13-day TTL)"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Reusable Pagination */}
        <Pagination
          pageNumber={page}
          currentPage={page}
          totalPages={totalPages}
          pageSize={pageSize}
          totalElements={totalElements}
          first={isFirst}
          last={isLast}
          isFirst={isFirst}
          isLast={isLast}
          onPageChange={(newPage) => setPage(newPage)}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(0);
          }}
        />
      </div>

      {/* Delete / Archive Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Move to Archive"
        message={
          employeeToDelete
            ? `Move ${employeeToDelete.fullName} (${employeeToDelete.employeeId}) to the archive? The record will be held for 13 days before automated permanent deletion. You can restore it anytime.`
            : ''
        }
        confirmText="Archive Employee"
        cancelText="Cancel"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setEmployeeToDelete(null);
        }}
      />

      {/* Status Confirmation Pop Dialog (Centered, Never Clipped, Crisp Animation) */}
      {statusPopupTarget && (
        <div
          className="status-popup-backdrop"
          onClick={() => !togglingStatus && setStatusPopupTarget(null)}
        >
          <div
            className="status-popup-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="status-popup-header">
              <div className="status-popup-icon">
                <AlertCircle size={22} />
              </div>
              <div>
                <h4 className="status-popup-title">
                  Are you sure you want make this change?
                </h4>
                <p className="status-popup-subtitle">
                  Switch status of <strong>{statusPopupTarget.fullName}</strong> to{' '}
                  <strong style={{ color: statusPopupTarget.status === 'Active' ? 'var(--danger-text)' : 'var(--success-text)' }}>
                    {statusPopupTarget.status === 'Active' ? 'Inactive' : 'Active'}
                  </strong>
                </p>
              </div>
            </div>

            <div className="status-popup-actions">
              <button
                type="button"
                className="btn-popup-cancel"
                onClick={() => setStatusPopupTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-popup-confirm"
                onClick={(e) => {
                  e.stopPropagation();
                  executeStatusToggle(statusPopupTarget);
                }}
              >
                <CheckCircle2 size={16} />
                <span>Yes, Confirm</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Universal Import Review & Approval Modal */}
      <ImportReviewModal
        isOpen={importModalOpen}
        onClose={() => {
          setImportModalOpen(false);
          setStagedRows([]);
          setStagedFileName('');
          fetchEmployees();
        }}
        fileName={stagedFileName}
        initialRows={stagedRows}
        departments={departments}
        existingEmployees={fullExistingEmployees.length > 0 ? fullExistingEmployees : employees}
        onImportComplete={handleImportModalComplete}
      />
    </div>
  );
};

export default EmployeeListPage;
