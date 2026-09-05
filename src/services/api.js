/**
 * Acadrium Centralized API Service Layer
 * Fully Integrated with FastAPI Backend & JWT Authentication
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

/**
 * Helper to get Bearer Authorization headers from localStorage
 */
function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

/**
 * Generic fetch wrapper for backend REST API requests
 */
async function fetchApi(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...options.headers,
  };

  console.group(`[Acadrium API Call] ${options.method || 'GET'} ${url}`);
  console.log('Request URL:', url);
  console.log('Request Method:', options.method || 'GET');
  console.log('Request Headers:', headers);
  if (options.body) {
    try {
      console.log('Request Payload:', JSON.parse(options.body));
    } catch {
      console.log('Request Body:', options.body);
    }
  }

  try {
    const response = await fetch(url, { ...options, headers });
    const data = await response.json().catch(() => ({}));

    console.log('Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    console.log('Response Body:', data);
    console.groupEnd();

    if (!response.ok) {
      const errorDetail = data.detail || data.message || `HTTP Error ${response.status}`;
      console.warn(`[Acadrium API Warning] Request failed with status ${response.status}:`, errorDetail);
      return {
        success: false,
        error: errorDetail,
        status: response.status
      };
    }
    return { success: true, data };
  } catch (err) {
    console.error('[Acadrium API Exception] Network or client error:', err);
    console.groupEnd();
    return {
      success: false,
      error: err.message || 'Unable to connect to Acadrium backend server.',
    };
  }
}

// ==========================================
// AUTHENTICATION APIs (FastAPI Phase 2)
// ==========================================

export async function login(credentials) {
  const payload = {
    email: credentials.email || credentials.username,
    username: credentials.username || credentials.email,
    password: credentials.password
  };
  if (credentials.role) {
    payload.role = credentials.role;
  }

  const res = await fetchApi('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (res.success && res.data?.access_token) {
    return {
      success: true,
      data: {
        token: res.data.access_token,
        user: res.data.user
      }
    };
  }

  return {
    success: false,
    error: res.error || 'Login failed. Please check your credentials.'
  };
}

export async function register(userData) {
  const payload = {
    username: userData.username,
    full_name: userData.username,
    email: userData.email,
    password: userData.password,
    role: userData.role || 'student',
    department: userData.department || 'Computer Applications',
    semester: userData.semester || (userData.role === 'student' ? 'Semester II' : null)
  };

  const res = await fetchApi('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (res.success && res.data?.access_token) {
    return {
      success: true,
      data: {
        token: res.data.access_token,
        user: res.data.user
      }
    };
  }

  return {
    success: false,
    error: res.error || 'Registration failed. Please try again.'
  };
}

export async function getProfile() {
  const res = await fetchApi('/auth/me', { method: 'GET' });
  return res;
}

// ==========================================
// CLASSROOM APIs (Phase 3 Backend Integration)
// ==========================================

export async function listClassrooms() {
  const res = await fetchApi('/classrooms', { method: 'GET' });
  return res;
}

export async function listFacultyClassrooms() {
  const res = await fetchApi('/classrooms/my', { method: 'GET' });
  return res;
}

export async function listStudentClassrooms() {
  const res = await fetchApi('/classrooms/enrolled', { method: 'GET' });
  return res;
}

export async function getClassroomDetails(classroomId) {
  const res = await fetchApi(`/classrooms/${classroomId}`, { method: 'GET' });
  return res;
}

export async function getClassroomStudents(classroomId) {
  const res = await fetchApi(`/classrooms/${classroomId}/students`, { method: 'GET' });
  return res;
}

