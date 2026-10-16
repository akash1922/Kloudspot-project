import * as XLSX from 'xlsx';

/**
 * Normalizes string for fuzzy header comparison
 */
const cleanHeader = (h) =>
  String(h || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

/**
 * Cleanly extracts exactly the 10-digit subscriber phone number,
 * correctly stripping any leading country code (+91, 91) or leading 0.
 */
export const extract10PhoneDigits = (val) => {
  if (!val) return '';
  let str = String(val).trim();
  if (str.startsWith('+91')) {
    str = str.slice(3).trim();
  } else if (str.startsWith('+')) {
    str = str.slice(1).trim();
  }
  let digits = str.replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length === 12) {
    digits = digits.slice(2);
  } else if (digits.startsWith('0') && digits.length === 11) {
    digits = digits.slice(1);
  }
  if (digits.length > 10) {
    digits = digits.slice(-10);
  }
  return digits;
};

/**
 * Validates a single staged employee record against mandatory database constraints and duplicates.
 * NO mock, fake, or placeholder values allowed.
 */
export const validateStagedRow = (
  row,
  existingIdSet = new Set(),
  existingEmailSet = new Set(),
  allRows = [],
  maxNetworkDate = null
) => {
  const errors = [];
  const missingFields = [];

  const empId = String(row.employeeId || '').trim();
  const name = String(row.fullName || '').trim();
  const email = String(row.email || '').trim().toLowerCase();
  const phone = String(row.phoneNumber || '').trim();
  const deptId = row.departmentId ? Number(row.departmentId) : null;
  const designation = String(row.designation || '').trim();
  const doj = String(row.dateOfJoining || '').trim();
  const salary =
    row.salary !== '' && row.salary !== null && row.salary !== undefined
      ? Number(row.salary)
      : NaN;
  const status = String(row.status || 'Active').trim();

  // 1. Employee ID
  if (!empId) {
    errors.push('Employee ID is required');
    missingFields.push('Emp ID');
  } else if (!/^EMP[A-Za-z0-9_-]{1,27}$/i.test(empId)) {
    errors.push("Employee ID must strictly start with 'EMP' (e.g. EMP1001)");
    missingFields.push('Emp ID');
  } else {
    const isDupInDB = existingIdSet.has(empId.toLowerCase());
    const isDupInBatch = allRows.some(
      (other) =>
        other._stagingId !== row._stagingId &&
        String(other.employeeId || '').trim().toLowerCase() === empId.toLowerCase()
    );
    if (isDupInDB) {
      errors.push(`Employee ID '${empId}' already exists in database`);
    } else if (isDupInBatch) {
      errors.push(`Duplicate Employee ID '${empId}' in upload file`);
    }
  }

  // 2. Full Name
  if (!name) {
    errors.push('Full Name is required');
    missingFields.push('Name');
  } else if (name.length < 2) {
    errors.push('Full Name must be at least 2 characters');
  }

  // 3. Email
  if (!email) {
    errors.push('Email is required');
    missingFields.push('Email');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Email address is invalid');
  } else {
    const isDupEmailInDB = existingEmailSet.has(email);
    const isDupEmailInBatch = allRows.some(
      (other) =>
        other._stagingId !== row._stagingId &&
        String(other.email || '').trim().toLowerCase() === email
    );
    if (isDupEmailInDB) {
      errors.push(`Email '${email}' already registered in database`);
    } else if (isDupEmailInBatch) {
      errors.push(`Duplicate Email '${email}' in upload file`);
    }
  }

  // 4. Phone Number (Must be exactly 10 digits)
  const phoneDigits = extract10PhoneDigits(phone);
  if (!phone || phoneDigits.length === 0) {
    errors.push('Phone number is required');
    missingFields.push('Phone');
  } else if (phoneDigits.length !== 10) {
    errors.push(`Phone number must be exactly 10 digits (currently ${phoneDigits.length})`);
    missingFields.push('Phone');
  }

  // 5. Department
  if (!deptId || isNaN(deptId)) {
    errors.push('Department selection is required');
    missingFields.push('Department');
  }

  // 6. Designation
  if (!designation) {
    errors.push('Designation is required');
    missingFields.push('Designation');
  } else if (designation.length < 2) {
    errors.push('Designation must be at least 2 characters');
  }

  // 7. Date of Joining (Cannot be in the future relative to internet network date)
  const maxDate = maxNetworkDate || new Date().toISOString().slice(0, 10);
  if (!doj) {
    errors.push('Date of Joining is required');
    missingFields.push('Join Date');
  } else {
    const d = new Date(doj);
    if (isNaN(d.getTime())) {
      errors.push('Invalid Date of Joining');
    } else if (doj > maxDate) {
      errors.push('Date of Joining cannot be in the future');
    }
  }

  // 8. Salary (Must be positive and max 7 digits)
  if (isNaN(salary) || salary === null || salary === undefined || row.salary === '') {
    errors.push('Salary is required');
    missingFields.push('Salary');
  } else if (salary <= 0) {
    errors.push('Salary must be greater than 0');
  } else if (salary > 9999999 || String(Math.floor(salary)).length > 7) {
    errors.push('Salary cannot exceed 7 digits (maximum ₹99,99,999)');
    missingFields.push('Salary');
  }

  // 9. Status (Defaults to Active)
  const effectiveStatus = status || 'Active';
  if (effectiveStatus !== 'Active' && effectiveStatus !== 'Inactive') {
    errors.push('Status must be Active or Inactive');
    missingFields.push('Status');
  }

  const isDuplicateId = errors.some(
    (e) => e.includes('Employee ID') && (e.includes('already exists') || e.includes('Duplicate'))
  );
  const isDuplicateEmail = errors.some(
    (e) => e.includes('Email') && (e.includes('already registered') || e.includes('Duplicate'))
  );

  return {
    isValid: errors.length === 0,
    errors,
    missingFields,
    isDuplicateId,
    isDuplicateEmail,
  };
};

