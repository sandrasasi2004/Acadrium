import React, { createContext, useContext, useState, useEffect } from 'react';
import * as api from '../../services/api';

const UserContext = createContext();

export function UserProvider({ children }) {
  // Application role & active user state
  const [userRole, setUserRole] = useState('student');
  
  const [currentUser, setCurrentUser] = useState({
    id: 'usr_default',
    name: 'Acadrium User',
    email: 'user@acadrium.edu',
    department: 'Academic Department',
    semester: 'Semester II',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
  });

  // Empty data arrays ready for backend integration
  const [classrooms, setClassrooms] = useState([]);
  const [resources, setResources] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [aiChats, setAiChats] = useState([]);
  
  // Private Workspace empty arrays
  const [studentNotes, setStudentNotes] = useState([]);
  const [facultyNotes, setFacultyNotes] = useState([]);
  const [studentUploads, setStudentUploads] = useState([]);
  const [facultyUploads, setFacultyUploads] = useState([]);

  // Data Loading & Error States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Global Toast state
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // Initial load simulation via central API layer
  useEffect(() => {
    let isMounted = true;
    async function loadInitialData() {
      setIsLoading(true);
      setError(null);
      try {
        const [clsRes, resRes, annRes] = await Promise.all([
          api.listClassrooms(),
          api.listResources(),
          api.listAnnouncements()
        ]);

        if (isMounted) {
          if (clsRes.success) setClassrooms(clsRes.data || []);
          if (resRes.success) setResources(resRes.data || []);
          if (annRes.success) setAnnouncements(annRes.data || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || 'Failed to sync initial data from API service.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadInitialData();
    return () => { isMounted = false; };
  }, []);

  // Computed Workspace States based on active role
  const myNotes = userRole === 'faculty' ? facultyNotes : studentNotes;
  const myUploads = userRole === 'faculty' ? facultyUploads : studentUploads;

  // Actions wired to API Service Layer
  const login = async (role, username, password = '') => {
    setIsLoading(true);
    setUserRole(role);
    const res = await api.login({ role, username, password });
    setIsLoading(false);
    
    if (res.success && res.data?.user) {
      setCurrentUser(res.data.user);
      showToast(`Logged in successfully as ${role === 'faculty' ? 'Faculty User' : 'Student User'}`, 'success');
      return { success: true };
    } else {
      showToast(res.error || 'Login failed', 'error');
      return { success: false, error: res.error };
    }
  };

  const register = async (role, username, email, password = '') => {
    setIsLoading(true);
    setUserRole(role);
    const res = await api.register({ role, username, email, password });
    setIsLoading(false);

    if (res.success && res.data?.user) {
      setCurrentUser(res.data.user);
      showToast('Registration completed!', 'success');
      return { success: true };
    } else {
      showToast(res.error || 'Registration failed', 'error');
      return { success: false, error: res.error };
    }
  };

  const updateProfileAvatar = (avatarUrl) => {
    setCurrentUser(prev => ({
      ...prev,
      avatar: avatarUrl
    }));
    showToast('Profile picture updated!', 'success');
  };

  const createClassroom = async (subject, semester, description) => {
    const payload = {
      subject,
      semester,
      description,
      facultyId: currentUser?.id || 'fac_user',
      facultyName: currentUser?.name || 'Faculty User'
    };

    const res = await api.createClassroom(payload);
    if (res.success && res.data) {
      setClassrooms(prev => [res.data, ...prev]);
      showToast('Classroom created successfully!', 'success');
      return res.data;
    }
    showToast(res.error || 'Failed to create classroom', 'error');
    return null;
  };

  const joinClassroom = async (inviteCode) => {
    const targetClass = classrooms.find(c => c.inviteCode === inviteCode);
    if (targetClass) {
      const updated = classrooms.map(c => {
        if (c.inviteCode === inviteCode) {
          return { ...c, studentCount: (c.studentCount || 0) + 1 };
        }
        return c;
      });
      setClassrooms(updated);
      showToast(`Successfully joined ${targetClass.subject}!`, 'success');
      return { success: true, subject: targetClass.subject };
    }
    
    const res = await api.joinClassroom(inviteCode);
    if (res.success) {
      showToast('Successfully joined classroom!', 'success');
      return { success: true, subject: 'Classroom' };
    }

    showToast('Classroom not found. Check invite code.', 'error');
    return { success: false, message: 'Classroom not found. Check the invite code.' };
  };

  const leaveClassroom = (id) => {
    const targetClass = classrooms.find(c => c.id === id);
    if (targetClass) {
      const updated = classrooms.map(c => {
        if (c.id === id) {
          return { ...c, studentCount: Math.max(0, (c.studentCount || 0) - 1) };
        }
        return c;
      });
      setClassrooms(updated);
      showToast(`Left classroom ${targetClass.subject}`, 'success');
    }
  };

  const deleteClassroom = (id) => {
    setClassrooms(prev => prev.filter(c => c.id !== id));
    showToast('Classroom deleted successfully', 'success');
  };

  const addResource = async (classroomId, title, type, size, fileObj = null) => {
    const classroomName = classrooms.find(c => c.id === classroomId)?.subject || 'General';
    const payload = {
      classroomId,
      classroomName,
      title,
      type,
      size,
      uploadedBy: currentUser?.name || 'Faculty User',
      fileObj
    };

    const res = await api.uploadResource(payload);
    if (res.success && res.data) {
      setResources(prev => [res.data, ...prev]);
      showToast('Resource uploaded successfully!', 'success');
      return res.data;
    }
    showToast(res.error || 'Failed to upload resource', 'error');
    return null;
  };

  const deleteResource = (id) => {
    setResources(prev => prev.filter(r => r.id !== id));
    showToast('Resource deleted successfully', 'success');
  };

  const addAnnouncement = async (classroomId, title, content) => {
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
  };

  const deleteAnnouncement = (id) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    showToast('Announcement deleted successfully', 'success');
  };

  const sendAiMessage = async (text) => {
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
  };

  // Student private Workspace uploads
  const uploadPrivateDoc = (title, type, size, fileObj = null) => {
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
  };

  const deletePrivateDoc = (id) => {
    if (userRole === 'faculty') {
      setFacultyUploads(prev => prev.filter(d => d.id !== id));
    } else {
      setStudentUploads(prev => prev.filter(d => d.id !== id));
    }
    showToast('Private file deleted', 'success');
  };

  // Student private Workspace Notes
  const addNote = (title, content) => {
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
  };

  const updateNote = (id, title, content) => {
    if (userRole === 'faculty') {
      setFacultyNotes(prev => prev.map(n => n.id === id ? { ...n, title, content } : n));
    } else {
      setStudentNotes(prev => prev.map(n => n.id === id ? { ...n, title, content } : n));
    }
    showToast('Note changes saved!', 'success');
  };

  const deleteNote = (id) => {
    if (userRole === 'faculty') {
      setFacultyNotes(prev => prev.filter(n => n.id !== id));
    } else {
      setStudentNotes(prev => prev.filter(n => n.id !== id));
    }
    showToast('Note deleted successfully', 'success');
  };

  return (
    <UserContext.Provider value={{
      userRole,
      currentUser,
      setCurrentUser,
      classrooms,
      resources,
      announcements,
      aiChats,
      myUploads,
      myNotes,
      isLoading,
      error,
      toast,
      showToast,
      login,
      register,
      updateProfileAvatar,
      createClassroom,
      joinClassroom,
      leaveClassroom,
      deleteClassroom,
      addResource,
      deleteResource,
      addAnnouncement,
      deleteAnnouncement,
      sendAiMessage,
      uploadPrivateDoc,
      deletePrivateDoc,
      addNote,
      updateNote,
      deleteNote
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
