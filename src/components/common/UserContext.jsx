import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  mockFaculty, 
  mockStudent, 
  mockClassrooms, 
  mockResources, 
  mockAnnouncements,
  mockAiChatHistory,
  mockStudentUploads,
  mockStudentNotes,
  mockFacultyUploads,
  mockFacultyNotes
} from '../../data/mockData';

const UserContext = createContext();

export function UserProvider({ children }) {
  // Demo configurations
  const [userRole, setUserRole] = useState('student'); // 'student' or 'faculty'
  const [currentUser, setCurrentUser] = useState(mockStudent);

  // In-memory data states
  const [classrooms, setClassrooms] = useState(mockClassrooms);
  const [resources, setResources] = useState(mockResources);
  const [announcements, setAnnouncements] = useState(mockAnnouncements);
  const [aiChats, setAiChats] = useState(mockAiChatHistory);
  
  // Separated private Workspace states
  const [studentNotes, setStudentNotes] = useState(mockStudentNotes);
  const [facultyNotes, setFacultyNotes] = useState(mockFacultyNotes);
  const [studentUploads, setStudentUploads] = useState(mockStudentUploads);
  const [facultyUploads, setFacultyUploads] = useState(mockFacultyUploads);

  // Global Toast state
  const [toast, setToast] = useState(null); // { message: '', type: 'success' | 'info' | 'error' }

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    // Auto dismiss after 3 seconds
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // Keep currentUser in sync with userRole
  useEffect(() => {
    if (userRole === 'faculty') {
      setCurrentUser(mockFaculty);
    } else {
      setCurrentUser(mockStudent);
    }
  }, [userRole]);

  // Computed Workspace States based on role
  const myNotes = userRole === 'faculty' ? facultyNotes : studentNotes;
  const myUploads = userRole === 'faculty' ? facultyUploads : studentUploads;

  // Actions
  const login = (role, username) => {
    setUserRole(role);
    if (role === 'faculty') {
      setCurrentUser({ ...mockFaculty, name: username || mockFaculty.name });
    } else {
      setCurrentUser({ ...mockStudent, name: username || mockStudent.name });
    }
    showToast(`Logged in as ${role === 'faculty' ? 'Faculty' : 'Student'}`, 'success');
  };

  const register = (role, username, email) => {
    setUserRole(role);
    if (role === 'faculty') {
      setCurrentUser({
        id: `fac_${Date.now()}`,
        name: username,
        email: email,
        department: "Computer Applications",
        role: "faculty",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"
      });
    } else {
      setCurrentUser({
        id: `std_${Date.now()}`,
        name: username,
        email: email,
        department: "Computer Applications",
        semester: "Semester II",
        role: "student",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
      });
    }
    showToast("Registration completed!", "success");
  };

  const updateProfileAvatar = (avatarUrl) => {
    setCurrentUser(prev => ({
      ...prev,
      avatar: avatarUrl
    }));
    // Also sync the static objects in case they are reloaded
    if (userRole === 'faculty') {
      mockFaculty.avatar = avatarUrl;
    } else {
      mockStudent.avatar = avatarUrl;
    }
    showToast("Profile picture updated!", "success");
  };

  const createClassroom = (subject, semester, description) => {
    const newClass = {
      id: `class_${Date.now()}`,
      subject,
      semester,
      courseCode: `MCA${Math.floor(10000 + Math.random() * 90000)}`,
      inviteCode: Math.random().toString(36).substring(2, 12),
      studentCount: 0,
      facultyId: currentUser.id,
      facultyName: currentUser.name,
      description: description || "No classroom description provided."
    };
    setClassrooms([newClass, ...classrooms]);
    showToast("Classroom created successfully!", "success");
    return newClass;
  };

  const joinClassroom = (inviteCode) => {
    const targetClass = classrooms.find(c => c.inviteCode === inviteCode);
    if (targetClass) {
      const updated = classrooms.map(c => {
        if (c.inviteCode === inviteCode) {
          return { ...c, studentCount: c.studentCount + 1 };
        }
        return c;
      });
      setClassrooms(updated);
      showToast(`Successfully joined ${targetClass.subject}!`, "success");
      return { success: true, subject: targetClass.subject };
    }
    showToast("Classroom not found. Check invite code.", "error");
    return { success: false, message: "Classroom not found. Check the invite code." };
  };

  const leaveClassroom = (id) => {
    const targetClass = classrooms.find(c => c.id === id);
    if (targetClass) {
      const updated = classrooms.map(c => {
        if (c.id === id) {
          return { ...c, studentCount: Math.max(0, c.studentCount - 1) };
        }
        return c;
      });
      setClassrooms(updated);
      showToast(`Left classroom ${targetClass.subject}`, "success");
    }
  };

  const deleteClassroom = (id) => {
    const targetClass = classrooms.find(c => c.id === id);
    setClassrooms(classrooms.filter(c => c.id !== id));
    showToast("Classroom deleted successfully", "success");
  };

  const addResource = (classroomId, title, type, size, fileObj = null) => {
    const newRes = {
      id: `res_${Date.now()}`,
      title,
      type: type.toUpperCase(),
      uploadedDate: new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      classroomId,
      classroomName: classrooms.find(c => c.id === classroomId)?.subject || "General",
      size: size || "1.5 MB",
      uploadedBy: currentUser.name,
      fileObj
    };
    setResources([newRes, ...resources]);
    showToast("Resource uploaded successfully!", "success");
  };

  const deleteResource = (id) => {
    setResources(resources.filter(r => r.id !== id));
    showToast("Resource deleted successfully", "success");
  };

  const addAnnouncement = (classroomId, title, content) => {
    const newAnn = {
      id: `ann_${Date.now()}`,
      title,
      content,
      date: new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      classroomId,
      classroomName: classrooms.find(c => c.id === classroomId)?.subject || "General",
      author: currentUser.name
    };
    setAnnouncements([newAnn, ...announcements]);
    showToast("Announcement published!", "success");
  };

  const deleteAnnouncement = (id) => {
    setAnnouncements(announcements.filter(a => a.id !== id));
    showToast("Announcement deleted successfully", "success");
  };

  const sendAiMessage = (text) => {
    const userMsg = {
      sender: "user",
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setAiChats(prev => [...prev, userMsg]);

    // Simple, user-friendly RAG placeholder
    return new Promise((resolve) => {
      setTimeout(() => {
        const botMsg = {
          sender: "bot",
          text: "AI responses will be available after backend integration. The final system will answer questions based on your uploaded classroom materials.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setAiChats(prev => [...prev, botMsg]);
        resolve();
      }, 1000);
    });
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
      size: size || "1.0 MB",
      fileObj
    };
    if (userRole === 'faculty') {
      setFacultyUploads([newDoc, ...facultyUploads]);
    } else {
      setStudentUploads([newDoc, ...studentUploads]);
    }
    showToast("Private document uploaded!", "success");
  };

  const deletePrivateDoc = (id) => {
    if (userRole === 'faculty') {
      setFacultyUploads(facultyUploads.filter(d => d.id !== id));
    } else {
      setStudentUploads(studentUploads.filter(d => d.id !== id));
    }
    showToast("Private file deleted", "success");
  };

  // Student private Workspace Notes
  const addNote = (title, content) => {
    const newNote = {
      id: `note_${Date.now()}`,
      title: title || "Untitled Note",
      content: content || "",
      date: new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    };
    if (userRole === 'faculty') {
      setFacultyNotes([newNote, ...facultyNotes]);
    } else {
      setStudentNotes([newNote, ...studentNotes]);
    }
    showToast("Personal note created!", "success");
  };

  const updateNote = (id, title, content) => {
    if (userRole === 'faculty') {
      setFacultyNotes(facultyNotes.map(n => n.id === id ? { ...n, title, content } : n));
    } else {
      setStudentNotes(studentNotes.map(n => n.id === id ? { ...n, title, content } : n));
    }
    showToast("Note changes saved!", "success");
  };

  const deleteNote = (id) => {
    if (userRole === 'faculty') {
      setFacultyNotes(facultyNotes.filter(n => n.id !== id));
    } else {
      setStudentNotes(studentNotes.filter(n => n.id !== id));
    }
    showToast("Note deleted successfully", "success");
  };

  return (
    <UserContext.Provider value={{
      userRole,
      setUserRole,
      currentUser,
      classrooms,
      resources,
      announcements,
      aiChats,
      myUploads,
      myNotes,
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
