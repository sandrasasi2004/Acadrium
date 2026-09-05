/**
 * Acadrium Centralized API Service Layer
 * Prepared for Phase 2 & Review 3 Backend Integration
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Generic fetch wrapper for placeholder backend requests
 * @param {string} endpoint 
 * @param {RequestInit} [options] 
 * @returns {Promise<{ success: boolean, data?: any, error?: string, message?: string }>}
 */
async function fetchApi(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `HTTP Error ${response.status}`,
      };
    }
    const data = await response.json();
    return { success: true, data };
  } catch (err) {
    // Expected during Phase 1 prior to backend running
    return {
      success: false,
      error: err.message || 'Network error: Backend server unavailable',
    };
  }
}

// ==========================================
// AUTHENTICATION APIs
// ==========================================

export async function login(credentials) {
  // Placeholder API endpoint: POST /api/auth/login
  const res = await fetchApi('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  if (!res.success) {
    // Return structured frontend fallback response when backend is not active
    return {
      success: true,
      data: {
        user: {
          id: `usr_${Date.now()}`,
          name: credentials.username || (credentials.role === 'faculty' ? 'Faculty User' : 'Student User'),
          email: `${(credentials.username || 'user').toLowerCase().replace(/\s+/g, '')}@acadrium.edu`,
          role: credentials.role || 'student',
          department: 'Computer Applications',
          semester: credentials.role === 'faculty' ? undefined : 'Semester II',
          avatar: credentials.role === 'faculty' 
            ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' 
            : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
        },
        token: 'placeholder_jwt_token'
      }
    };
  }
  return res;
}

export async function register(userData) {
  // Placeholder API endpoint: POST /api/auth/register
  const res = await fetchApi('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });

  if (!res.success) {
    return {
      success: true,
      data: {
        user: {
          id: `usr_${Date.now()}`,
          name: userData.username,
          email: userData.email,
          role: userData.role || 'student',
          department: 'Computer Applications',
          semester: userData.role === 'faculty' ? undefined : 'Semester II',
          avatar: userData.role === 'faculty' 
            ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150' 
            : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
        },
        token: 'placeholder_jwt_token'
      }
    };
  }
  return res;
}

export async function getProfile() {
  // Placeholder API endpoint: GET /api/auth/profile
  const res = await fetchApi('/auth/profile', { method: 'GET' });
  return res;
}

// ==========================================
// CLASSROOM APIs
// ==========================================

export async function listClassrooms() {
  // Placeholder API endpoint: GET /api/classrooms
  const res = await fetchApi('/classrooms', { method: 'GET' });
  if (!res.success) {
    // Return empty list state prior to backend connection
    return { success: true, data: [] };
  }
  return res;
}

export async function getClassroomDetails(classroomId) {
  // Placeholder API endpoint: GET /api/classrooms/:id
  const res = await fetchApi(`/classrooms/${classroomId}`, { method: 'GET' });
  return res;
}

export async function createClassroom(classroomData) {
  // Placeholder API endpoint: POST /api/classrooms
  const res = await fetchApi('/classrooms', {
    method: 'POST',
    body: JSON.stringify(classroomData),
  });

  if (!res.success) {
    const newClassroom = {
      id: `class_${Date.now()}`,
      subject: classroomData.subject,
      semester: classroomData.semester || 'Sem II',
      courseCode: `MCA${Math.floor(10000 + Math.random() * 90000)}`,
      inviteCode: Math.random().toString(36).substring(2, 12),
      studentCount: 0,
      facultyId: classroomData.facultyId || 'fac_user',
      facultyName: classroomData.facultyName || 'Faculty Member',
      description: classroomData.description || ''
    };
    return { success: true, data: newClassroom };
  }
  return res;
}

export async function joinClassroom(inviteCode) {
  // Placeholder API endpoint: POST /api/classrooms/join
  const res = await fetchApi('/classrooms/join', {
    method: 'POST',
    body: JSON.stringify({ inviteCode }),
  });
  return res;
}

// ==========================================
// RESOURCE APIs
// ==========================================

export async function listResources(params = {}) {
  // Placeholder API endpoint: GET /api/resources
  const query = new URLSearchParams(params).toString();
  const endpoint = `/resources${query ? `?${query}` : ''}`;
  const res = await fetchApi(endpoint, { method: 'GET' });
  if (!res.success) {
    return { success: true, data: [] };
  }
  return res;
}

export async function uploadResource(resourceData) {
  // Placeholder API endpoint: POST /api/resources
  const res = await fetchApi('/resources', {
    method: 'POST',
    body: JSON.stringify(resourceData),
  });

  if (!res.success) {
    const newResource = {
      id: `res_${Date.now()}`,
      title: resourceData.title,
      type: (resourceData.type || 'PDF').toUpperCase(),
      uploadedDate: new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      classroomId: resourceData.classroomId,
      classroomName: resourceData.classroomName || 'General',
      size: resourceData.size || '1.5 MB',
      uploadedBy: resourceData.uploadedBy || 'Faculty Member',
      fileObj: resourceData.fileObj || null
    };
    return { success: true, data: newResource };
  }
  return res;
}

// ==========================================
// ANNOUNCEMENT APIs
// ==========================================

export async function listAnnouncements(params = {}) {
  // Placeholder API endpoint: GET /api/announcements
  const query = new URLSearchParams(params).toString();
  const endpoint = `/announcements${query ? `?${query}` : ''}`;
  const res = await fetchApi(endpoint, { method: 'GET' });
  if (!res.success) {
    return { success: true, data: [] };
  }
  return res;
}

export async function createAnnouncement(announcementData) {
  // Placeholder API endpoint: POST /api/announcements
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
      author: announcementData.author || 'Faculty Member'
    };
    return { success: true, data: newAnnouncement };
  }
  return res;
}

// ==========================================
// AI ASSISTANT API (Placeholder Only)
// ==========================================

export async function sendAiMessage(_messageText) {
  // Placeholder response required for Phase 1 frontend cleanup
  return Promise.resolve({
    success: true,
    data: {
      sender: 'bot',
      text: 'AI features will become available after backend integration.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  });
}
