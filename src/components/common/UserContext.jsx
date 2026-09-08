import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import * as api from '../../services/api';

const UserContext = createContext();

export function UserProvider({ children }) {
  // Token state from localStorage
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  
  // Application role & active user state
  const [userRole, setUserRole] = useState('student');
  const [currentUser, setCurrentUser] = useState(null);

  // Core PostgreSQL-backed Data Arrays
  const [classrooms, setClassrooms] = useState([]);
  const [resources, setResources] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [aiChats, setAiChats] = useState([]);
  
  // Private Workspace State (PostgreSQL Backed)
  const [workspaceFiles, setWorkspaceFiles] = useState([]);
  const [workspaceNotes, setWorkspaceNotes] = useState([]);

  // Data Loading & Error States
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Global Toast state
  const [toast, setToast] = useState(null);

  // Live polling timers for extraction status
  const resourceTimersRef = useRef({});
  const workspaceTimersRef = useRef({});

  useEffect(() => {
    // Poll classroom resources with status PENDING or PROCESSING
    resources.forEach(res => {
      const status = (res.extraction_status || '').toUpperCase();
      const isPending = status === 'PENDING' || status === 'PROCESSING';

      if (isPending && !resourceTimersRef.current[res.id]) {
        const timer = setInterval(async () => {
          const statusRes = await api.getResourceExtractionStatus(res.id);
          if (statusRes.success && statusRes.data?.status) {
            const newStatus = statusRes.data.status.toUpperCase();
            if (newStatus === 'COMPLETED' || newStatus === 'FAILED') {
              if (resourceTimersRef.current[res.id]) {
                clearInterval(resourceTimersRef.current[res.id]);
                delete resourceTimersRef.current[res.id];
              }

              const fullRes = await api.getResource(res.id);
              if (fullRes.success && fullRes.data) {
                setResources(prev => prev.map(item => item.id === res.id ? fullRes.data : item));
              } else {
                setResources(prev => prev.map(item => item.id === res.id ? { ...item, extraction_status: newStatus } : item));
              }
            } else if (newStatus !== status) {
              setResources(prev => prev.map(item => item.id === res.id ? { ...item, extraction_status: newStatus } : item));
            }
          }
        }, 2500);

        resourceTimersRef.current[res.id] = timer;
      }
    });

    // Poll workspace files with status PENDING or PROCESSING
    workspaceFiles.forEach(doc => {
      const status = (doc.extraction_status || '').toUpperCase();
      const isPending = status === 'PENDING' || status === 'PROCESSING';

      if (isPending && !workspaceTimersRef.current[doc.id]) {
        const timer = setInterval(async () => {
          const statusRes = await api.getWorkspaceExtractionStatus(doc.id);
          if (statusRes.success && statusRes.data?.status) {
            const newStatus = statusRes.data.status.toUpperCase();
            if (newStatus === 'COMPLETED' || newStatus === 'FAILED') {
              if (workspaceTimersRef.current[doc.id]) {
                clearInterval(workspaceTimersRef.current[doc.id]);
                delete workspaceTimersRef.current[doc.id];
              }

              const fullDoc = await api.getWorkspaceFile(doc.id);
              if (fullDoc.success && fullDoc.data) {
                setWorkspaceFiles(prev => prev.map(item => item.id === doc.id ? fullDoc.data : item));
              } else {
                setWorkspaceFiles(prev => prev.map(item => item.id === doc.id ? { ...item, extraction_status: newStatus } : item));
              }
            } else if (newStatus !== status) {
              setWorkspaceFiles(prev => prev.map(item => item.id === doc.id ? { ...item, extraction_status: newStatus } : item));
            }
          }
        }, 2500);

        workspaceTimersRef.current[doc.id] = timer;
      }
    });
  }, [resources, workspaceFiles]);

  // Clean up all active extraction polling timers on unmount
  useEffect(() => {
    return () => {
      Object.values(resourceTimersRef.current).forEach(clearInterval);
      Object.values(workspaceTimersRef.current).forEach(clearInterval);
      resourceTimersRef.current = {};
      workspaceTimersRef.current = {};
    };
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  }, []);

  // Restore authenticated session via /api/auth/me on mount or token change
  useEffect(() => {
    let isMounted = true;
    async function restoreSession() {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        if (isMounted) {
          setCurrentUser(null);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setError(null);
      
      const profileRes = await api.getProfile();
      if (isMounted) {
        if (profileRes.success && profileRes.data) {
          const userObj = profileRes.data;
          setCurrentUser(userObj);
          setUserRole(userObj.role || 'student');
          
          // Restore global backend state for classrooms, resources, workspace files, workspace notes & announcements
          await Promise.all([
            api.listClassrooms().then(res => {
              if (isMounted && res.success && Array.isArray(res.data)) {
                setClassrooms(res.data);
              }
            }),
            api.listResources().then(res => {
              if (isMounted && res.success && Array.isArray(res.data)) {
                setResources(res.data);
              }
            }),
            api.listWorkspaceFiles().then(res => {
              if (isMounted && res.success && Array.isArray(res.data)) {
                setWorkspaceFiles(res.data);
              }
            }),
            api.listWorkspaceNotes().then(res => {
              if (isMounted && res.success && Array.isArray(res.data)) {
                setWorkspaceNotes(res.data);
              }
            }),
            api.listAnnouncements().then(res => {
              if (isMounted && res.success && Array.isArray(res.data)) {
                setAnnouncements(res.data);
              }
            })
          ]);
        } else {
          // Token expired or invalid -> logout session
          localStorage.removeItem('token');
          setToken(null);
          setCurrentUser(null);
        }
        setIsLoading(false);
      }
    }

    restoreSession();
    return () => { isMounted = false; };
  }, [token]);

  // Classroom API Actions
  const fetchClassrooms = useCallback(async () => {
    setError(null);
    const res = await api.listClassrooms();
    if (res.success && Array.isArray(res.data)) {
      setClassrooms(res.data);
      return res.data;
    } else {
      setClassrooms([]);
      if (res.error) {
        setError(res.error);
      }
      return [];
    }
  }, []);

  // Authentication Actions
  const login = useCallback(async (param1, param2, param3) => {
    let emailVal, pwdVal, roleVal;

    if (typeof param1 === 'object' && param1 !== null) {
      emailVal = param1.email || param1.username;
      pwdVal = param1.password;
      roleVal = param1.role;
    } else if (param3 !== undefined) {
      roleVal = param1;
      emailVal = param2;
      pwdVal = param3;
    } else {
      emailVal = param1;
      pwdVal = param2;
    }

    setIsLoading(true);
    setError(null);
    const loginPayload = { email: emailVal, password: pwdVal };
    if (roleVal) {
      loginPayload.role = roleVal;
    }

    const res = await api.login(loginPayload);
    setIsLoading(false);
    
    if (res.success && res.data?.token) {
      const newToken = res.data.token;
      const userObj = res.data.user;
      const detectedRole = userObj.role || roleVal || 'student';

      localStorage.setItem('token', newToken);
      setToken(newToken);
      setCurrentUser(userObj);
      setUserRole(detectedRole);
      
      // Fetch workspace files and notes for logged in user
      api.listWorkspaceFiles().then(wRes => {
        if (wRes.success && Array.isArray(wRes.data)) setWorkspaceFiles(wRes.data);
      });
      api.listWorkspaceNotes().then(nRes => {
        if (nRes.success && Array.isArray(nRes.data)) setWorkspaceNotes(nRes.data);
      });

      showToast(`Logged in successfully as ${userObj.full_name || userObj.name || (detectedRole === 'faculty' ? 'Faculty User' : 'Student User')}`, 'success');
      return { success: true, user: userObj };
    } else {
      const errorMsg = res.error || 'Login failed. Invalid credentials.';
      setError(errorMsg);
      showToast(errorMsg, 'error');
      return { success: false, error: errorMsg };
    }
  }, [showToast]);

  const register = useCallback(async (role, username, email, password) => {
    setIsLoading(true);
    setError(null);
    const res = await api.register({ role, username, email, password });
    setIsLoading(false);

    if (res.success && res.data?.token) {
      const newToken = res.data.token;
      const userObj = res.data.user;

      localStorage.setItem('token', newToken);
      setToken(newToken);
      setCurrentUser(userObj);
      setUserRole(userObj.role || role);
      
      api.listWorkspaceFiles().then(wRes => {
        if (wRes.success && Array.isArray(wRes.data)) setWorkspaceFiles(wRes.data);
      });
      api.listWorkspaceNotes().then(nRes => {
        if (nRes.success && Array.isArray(nRes.data)) setWorkspaceNotes(nRes.data);
      });

      showToast('Registration completed successfully!', 'success');
      return { success: true };
    } else {
      const errorMsg = res.error || 'Registration failed. Email may be taken.';
      setError(errorMsg);
      showToast(errorMsg, 'error');
      return { success: false, error: errorMsg };
    }
  }, [showToast]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setCurrentUser(null);
    setClassrooms([]);
    setResources([]);
    setWorkspaceFiles([]);
    setWorkspaceNotes([]);
    setAnnouncements([]);
    setAiChats([]);
    showToast('Logged out successfully', 'info');
  }, [showToast]);

  const updateProfile = useCallback(async (updateData) => {
    const res = await api.updateProfile(updateData);
    if (res.success && res.data) {
      setCurrentUser(res.data);
      showToast('Profile updated successfully!', 'success');
      return { success: true, user: res.data };
    }
    const errorMsg = res.error || 'Failed to update profile.';
    showToast(errorMsg, 'error');
    return { success: false, error: errorMsg };
  }, [showToast]);

  const updateProfileAvatar = useCallback((avatarUrl) => {
    setCurrentUser(prev => prev ? ({
      ...prev,
      avatar: avatarUrl
    }) : null);
    showToast('Profile picture updated!', 'success');
  }, [showToast]);

  const createClassroom = useCallback(async (subject, semester, description, subjectCode = '', department = 'Computer Applications') => {
    const payload = {
      name: subject,
      subject,
      subject_code: subjectCode,
      courseCode: subjectCode,
      semester: semester || 'Semester III',
      department: department || 'Computer Applications',
      description
    };

    const res = await api.createClassroom(payload);
    if (res.success && res.data) {
      showToast('Classroom created successfully!', 'success');
      await fetchClassrooms();
      return res.data;
    }
    showToast(res.error || 'Failed to create classroom', 'error');
    return null;
  }, [fetchClassrooms, showToast]);

  const joinClassroom = useCallback(async (inviteCode) => {
    if (!inviteCode || !inviteCode.trim()) {
      showToast('Please enter a valid classroom code.', 'error');
      return { success: false, message: 'Please enter a valid classroom code.' };
    }

    const res = await api.joinClassroom(inviteCode.trim());
    if (res.success && res.data) {
      const classroomObj = res.data.classroom || {};
      const subjectName = classroomObj.name || classroomObj.subject || 'Classroom';
      showToast(`Successfully joined ${subjectName}!`, 'success');
      await fetchClassrooms();
      return { success: true, subject: subjectName, classroom: classroomObj };
    }

    const errorMsg = res.error || 'Classroom not found. Check invite code.';
    showToast(errorMsg, 'error');
    return { success: false, message: errorMsg };
  }, [fetchClassrooms, showToast]);

  const leaveClassroom = useCallback(async (id) => {
    const res = await api.leaveClassroom(id);
    if (res.success) {
      showToast('Successfully left classroom', 'success');
      await fetchClassrooms();
      return { success: true };
    }
    showToast(res.error || 'Failed to leave classroom', 'error');
    return { success: false, error: res.error };
  }, [fetchClassrooms, showToast]);

  const deleteClassroom = useCallback(async (id) => {
    const res = await api.deleteClassroom(id);
    if (res.success) {
      showToast('Classroom deleted successfully', 'success');
      await fetchClassrooms();
      return { success: true };
    }
    showToast(res.error || 'Failed to delete classroom', 'error');
    return { success: false, error: res.error };
  }, [fetchClassrooms, showToast]);

  const loadResources = useCallback(async (params = {}) => {
    const res = await api.listResources(params);
    if (res.success && Array.isArray(res.data)) {
      setResources(res.data);
      return res.data;
    } else {
      setResources([]);
      return [];
    }
  }, []);

  const fetchClassroomResources = useCallback(async (classroomId) => {
    if (!classroomId) return [];
    const res = await api.getClassroomResources(classroomId);
    if (res.success && Array.isArray(res.data)) {
      setResources(prev => {
        const otherRes = prev.filter(r => String(r.classroom_id || r.classroomId) !== String(classroomId));
        return [...otherRes, ...res.data];
      });
      return res.data;
    }
    return [];
  }, []);

  const uploadResource = useCallback(async (formData) => {
    const res = await api.uploadResource(formData);
    if (res.success && res.data) {
      showToast('Resource uploaded successfully!', 'success');
      setResources(prev => {
        const exists = prev.some(r => r.id === res.data.id);
        if (exists) return prev.map(r => r.id === res.data.id ? res.data : r);
        return [res.data, ...prev];
      });
      await loadResources();
      return { success: true, data: res.data };
    }
    const errorMsg = res.error || 'Failed to upload resource';
    showToast(errorMsg, 'error');
    return { success: false, error: errorMsg };
  }, [loadResources, showToast]);

  const addResource = useCallback(async (formDataOrClassroomId, title, type, size, fileObj = null) => {
    if (formDataOrClassroomId instanceof FormData) {
      return await uploadResource(formDataOrClassroomId);
    }
    const formData = new FormData();
    formData.append('classroom_id', formDataOrClassroomId);
    formData.append('title', title);
    if (fileObj) {
      formData.append('file', fileObj);
    }
    return await uploadResource(formData);
  }, [uploadResource]);

  const deleteResource = useCallback(async (id) => {
    const res = await api.deleteResource(id);
    if (res.success) {
      setResources(prev => prev.filter(r => r.id !== id));
      await loadResources();
      showToast('Resource deleted successfully', 'success');
      return { success: true };
    }
    const errorMsg = res.error || 'Failed to delete resource';
    showToast(errorMsg, 'error');
    return { success: false, error: errorMsg };
  }, [loadResources, showToast]);

  // Workspace Files Actions (PostgreSQL Backed)
  const loadWorkspaceFiles = useCallback(async (params = {}) => {
    const res = await api.listWorkspaceFiles(params);
    if (res.success && Array.isArray(res.data)) {
      setWorkspaceFiles(res.data);
      return res.data;
    }
    return [];
  }, []);

  const uploadWorkspaceFile = useCallback(async (formData) => {
    const res = await api.uploadWorkspaceFile(formData);
    if (res.success && res.data) {
      showToast('Workspace file uploaded successfully!', 'success');
      setWorkspaceFiles(prev => {
        const exists = prev.some(f => f.id === res.data.id);
        if (exists) return prev.map(f => f.id === res.data.id ? res.data : f);
        return [res.data, ...prev];
      });
      await loadWorkspaceFiles();
      return { success: true, data: res.data };
    }
    const errorMsg = res.error || 'Failed to upload workspace file';
    showToast(errorMsg, 'error');
    return { success: false, error: errorMsg };
  }, [loadWorkspaceFiles, showToast]);

  const deleteWorkspaceFile = useCallback(async (id) => {
    const res = await api.deleteWorkspaceFile(id);
    if (res.success) {
      setWorkspaceFiles(prev => prev.filter(f => f.id !== id));
      await loadWorkspaceFiles();
      showToast('Workspace file deleted successfully', 'success');
      return { success: true };
    }
    const errorMsg = res.error || 'Failed to delete workspace file';
    showToast(errorMsg, 'error');
    return { success: false, error: errorMsg };
  }, [loadWorkspaceFiles, showToast]);

  // Workspace Notes Actions (PostgreSQL Backed)
  const loadWorkspaceNotes = useCallback(async (params = {}) => {
    const res = await api.listWorkspaceNotes(params);
    if (res.success && Array.isArray(res.data)) {
      setWorkspaceNotes(res.data);
      return res.data;
    }
    return [];
  }, []);

  const createWorkspaceNote = useCallback(async (title, content) => {
    const res = await api.createWorkspaceNote({ title, content });
    if (res.success && res.data) {
      showToast('Personal note created successfully!', 'success');
      await loadWorkspaceNotes();
      return { success: true, data: res.data };
    }
    const errorMsg = res.error || 'Failed to create note';
    showToast(errorMsg, 'error');
    return { success: false, error: errorMsg };
  }, [loadWorkspaceNotes, showToast]);

  const updateWorkspaceNote = useCallback(async (id, title, content) => {
    const res = await api.updateWorkspaceNote(id, { title, content });
    if (res.success && res.data) {
      showToast('Note changes saved!', 'success');
      await loadWorkspaceNotes();
      return { success: true, data: res.data };
    }
    const errorMsg = res.error || 'Failed to update note';
    showToast(errorMsg, 'error');
    return { success: false, error: errorMsg };
  }, [loadWorkspaceNotes, showToast]);

  const deleteWorkspaceNote = useCallback(async (id) => {
    const res = await api.deleteWorkspaceNote(id);
    if (res.success) {
      setWorkspaceNotes(prev => prev.filter(n => n.id !== id));
      showToast('Note deleted successfully', 'success');
      return { success: true };
    }
    const errorMsg = res.error || 'Failed to delete note';
    showToast(errorMsg, 'error');
    return { success: false, error: errorMsg };
  }, [showToast]);

  // Announcement API Actions
  const loadAnnouncements = useCallback(async (params = {}) => {
    const res = await api.listAnnouncements(params);
    if (res.success && Array.isArray(res.data)) {
      setAnnouncements(res.data);
      return res.data;
    } else {
      setAnnouncements([]);
      return [];
    }
  }, []);

  const fetchClassroomAnnouncements = useCallback(async (classroomId) => {
    if (!classroomId) return [];
    const res = await api.getClassroomAnnouncements(classroomId);
    if (res.success && Array.isArray(res.data)) {
      setAnnouncements(prev => {
        const otherAnn = prev.filter(a => String(a.classroom_id || a.classroomId) !== String(classroomId));
        return [...otherAnn, ...res.data];
      });
      return res.data;
    }
    return [];
  }, []);

  const createAnnouncement = useCallback(async (classroomId, title, content) => {
    const payload = { classroomId, title, content };
    const res = await api.createAnnouncement(payload);
    if (res.success && res.data) {
      showToast('Announcement published successfully!', 'success');
      await loadAnnouncements();
      return { success: true, data: res.data };
    }
    const errorMsg = res.error || 'Failed to publish announcement';
    showToast(errorMsg, 'error');
    return { success: false, error: errorMsg };
  }, [loadAnnouncements, showToast]);

  const addAnnouncement = createAnnouncement;

  const updateAnnouncement = useCallback(async (announcementId, title, content) => {
    const res = await api.updateAnnouncement(announcementId, { title, content });
    if (res.success && res.data) {
      showToast('Announcement updated successfully!', 'success');
      await loadAnnouncements();
      return { success: true, data: res.data };
    }
    const errorMsg = res.error || 'Failed to update announcement';
    showToast(errorMsg, 'error');
    return { success: false, error: errorMsg };
  }, [loadAnnouncements, showToast]);

  const deleteAnnouncement = useCallback(async (announcementId) => {
    const res = await api.deleteAnnouncement(announcementId);
    if (res.success) {
      setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
      showToast('Announcement deleted successfully', 'success');
      return { success: true };
    }
    const errorMsg = res.error || 'Failed to delete announcement';
    showToast(errorMsg, 'error');
    return { success: false, error: errorMsg };
  }, [showToast]);

  const sendAiMessage = useCallback(async (text) => {
    const userMsg = {
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setAiChats(prev => [...prev, userMsg]);

    const res = await api.sendAiMessage(text);
    if (res.success && res.data) {
      setAiChats(prev => [...prev, res.data]);
    }
  }, []);

  const contextValue = useMemo(() => ({
    token,
    userRole,
    currentUser,
    setCurrentUser,
    classrooms,
    resources,
    workspaceFiles,
    workspaceNotes,
    announcements,
    aiChats,
    isLoading,
    error,
    toast,
    showToast,
    fetchClassrooms,
    login,
    register,
    logout,
    updateProfile,
    updateProfileAvatar,
    createClassroom,
    joinClassroom,
    leaveClassroom,
    deleteClassroom,
    loadResources,
    uploadResource,
    addResource,
    deleteResource,
    fetchClassroomResources,
    loadWorkspaceFiles,
    uploadWorkspaceFile,
    deleteWorkspaceFile,
    loadWorkspaceNotes,
    createWorkspaceNote,
    updateWorkspaceNote,
    deleteWorkspaceNote,
    loadAnnouncements,
    fetchClassroomAnnouncements,
    createAnnouncement,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    sendAiMessage
  }), [
    token,
    userRole,
    currentUser,
    classrooms,
    resources,
    workspaceFiles,
    workspaceNotes,
    announcements,
    aiChats,
    isLoading,
    error,
    toast,
    showToast,
    fetchClassrooms,
    login,
    register,
    logout,
    updateProfile,
    updateProfileAvatar,
    createClassroom,
    joinClassroom,
    leaveClassroom,
    deleteClassroom,
    loadResources,
    uploadResource,
    addResource,
    deleteResource,
    fetchClassroomResources,
    loadWorkspaceFiles,
    uploadWorkspaceFile,
    deleteWorkspaceFile,
    loadWorkspaceNotes,
    createWorkspaceNote,
    updateWorkspaceNote,
    deleteWorkspaceNote,
    loadAnnouncements,
    fetchClassroomAnnouncements,
    createAnnouncement,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    sendAiMessage
  ]);

  return (
    <UserContext.Provider value={contextValue}>
      {/* GLOBAL TOAST ALERTS FOR ALL PAGES */}
      {toast && (
        <div className="fixed top-5 right-5 z-100 flex items-center gap-3 rounded-2xl bg-white border border-slate-200 px-4 py-3 shadow-2xl transition-all animate-in fade-in slide-in-from-top-5 duration-300">
          {toast.type === 'error' ? (
            <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
          ) : toast.type === 'info' ? (
            <Info className="h-5 w-5 text-indigo-500 shrink-0" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
          )}
          <span className="text-xs font-bold text-slate-800">{toast.message}</span>
        </div>
      )}
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
