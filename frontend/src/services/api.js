// Centralized API service — all backend calls go through here.
// Base URL is injected via Vite env variable at build time.

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

/**
 * Analyze a file (image / audio / video / text file).
 * @param {File} file - The file object from an <input type="file">
 * @param {string} userEmail - Logged-in user's email
 * @param {function} onProgress - Optional progress callback (0–100)
 * @returns {Promise<object>} - Detection result
 */
export async function analyzeFile(file, userEmail, onProgress) {
  const formData = new FormData();
  formData.append('file', file);
  if (userEmail) formData.append('userEmail', userEmail);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data);
        } else {
          reject(new Error(data.message || 'Detection failed'));
        }
      } catch {
        reject(new Error('Invalid server response'));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error — is the backend running?')));
    xhr.addEventListener('timeout', () => reject(new Error('Request timed out')));

    xhr.timeout = 150000; // 2.5 min for large video files
    xhr.open('POST', `${BASE_URL}/api/detect/upload`);
    xhr.send(formData);
  });
}

/**
 * Analyze plain text for AI-generated content.
 * @param {string} text
 * @param {string} userEmail
 * @returns {Promise<object>}
 */
export async function analyzeText(text, userEmail) {
  const res = await fetch(`${BASE_URL}/api/detect/text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, userEmail }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Text analysis failed');
  return data;
}

/**
 * Fetch scan history for a user.
 * @param {string} email
 * @param {number} page
 * @param {number} limit
 * @returns {Promise<{scans: Array, pagination: object}>}
 */
export async function fetchHistory(email, page = 1, limit = 10) {
  const res = await fetch(
    `${BASE_URL}/api/detect/history?email=${encodeURIComponent(email)}&page=${page}&limit=${limit}`
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to load history');
  return data;
}

/**
 * Google login via backend.
 * @param {string} token - Google access token
 * @returns {Promise<object>}
 */
export async function googleLogin(token) {
  const res = await fetch(`${BASE_URL}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Login failed');
  return data;
}

/**
 * Save / update user profile.
 * @param {object} profileData
 * @returns {Promise<object>}
 */
export async function saveProfile(profileData) {
  const res = await fetch(`${BASE_URL}/api/auth/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profileData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Profile save failed');
  return data;
}
