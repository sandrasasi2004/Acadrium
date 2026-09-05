import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import * as api from '../../services/api';

const UserContext = createContext();

export function UserProvider({ children }) {
  // Token state from localStorage
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  
  // Application role & active user state
  const [userRole, setUserRole] = useState('student');
  const [currentUser, setCurrentUser] = useState(null);

  // Empty data arrays ready for backend integration
  const [classrooms, setClassrooms] = useState([]);
  const [resources, setResources] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [aiChats, setAiChats] = useState([]);
  
  // Private Workspace arrays & real backend files
  const [workspaceFiles, setWorkspaceFiles] = useState([]);
  const [studentNotes, setStudentNotes] = useState([]);
  const [facultyNotes, setFacultyNotes] = useState([]);
  const [studentUploads, setStudentUploads] = useState([]);
  const [facultyUploads, setFacultyUploads] = useState([]);

  // Data Loading & Error States
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Global Toast state
  const [toast, setToast] = useState(null);

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
          
          // Restore global backend state for classrooms, resources & workspace files
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

  // Computed Workspace States based on active role
  const myNotes = userRole === 'faculty' ? facultyNotes : studentNotes;
  const myUploads = workspaceFiles;

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

  // Real Authentication Actions
  const login = useCallback(async (param1, param2, param3) => {
    let emailVal, pwdVal, roleVal;

    if (typeof param1 === 'object' && param1 !== null) {
      emailVal = param1.email || param1.username;
      pwdVal = param1.password;
      roleVal = param1.role;
    } else if (param3 !== undefined) {
      // Legacy signature: (role, email, password)
      roleVal = param1;
      emailVal = param2;
      pwdVal = param3;
    } else {
      // Refined signature: (email, password)
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
      api.listWorkspaceFiles().then(wRes => {
        if (wRes.success && Array.isArray(wRes.data)) setWorkspaceFiles(wRes.data);
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
    setAnnouncements([]);
    setAiChats([]);
    showToast('Logged out successfully', 'info');
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
      showToast('Resource deleted successfully', 'success');
      return { success: true };
    }
    const errorMsg = res.error || 'Failed to delete resource';
    showToast(errorMsg, 'error');
    return { success: false, error: errorMsg };
  }, [showToast]);

  // Workspace API Actions (Phase 6 Real Backend Integration)
  const loadWorkspaceFiles = useCallback(async (params = {}) => {
    const res = await api.listWorkspaceFiles(params);
    if (res.success && Array.isArray(res.data)) {
      setWorkspaceFiles(res.data);
      return res.data;
    } else {
      setWorkspaceFiles([]);
      return [];
    }
  }, []);

  const uploadWorkspaceFile = useCallback(async (formData) => {
    const res = await api.uploadWorkspaceFile(formData);
    if (res.success && res.data) {
      showToast('Workspace file uploaded successfully!', 'success');
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
      showToast('Workspace file deleted successfully', 'success');
      return { success: true };
    }
    const errorMsg = res.error || 'Failed to delete workspace file';
    showToast(errorMsg, 'error');
    return { success: false, error: errorMsg };
  }, [showToast]);

  const addAnnouncement = useCallback(async (classroomId, title, content) => {
    const classroomName = classrooms.find(c => c.id === classroomId)?.subject || 'General';
    const payload = {
      classroomId,
      classroomName,
      title,
      content,
      author: currentUser?.name || 'Faculty User'
    };

    const res = await api.createAnnouncement(payload);
    if (res.success && res.data) {
      setAnnouncements(prev => [res.data, ...prev]);
      showToast('Announcement published!', 'success');
      return res.data;
    }
    showToast(res.error || 'Failed to publish announcement', 'error');
    return null;
  }, [classrooms, currentUser?.name, showToast]);

  const deleteAnnouncement = useCallback((id) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    showToast('Announcement deleted successfully', 'success');
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

  // Student private Workspace uploads
  const uploadPrivateDoc = useCallback((title, type, size, fileObj = null) => {
    const newDoc = {
      id: `upl_${Date.now()}`,
      title,
      type: type.toUpperCase(),
      uploadedDate: new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      size: size || '1.0 MB',
      fileObj
    };
    if (userRole === 'faculty') {
      setFacultyUploads(prev => [newDoc, ...prev]);
    } else {
      setStudentUploads(prev => [newDoc, ...prev]);
    }
    showToast('Private document uploaded!', 'success');
  }, [userRole, showToast]);

  const deletePrivateDoc = useCallback((id) => {
    if (userRole === 'faculty') {
      setFacultyUploads(prev => prev.filter(d => d.id !== id));
    } else {
      setStudentUploads(prev => prev.filter(d => d.id !== id));
    }
    showToast('Private file deleted', 'success');
  }, [userRole, showToast]);

  // Student private Workspace Notes
  const addNote = useCallback((title, content) => {
    const newNote = {
      id: `note_${Date.now()}`,
      title: title || 'Untitled Note',
      content: content || '',
      date: new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    };
    if (userRole === 'faculty') {
      setFacultyNotes(prev => [newNote, ...prev]);
    } else {
      setStudentNotes(prev => [newNote, ...prev]);
    }
    showToast('Personal note created!', 'success');
  }, [userRole, showToast]);

  const updateNote = useCallback((id, title, content) => {
    if (userRole === 'faculty') {
      setFacultyNotes(prev => prev.map(n => n.id === id ? { ...n, title, content } : n));
    } else {
      setStudentNotes(prev => prev.map(n => n.id === id ? { ...n, title, content } : n));
    }
    showToast('Note changes saved!', 'success');
  }, [userRole, showToast]);

  const deleteNote = useCallback((id) => {
    if (userRole === 'faculty') {
      setFacultyNotes(prev => prev.filter(n => n.id !== id));
    } else {
      setStudentNotes(prev => prev.filter(n => n.id !== id));
    }
    showToast('Note deleted successfully', 'success');
  }, [userRole, showToast]);

  const contextValue = useMemo(() => ({
    token,
    userRole,
    currentUser,
    setCurrentUser,
    classrooms,
    resources,
    workspaceFiles,
    announcements,
    aiChats,
    myUploads,
    myNotes,
    isLoading,
    error,
    toast,
    showToast,
    fetchClassrooms,
    login,
    register,
    logout,
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
    addAnnouncement,
    deleteAnnouncement,
    sendAiMessage,
    uploadPrivateDoc,
    deletePrivateDoc,
    addNote,
    updateNote,
    deleteNote
  }), [
    token,
    userRole,
    currentUser,
    classrooms,
    resources,
    workspaceFiles,
    announcements,
    aiChats,
    myUploads,
    myNotes,
    isLoading,
    error,
    toast,
    showToast,
    fetchClassrooms,
    login,
    register,
    logout,
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
    addAnnouncement,
    deleteAnnouncement,
    sendAiMessage,
    uploadPrivateDoc,
    deletePrivateDoc,
    addNote,
    updateNote,
    deleteNote
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