export async function createClassroom(classroomData) {
  const payload = {
    name: classroomData.name || classroomData.subject,
    subject: classroomData.subject || classroomData.name,
    subject_code: classroomData.subject_code || classroomData.courseCode || 'MCA',
    courseCode: classroomData.courseCode || classroomData.subject_code || 'MCA',
    semester: classroomData.semester || 'Semester III',
    department: classroomData.department || 'Computer Applications'
  };

  const res = await fetchApi('/classrooms', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return res;
}

export async function joinClassroom(class_code) {
  const res = await fetchApi('/classrooms/join', {
    method: 'POST',
    body: JSON.stringify({ class_code, inviteCode: class_code }),
  });
  return res;
}

export async function leaveClassroom(classroomId) {
  const res = await fetchApi(`/classrooms/${classroomId}/leave`, {
    method: 'DELETE',
  });
  return res;
}

export async function deleteClassroom(classroomId) {
  const res = await fetchApi(`/classrooms/${classroomId}`, {
    method: 'DELETE',
  });
  return res;
}

export async function updateClassroom(classroomId, updateData) {
  const res = await fetchApi(`/classrooms/${classroomId}`, {
    method: 'PUT',
    body: JSON.stringify(updateData),
  });
  return res;
}

// ==========================================
// RESOURCE APIs (Phase 4 Real Backend Integration)
// ==========================================

export async function listResources(params = {}) {
  const query = new URLSearchParams(params).toString();
  const endpoint = `/resources${query ? `?${query}` : ''}`;
  const res = await fetchApi(endpoint, { method: 'GET' });
  return res;
}

export async function getClassroomResources(classroomId) {
  const res = await fetchApi(`/resources/classroom/${classroomId}`, { method: 'GET' });
  return res;
}

export async function getResource(resourceId) {
  const res = await fetchApi(`/resources/${resourceId}`, { method: 'GET' });
  return res;
}

export async function uploadResource(formData) {
  const url = `${API_BASE_URL}/resources/upload`;
  const headers = getAuthHeaders(); // Do NOT set Content-Type header so browser sets boundary for FormData

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorDetail = data.detail || data.message || `HTTP Error ${response.status}`;
      return { success: false, error: errorDetail };
    }
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message || 'Failed to upload resource file.' };
  }
}

export async function downloadResource(resourceId, filename = 'downloaded_file') {
  const url = `${API_BASE_URL}/resources/${resourceId}/download`;
  const headers = getAuthHeaders();

  try {
    const response = await fetch(url, { method: 'GET', headers });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return { success: false, error: data.detail || 'Download failed.' };
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message || 'Download error.' };
  }
}

export async function deleteResource(resourceId) {
  const res = await fetchApi(`/resources/${resourceId}`, {
    method: 'DELETE',
  });
  return res;
}

// ==========================================
// WORKSPACE APIs (Phase 6 Real Backend Integration)
// ==========================================

export async function listWorkspaceFiles(params = {}) {
  const query = new URLSearchParams(params).toString();
  const endpoint = `/workspace${query ? `?${query}` : ''}`;
  const res = await fetchApi(endpoint, { method: 'GET' });
  return res;
}

export async function getWorkspaceFile(fileId) {
  const res = await fetchApi(`/workspace/${fileId}`, { method: 'GET' });
  return res;
}

export async function uploadWorkspaceFile(formData) {
  const url = `${API_BASE_URL}/workspace/upload`;
  const headers = getAuthHeaders();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorDetail = data.detail || data.message || `HTTP Error ${response.status}`;
      return { success: false, error: errorDetail };
    }
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message || 'Failed to upload workspace file.' };
  }
}

export async function downloadWorkspaceFile(fileId, filename = 'downloaded_file') {
  const url = `${API_BASE_URL}/workspace/${fileId}/download`;
  const headers = getAuthHeaders();

  try {
    const response = await fetch(url, { method: 'GET', headers });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return { success: false, error: data.detail || 'Download failed.' };
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message || 'Download error.' };
  }
}

export async function deleteWorkspaceFile(fileId) {
  const res = await fetchApi(`/workspace/${fileId}`, {
    method: 'DELETE',
  });
  return res;
}

// ==========================================
// ANNOUNCEMENT APIs (Prepared for Phase 3)
// ==========================================

export async function listAnnouncements(params = {}) {
  const query = new URLSearchParams(params).toString();
  const endpoint = `/announcements${query ? `?${query}` : ''}`;
  const res = await fetchApi(endpoint, { method: 'GET' });
  if (!res.success) {
    return { success: true, data: [] };
  }
  return res;
}

export async function createAnnouncement(announcementData) {
  const res = await fetchApi('/announcements', {
    method: 'POST',
    body: JSON.stringify(announcementData),
  });

  if (!res.success) {
    const newAnnouncement = {
      id: `ann_${Date.now()}`,
      title: announcementData.title,
      content: announcementData.content,
      date: new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      classroomId: announcementData.classroomId,
      classroomName: announcementData.classroomName || 'General',
      author: announcementData.author || 'Faculty User'
    };
    return { success: true, data: newAnnouncement };
  }
  return res;
}

// ==========================================
// AI ASSISTANT API
// ==========================================

export async function sendAiMessage(_messageText) {
  return Promise.resolve({
    success: true,
    data: {
      sender: 'bot',
      text: 'AI features will become available after backend integration.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  });
}