/**
 * Extracts tabular rows from raw 2D array and maps ONLY real, present data.
 * Missing values remain blank so admin can fill and review before approval.
 */
export const parseRawRows = (rows, departments = [], existingEmployees = []) => {
  if (!rows || rows.length === 0) return [];

  // Filter out completely blank lines
  const nonEmptyRows = rows.filter(
    (row) =>
      Array.isArray(row) &&
      row.some((c) => c !== null && c !== undefined && String(c).trim().length > 0)
  );

  if (nonEmptyRows.length === 0) return [];

  // Find header row if present
  let headerRowIdx = -1;
  for (let i = 0; i < Math.min(5, nonEmptyRows.length); i++) {
    const rowStr = nonEmptyRows[i].map(cleanHeader).join(' ');
    if (
      (rowStr.includes('name') || rowStr.includes('employee')) &&
      (rowStr.includes('email') || rowStr.includes('id') || rowStr.includes('phone') || rowStr.includes('dept'))
    ) {
      headerRowIdx = i;
      break;
    }
  }

  const headerMap = {};
  let startDataIdx = 1;

  if (headerRowIdx !== -1) {
    const headerRow = nonEmptyRows[headerRowIdx].map(cleanHeader);
    startDataIdx = headerRowIdx + 1;

    headerRow.forEach((h, idx) => {
      if (h.includes('empid') || h === 'id' || h.includes('employeeid') || h.includes('empcode') || h === 'code') {
        if (headerMap.employeeId === undefined) headerMap.employeeId = idx;
      } else if (h.includes('name') || h === 'fullname' || h === 'empname' || h.includes('staff')) {
        if (headerMap.fullName === undefined) headerMap.fullName = idx;
      } else if (h.includes('email') || h.includes('mail')) {
        if (headerMap.email === undefined) headerMap.email = idx;
      } else if (h.includes('phone') || h.includes('mobile') || h.includes('contact') || h.includes('tel')) {
        if (headerMap.phoneNumber === undefined) headerMap.phoneNumber = idx;
      } else if (h.includes('dept') || h.includes('department') || h.includes('division')) {
        if (headerMap.department === undefined) headerMap.department = idx;
      } else if (h.includes('desig') || h.includes('role') || h.includes('title') || h.includes('position')) {
        if (headerMap.designation === undefined) headerMap.designation = idx;
      } else if (h.includes('join') || h.includes('date') || h === 'doj' || h.includes('start')) {
        if (headerMap.dateOfJoining === undefined) headerMap.dateOfJoining = idx;
      } else if (h.includes('salary') || h.includes('comp') || h.includes('ctc') || h.includes('pay') || h.includes('wage')) {
        if (headerMap.salary === undefined) headerMap.salary = idx;
      } else if (h.includes('status')) {
        if (headerMap.status === undefined) headerMap.status = idx;
      }
    });
  } else {
    // Positional fallback
    headerMap.employeeId = 0;
    headerMap.fullName = 1;
    headerMap.email = 2;
    headerMap.phoneNumber = 3;
    headerMap.department = 4;
    headerMap.designation = 5;
    headerMap.dateOfJoining = 6;
    headerMap.salary = 7;
    headerMap.status = 8;
    startDataIdx = 0;
  }

  // Pre-build sets for fast duplicate lookup
  const existingIdSet = new Set(
    (existingEmployees || []).map((e) => String(e.employeeId || '').toLowerCase().trim())
  );
  const existingEmailSet = new Set(
    (existingEmployees || []).map((e) => String(e.email || '').toLowerCase().trim())
  );

  const stagedEmployees = [];

  for (let r = startDataIdx; r < nonEmptyRows.length; r++) {
    const row = nonEmptyRows[r];
    if (!row || row.length === 0) continue;

    const getVal = (key) => {
      const idx = headerMap[key];
      if (idx !== undefined && idx < row.length && row[idx] !== null && row[idx] !== undefined) {
        return String(row[idx]).trim();
      }
      return '';
    };

    const rawEmpId = getVal('employeeId');
    const rawName = getVal('fullName');
    const rawEmail = getVal('email');
    const rawPhone = getVal('phoneNumber');
    const rawDept = getVal('department');
    const rawDesignation = getVal('designation');
    const rawDate = getVal('dateOfJoining');
    const rawSalary = getVal('salary');
    const rawStatus = getVal('status');

    // Skip row if completely empty
    if (!rawEmpId && !rawName && !rawEmail && !rawPhone) continue;

    // ONLY REAL VALUES: Leave empty if not present in the uploaded file
    const realEmpId = rawEmpId || '';
    const realName = rawName || '';
    const realEmail = rawEmail ? rawEmail.toLowerCase() : '';
    const realDesignation = rawDesignation || '';

    // Phone: only format if real digits are present; store clean 10-digit subscriber number
    let realPhone = '';
    if (rawPhone) {
      realPhone = extract10PhoneDigits(rawPhone);
    }

    // Department match: only if specified in file
    let realDepartmentId = '';
    if (rawDept) {
      if (!isNaN(Number(rawDept))) {
        const foundById = departments.find((d) => d.id === Number(rawDept));
        if (foundById) realDepartmentId = foundById.id;
      } else {
        const found = departments.find(
          (d) => d.name.toLowerCase().trim() === rawDept.toLowerCase().trim()
        );
        if (found) realDepartmentId = found.id;
      }
    }

    // Date normalization: only if specified in file
    let realDate = '';
    if (rawDate) {
      // Excel serial date number support (e.g. 45214)
      if (!isNaN(Number(rawDate)) && Number(rawDate) > 30000 && Number(rawDate) < 60000) {
        const jsDate = new Date((Number(rawDate) - (25567 + 2)) * 86400 * 1000);
        if (!isNaN(jsDate.getTime())) {
          realDate = jsDate.toISOString().slice(0, 10);
        }
      } else {
        const parts = rawDate.split(/[-/.]/);
        if (parts.length === 3) {
          if (parts[2].length === 4) {
            // DD-MM-YYYY or MM-DD-YYYY
            realDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          } else if (parts[0].length === 4) {
            // YYYY-MM-DD
            realDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
          }
        } else {
          const d = new Date(rawDate);
          if (!isNaN(d.getTime())) {
            realDate = d.toISOString().slice(0, 10);
          }
        }
      }
    }

    // Salary: only if specified in file
    let realSalary = '';
    if (rawSalary) {
      const cleanNum = Number(String(rawSalary).replace(/[^0-9.]/g, ''));
      if (!isNaN(cleanNum) && cleanNum > 0) {
        realSalary = cleanNum;
      }
    }

    // Status: default to 'Active'
    let realStatus = 'Active';
    if (rawStatus) {
      if (rawStatus.toLowerCase().includes('inact')) {
        realStatus = 'Inactive';
      } else if (rawStatus.toLowerCase().includes('act')) {
        realStatus = 'Active';
      }
    }

    const stagedRow = {
      _stagingId: `staged-${Date.now()}-${r}`,
      employeeId: realEmpId,
      fullName: realName,
      email: realEmail,
      phoneNumber: realPhone,
      departmentId: realDepartmentId,
      designation: realDesignation,
      dateOfJoining: realDate,
      salary: realSalary,
      status: realStatus,
      importStatus: 'PENDING',
      errorMessage: null,
    };

    // Run strict validation
    const validation = validateStagedRow(stagedRow, existingIdSet, existingEmailSet, stagedEmployees);
    stagedRow.isDuplicateId = validation.isDuplicateId;
    stagedRow.isDuplicateEmail = validation.isDuplicateEmail;
    stagedRow.errors = validation.errors;
    stagedRow.missingFields = validation.missingFields;
    stagedRow.isValid = validation.isValid;
    // CRITICAL: Unchecked by default if missing required details or invalid!
    stagedRow.selected = validation.isValid;

    stagedEmployees.push(stagedRow);
  }

  return stagedEmployees;
};

