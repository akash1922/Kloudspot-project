/**
 * Client-Side Persistent Offline & Speed Cache Service using IndexedDB.
 * 
 * Provides:
 * 1. Instant 0ms initial paint from local persistent storage (IndexedDB).
 * 2. Background Stale-While-Revalidate without UI flicker or screen wipes.
 * 3. Graceful offline fallback if Supabase / Spring Boot backend drops or is slow.
 */

const DB_NAME = 'kohort_ems_cache';
const DB_VERSION = 1;
const STORE_QUERIES = 'queries';
const STORE_EMPLOYEES = 'employees';
const STORE_META = 'metadata';

let dbPromise = null;

// In-memory fallback if IndexedDB is disabled or restricted
const memoryFallback = new Map();

function openDatabase() {
  if (dbPromise) return dbPromise;

  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }

  dbPromise = new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_QUERIES)) {
          db.createObjectStore(STORE_QUERIES, { keyPath: 'cacheKey' });
        }
        if (!db.objectStoreNames.contains(STORE_EMPLOYEES)) {
          db.createObjectStore(STORE_EMPLOYEES, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_META)) {
          db.createObjectStore(STORE_META, { keyPath: 'key' });
        }
      };

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onerror = (err) => {
        console.warn('[CacheService] IndexedDB open error:', err);
        resolve(null);
      };
    } catch (e) {
      console.warn('[CacheService] IndexedDB not available, using memory fallback:', e);
      resolve(null);
    }
  });

  return dbPromise;
}

/**
 * Save query result page (content, totalElements, etc.) for instant retrieval
 */
export async function setQueryCache(cacheKey, data) {
  if (!cacheKey || !data) return;

  const record = {
    cacheKey,
    content: data.content || [],
    totalElements: data.totalElements ?? (data.content ? data.content.length : 0),
    totalPages: data.totalPages ?? 1,
    first: data.first ?? true,
    last: data.last ?? true,
    timestamp: Date.now(),
  };

  memoryFallback.set(cacheKey, record);

  try {
    const db = await openDatabase();
    if (!db) return;
    const tx = db.transaction(STORE_QUERIES, 'readwrite');
    const store = tx.objectStore(STORE_QUERIES);
    store.put(record);
  } catch (err) {
    // Non-blocking
  }
}

/**
 * Retrieve cached query result page for 0ms render
 */
export async function getQueryCache(cacheKey) {
  if (!cacheKey) return null;

  if (memoryFallback.has(cacheKey)) {
    return memoryFallback.get(cacheKey);
  }

  try {
    const db = await openDatabase();
    if (!db) return null;

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_QUERIES, 'readonly');
      const store = tx.objectStore(STORE_QUERIES);
      const req = store.get(cacheKey);

      req.onsuccess = () => {
        if (req.result) {
          memoryFallback.set(cacheKey, req.result);
          resolve(req.result);
        } else {
          resolve(null);
        }
      };

      req.onerror = () => resolve(null);
    });
  } catch (err) {
    return null;
  }
}

/**
 * Invalidate or update a specific employee across all cached query sets
 */
export async function updateCachedEmployee(updatedEmp) {
  if (!updatedEmp || !updatedEmp.id) return;

  // 1. Update in-memory fallback
  for (const [key, value] of memoryFallback.entries()) {
    if (value && Array.isArray(value.content)) {
      const idx = value.content.findIndex((e) => e.id === updatedEmp.id);
      if (idx !== -1) {
        value.content[idx] = { ...value.content[idx], ...updatedEmp };
      }
    }
  }

  // 2. Update IndexedDB records
  try {
    const db = await openDatabase();
    if (!db) return;

    // Update single employee store
    const txEmp = db.transaction(STORE_EMPLOYEES, 'readwrite');
    txEmp.objectStore(STORE_EMPLOYEES).put(updatedEmp);

    // Update inside cached queries
    const txQ = db.transaction(STORE_QUERIES, 'readwrite');
    const qStore = txQ.objectStore(STORE_QUERIES);
    const cursorReq = qStore.openCursor();

    cursorReq.onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        const item = cursor.value;
        if (item && Array.isArray(item.content)) {
          const idx = item.content.findIndex((emp) => emp.id === updatedEmp.id);
          if (idx !== -1) {
            item.content[idx] = { ...item.content[idx], ...updatedEmp };
            cursor.update(item);
          }
        }
        cursor.continue();
      }
    };
  } catch (err) {
    // Non-blocking
  }
}

/**
 * Remove an employee from cache upon deletion/archive
 */
export async function removeCachedEmployee(empId) {
  if (!empId) return;

  for (const [key, value] of memoryFallback.entries()) {
    if (value && Array.isArray(value.content)) {
      value.content = value.content.filter((e) => e.id !== empId);
      value.totalElements = Math.max(0, (value.totalElements || 1) - 1);
    }
  }

  try {
    const db = await openDatabase();
    if (!db) return;

    const txEmp = db.transaction(STORE_EMPLOYEES, 'readwrite');
    txEmp.objectStore(STORE_EMPLOYEES).delete(empId);

    const txQ = db.transaction(STORE_QUERIES, 'readwrite');
    const qStore = txQ.objectStore(STORE_QUERIES);
    const cursorReq = qStore.openCursor();

    cursorReq.onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        const item = cursor.value;
        if (item && Array.isArray(item.content)) {
          item.content = item.content.filter((emp) => emp.id !== empId);
          item.totalElements = Math.max(0, (item.totalElements || 1) - 1);
          cursor.update(item);
        }
        cursor.continue();
      }
    };
  } catch (err) {
    // Non-blocking
  }
}

/**
 * Clear all cached queries on major events (e.g., bulk import)
 */
export async function clearQueryCache() {
  memoryFallback.clear();
  try {
    const db = await openDatabase();
    if (!db) return;
    const tx = db.transaction(STORE_QUERIES, 'readwrite');
    tx.objectStore(STORE_QUERIES).clear();
  } catch (err) {
    // Non-blocking
  }
}
