/**
 * Robust CSV parser that handles quotes, varied header names, and data normalization
 */
export const parseCsvText = (text, departments = []) => {
  if (!text || !text.trim()) return [];

  // Parse lines considering quoted multi-line values
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentField.trim());
      if (currentRow.some((f) => f.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) {
      rows.push(currentRow);
    }
  }

  if (rows.length < 2) return [];

  // Normalize header names
  const rawHeaders = rows[0].map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const headerMap = {};

  rawHeaders.forEach((h, idx) => {
    if (h.includes('empid') || h === 'id' || h.includes('employeeid')) {
      headerMap.employeeId = idx;
    } else if (h.includes('name') || h === 'fullname') {
      headerMap.fullName = idx;
    } else if (h.includes('email') || h.includes('mail')) {
      headerMap.email = idx;
    } else if (h.includes('phone') || h.includes('mobile') || h.includes('contact')) {
      headerMap.phoneNumber = idx;
    } else if (h.includes('dept') || h.includes('department')) {
      headerMap.department = idx;
    } else if (h.includes('desig') || h.includes('role') || h.includes('title') || h.includes('position')) {
      headerMap.designation = idx;
    } else if (h.includes('join') || h.includes('date') || h === 'doj') {
      headerMap.dateOfJoining = idx;
    } else if (h.includes('salary') || h.includes('comp') || h.includes('ctc') || h.includes('pay')) {
      headerMap.salary = idx;
    } else if (h.includes('status')) {
      headerMap.status = idx;
    }
  });

  const parsedEmployees = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (row.length === 0 || row.every((c) => !c)) continue;

    const getVal = (key) => {
      const idx = headerMap[key];
      return idx !== undefined && idx < row.length ? row[idx] : '';
    };

    const rawEmpId = getVal('employeeId') || '';
    const rawName = getVal('fullName') || '';
    const rawEmail = getVal('email') ? getVal('email').toLowerCase() : '';
    let rawPhone = getVal('phoneNumber') || '';
    const rawDept = getVal('department') || '';
    const rawDesignation = getVal('designation') || '';
    let rawDate = getVal('dateOfJoining') || '';
    let rawSalary = getVal('salary') || '';
    let rawStatus = getVal('status') || '';

    // Phone normalization: only if digits are present
    let cleanPhone = '';
    if (rawPhone) {
      const digits = rawPhone.replace(/\D/g, '');
      cleanPhone = digits.length >= 10 ? `+91 ${digits.slice(-10)}` : rawPhone;
    }

    // Department resolution: ID or Name lookup
    let departmentId = '';
    if (rawDept) {
      if (!isNaN(Number(rawDept))) {
        departmentId = Number(rawDept);
      } else {
        const found = departments.find(
          (d) => d.name.toLowerCase().trim() === rawDept.toLowerCase().trim()
        );
        if (found) departmentId = found.id;
      }
    }

    // Date normalization
    if (rawDate) {
      const slashParts = rawDate.split(/[-/]/);
      if (slashParts.length === 3 && slashParts[2].length === 4) {
        rawDate = `${slashParts[2]}-${slashParts[1].padStart(2, '0')}-${slashParts[0].padStart(2, '0')}`;
      }
    }

    // Salary normalization: strip symbols
    let salaryNum = '';
    if (rawSalary) {
      const cleanNum = Number(String(rawSalary).replace(/[^0-9.]/g, ''));
      if (!isNaN(cleanNum) && cleanNum > 0) salaryNum = cleanNum;
    }

    // Status normalization
    let cleanStatus = '';
    if (rawStatus) {
      cleanStatus = rawStatus.toLowerCase().includes('inact') ? 'Inactive' : 'Active';
    }

    parsedEmployees.push({
      employeeId: rawEmpId,
      fullName: rawName,
      email: rawEmail,
      phoneNumber: cleanPhone,
      departmentId: departmentId,
      designation: rawDesignation,
      dateOfJoining: rawDate,
      salary: salaryNum,
      status: cleanStatus,
    });
  }

  return parsedEmployees;
};