/**
 * Universal Parser that handles .csv, .xlsx, .xls, and .pdf files
 */
export const parseUploadedFile = async (file, departments = [], existingEmployees = []) => {
  if (!file) throw new Error('No file provided');

  const filename = file.name.toLowerCase();

  // 1. Excel (.xlsx, .xls) and CSV files via SheetJS
  if (filename.endsWith('.xlsx') || filename.endsWith('.xls') || filename.endsWith('.csv')) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    return parseRawRows(rawRows, departments, existingEmployees);
  }

  // 2. PDF Files (.pdf)
  if (filename.endsWith('.pdf')) {
    try {
      const buffer = await file.arrayBuffer();
      let textContent = '';

      try {
        const pdfjsLib = await import('pdfjs-dist/build/pdf.mjs');
        if (pdfjsLib.GlobalWorkerOptions) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = '';
        }
        const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
        const pdfDoc = await loadingTask.promise;
        const numPages = pdfDoc.numPages;

        for (let p = 1; p <= numPages; p++) {
          const page = await pdfDoc.getPage(p);
          const content = await page.getTextContent();
          const pageStrings = content.items.map((item) => item.str);
          textContent += pageStrings.join(' ') + '\n';
        }
      } catch (pdfErr) {
        // Fallback binary text decoding for PDFs
        const decoder = new TextDecoder('utf-8', { fatal: false });
        const rawString = decoder.decode(buffer);
        const matches = rawString.match(/\(([^()]{2,})\)/g) || [];
        textContent = matches.map((m) => m.slice(1, -1)).join(' ');
      }

      const lines = textContent
        .split(/[\r\n]+/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      const parsedRows = [];
      for (const line of lines) {
        let cols = [];
        if (line.includes(',')) {
          cols = line.split(',').map((c) => c.trim());
        } else if (line.includes('\t')) {
          cols = line.split('\t').map((c) => c.trim());
        } else if (line.includes('|')) {
          cols = line.split('|').map((c) => c.trim());
        } else {
          cols = line.split(/\s{2,}/).map((c) => c.trim());
        }
        if (cols.length >= 2) {
          parsedRows.push(cols);
        }
      }

      if (parsedRows.length > 0) {
        return parseRawRows(parsedRows, departments, existingEmployees);
      }
      throw new Error('No structured tabular records could be extracted from this PDF.');
    } catch (err) {
      throw new Error(`Failed to extract data from PDF: ${err.message}`);
    }
  }

  throw new Error('Unsupported file format. Please upload .csv, .xlsx, .xls, or .pdf');
};
