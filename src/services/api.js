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
    username: userData.full_name || userData.username,
    full_name: userData.full_name || userData.username,
    email: userData.email,
    password: userData.password,
    role: userData.role || 'student',
    ...(userData.department ? { department: userData.department } : {}),
    ...(userData.semester ? { semester: userData.semester } : {})
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

export async function updateProfile(updateData) {
  const res = await fetchApi('/auth/me', {
    method: 'PUT',
    body: JSON.stringify(updateData),
  });
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

export async function getResourceExtractionStatus(resourceId) {
  const res = await fetchApi(`/resources/${resourceId}/extraction-status`, { method: 'GET' });
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

export async function previewResourceBlob(resourceId) {
  const url = `${API_BASE_URL}/resources/${resourceId}/preview`;
  const headers = getAuthHeaders();
  try {
    const response = await fetch(url, { method: 'GET', headers });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return { success: false, error: data.detail || 'Preview failed.' };
    }
    const blob = await response.blob();
    return { success: true, blob, contentType: response.headers.get('content-type') };
  } catch (err) {
    return { success: false, error: err.message || 'Preview fetch error.' };
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

export async function getWorkspaceExtractionStatus(fileId) {
  const res = await fetchApi(`/workspace/${fileId}/extraction-status`, { method: 'GET' });
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

export async function previewWorkspaceBlob(fileId) {
  const url = `${API_BASE_URL}/workspace/${fileId}/preview`;
  const headers = getAuthHeaders();
  try {
    const response = await fetch(url, { method: 'GET', headers });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return { success: false, error: data.detail || 'Preview failed.' };
    }
    const blob = await response.blob();
    return { success: true, blob, contentType: response.headers.get('content-type') };
  } catch (err) {
    return { success: false, error: err.message || 'Preview fetch error.' };
  }
}

export async function deleteWorkspaceFile(fileId) {
  const res = await fetchApi(`/workspace/${fileId}`, {
    method: 'DELETE',
  });
  return res;
}

// ==========================================
// WORKSPACE NOTES APIs (PostgreSQL Backed)
// ==========================================

export async function listWorkspaceNotes(params = {}) {
  const query = new URLSearchParams(params).toString();
  const endpoint = `/workspace/notes${query ? `?${query}` : ''}`;
  const res = await fetchApi(endpoint, { method: 'GET' });
  return res;
}

export async function getWorkspaceNote(noteId) {
  const res = await fetchApi(`/workspace/notes/${noteId}`, { method: 'GET' });
  return res;
}

export async function createWorkspaceNote(noteData) {
  const payload = {
    title: noteData.title,
    content: noteData.content || ''
  };

  const res = await fetchApi('/workspace/notes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res;
}

export async function updateWorkspaceNote(noteId, noteData) {
  const payload = {
    title: noteData.title,
    content: noteData.content
  };

  const res = await fetchApi(`/workspace/notes/${noteId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return res;
}

export async function deleteWorkspaceNote(noteId) {
  const res = await fetchApi(`/workspace/notes/${noteId}`, {
    method: 'DELETE',
  });
  return res;
}

// ==========================================
// ANNOUNCEMENT APIs (Phase 5 Real Backend Integration)
// ==========================================

export async function listAnnouncements(params = {}) {
  const query = new URLSearchParams(params).toString();
  const endpoint = `/announcements${query ? `?${query}` : ''}`;
  const res = await fetchApi(endpoint, { method: 'GET' });
  return res;
}

export async function getClassroomAnnouncements(classroomId) {
  const res = await fetchApi(`/announcements/classroom/${classroomId}`, { method: 'GET' });
  return res;
}

export async function createAnnouncement(announcementData) {
  const payload = {
    title: announcementData.title,
    content: announcementData.content,
    classroom_id: announcementData.classroom_id || announcementData.classroomId,
  };

  const acadDate = announcementData.academic_date || announcementData.academicDate;
  if (acadDate && typeof acadDate === 'string' && acadDate.trim() !== '') {
    payload.academic_date = acadDate.trim();
  }

  const res = await fetchApi('/announcements', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return res;
}

export async function updateAnnouncement(announcementId, updateData) {
  const payload = {
    title: updateData.title,
    content: updateData.content,
  };

  const acadDate = updateData.academic_date !== undefined ? updateData.academic_date : updateData.academicDate;
  if (acadDate !== undefined) {
    if (acadDate && typeof acadDate === 'string' && acadDate.trim() !== '') {
      payload.academic_date = acadDate.trim();
    } else if (acadDate === null || acadDate === '') {
      payload.academic_date = null;
    }
  }

  const res = await fetchApi(`/announcements/${announcementId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  return res;
}

export async function deleteAnnouncement(announcementId) {
  const res = await fetchApi(`/announcements/${announcementId}`, {
    method: 'DELETE',
  });

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
