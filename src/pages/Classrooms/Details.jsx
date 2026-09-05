import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useUser } from '../../components/common/UserContext';
import * as api from '../../services/api';
import { 
  ArrowLeft, 
  Users, 
  BookOpen, 
  Key, 
  FileText, 
  Megaphone, 
  Settings as SettingsIcon,
  Plus, 
  Download, 
  Trash2, 
  Copy,
  CheckCircle2,
  Sparkles,
  Eye,
  AlertCircle
} from 'lucide-react';
import DocumentViewer from '../../components/common/DocumentViewer';

export default function ClassroomDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    userRole, 
    classrooms, 
    resources, 
    announcements, 
    isLoading,
    error,
    showToast,
    fetchClassrooms,
    loadResources,
    fetchClassroomResources,
    uploadResource, 
    addAnnouncement,
    deleteResource,
    deleteAnnouncement,
    leaveClassroom,
    deleteClassroom
  } = useUser();

  const [previewFile, setPreviewFile] = useState(null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);

  useEffect(() => {
    fetchClassrooms();
    loadResources();
    if (id) {
      fetchClassroomResources(id);
    }
  }, [id]);

  // Find target classroom safely
  const classroom = classrooms.find(c => c.id === id) || (classrooms.length > 0 ? classrooms[0] : null);

  // Active Tab
  const [activeTab, setActiveTab] = useState('resources');

  // Modals / State
  const [copied, setCopied] = useState(false);
  const [showAddResModal, setShowAddResModal] = useState(false);
  const [resTitle, setResTitle] = useState('');
  const [resTags, setResTags] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [resDescription, setResDescription] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (!resTitle.trim()) {
        setResTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const getFileType = (file) => {
    if (!file) return 'PDF';
    const ext = file.name.split('.').pop().toLowerCase();
    if (['ppt', 'pptx'].includes(ext)) return 'PPT';
    if (['doc', 'docx'].includes(ext)) return 'DOCX';
    if (['png', 'jpg', 'jpeg'].includes(ext)) return 'IMAGE';
    return 'PDF';
  };

  const getFileSizeString = (file) => {
    if (!file) return '0 KB';
    if (file.size > 1024 * 1024) {
      return (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    }
    return (file.size / 1024).toFixed(0) + ' KB';
  };

  const [showAddAnnModal, setShowAddAnnModal] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');

  // Copy Invite Code
  const handleCopyCode = () => {
    if (classroom?.inviteCode) {
      navigator.clipboard.writeText(classroom.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Add Resource Action using real backend FormData endpoint
  const handleAddResourceSubmit = async (e) => {
    e.preventDefault();
    if (!resTitle.trim() || !selectedFile || !classroom) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('classroom_id', classroom.id);
    formData.append('title', resTitle.trim());
    if (resDescription.trim()) formData.append('description', resDescription.trim());
    if (resTags.trim()) formData.append('tags', resTags.trim());

    const result = await uploadResource(formData);
    if (result && result.success) {
      setUploadSuccess('File uploaded successfully!');
      setTimeout(() => {
        setShowAddResModal(false);
        setResTitle('');
        setResTags('');
        setSelectedFile(null);
        setResDescription('');
        setUploadSuccess('');
      }, 1200);
    }
  };

  // Add Announcement Action
  const handleAddAnnouncementSubmit = async (e) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim() || !classroom) return;
    await addAnnouncement(classroom.id, annTitle, annContent);
    setShowAddAnnModal(false);
    setAnnTitle('');
    setAnnContent('');
  };

  // Filters resources and announcements specifically for this classroom
  const classResources = classroom 
    ? resources.filter(r => String(r.classroom_id || r.classroomId) === String(classroom.id)) 
    : [];
  const classAnnouncements = classroom ? announcements.filter(a => a.classroomId === classroom.id) : [];

  useEffect(() => {
    async function loadStudents() {
      if (classroom?.id && activeTab === 'students') {
        const res = await api.getClassroomStudents(classroom.id);
        if (res.success && Array.isArray(res.data)) {
          setEnrolledStudents(res.data);
        } else if (Array.isArray(res)) {
          setEnrolledStudents(res);
        } else {
          setEnrolledStudents([]);
        }
      }
    }
    loadStudents();
  }, [classroom?.id, activeTab]);

  if (!classroom && !isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <Link to="/classrooms" className="hover:text-indigo-600">Classrooms</Link>
          <span>&gt;</span>
          <span className="text-slate-600 font-bold">Classroom Not Found</span>
        </div>

        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-xs">
          <BookOpen className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-sm font-extrabold text-slate-700">Classroom detail unavailable</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            The requested classroom record does not exist or has been removed.
          </p>
          <button
            onClick={() => navigate('/classrooms')}
            className="cursor-pointer mt-4 inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Return to Classrooms List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Error Alert Banner */}
      {error && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-700 font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
        <Link to="/classrooms" className="hover:text-indigo-600">Classrooms</Link>
        <span>&gt;</span>
        <span className="text-slate-600 font-bold">{classroom?.subject || 'Classroom Details'}</span>
      </div>

      {/* Classroom Banner */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">{classroom?.subject}</h1>
              <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-600">
                {classroom?.semester}
              </span>
            </div>
            <p className="text-xs font-medium text-slate-500 max-w-xl leading-relaxed">
              {classroom?.description || 'No classroom description provided.'}
            </p>
          </div>
          
          <div className="flex items-center gap-2 self-start md:self-center">
            {userRole === 'student' && classroom && (
              <button 
                onClick={() => {
                  if (window.confirm("Are you sure you want to leave this classroom? You will lose access to its resources and announcements.")) {
                    leaveClassroom(classroom.id);
                    navigate('/classrooms');
                  }
                }}
                className="cursor-pointer rounded-xl bg-rose-50 border border-rose-200 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors"
              >
                Leave Classroom
              </button>
            )}
            <button 
              onClick={() => navigate('/classrooms')}
              className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back to List
            </button>
          </div>
        </div>

        {/* Classroom Info Strip */}
        <div className="mt-6 border-t border-slate-100 pt-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold">
          <div className="flex items-center gap-2.5 text-slate-600">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Students Enrolled</p>
              <p className="text-sm font-black text-slate-800 mt-0.5">{classroom?.studentCount || 0} Students</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-slate-600">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Course Code</p>
              <p className="text-sm font-black text-slate-800 mt-0.5">{classroom?.courseCode || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-slate-600 col-span-2 sm:col-span-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
              <Key className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Invite Code</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-sm font-bold font-mono text-indigo-600 truncate">{classroom?.inviteCode || 'N/A'}</span>
                <button
                  onClick={handleCopyCode}
                  className="cursor-pointer p-1 text-slate-400 hover:text-indigo-600 transition-colors shrink-0"
                  title="Copy Invite Code"
                >
                  {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Switcher Navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6 md:space-x-8" aria-label="Tabs">
          {[
            { id: 'resources', label: 'Resources', icon: FileText },
            { id: 'students', label: 'Students', icon: Users },
            { id: 'announcements', label: 'Announcements', icon: Megaphone },
            { id: 'settings', label: 'Settings', icon: SettingsIcon },
          ].filter(tab => {
            if (userRole === 'student') {
              return tab.id === 'resources' || tab.id === 'announcements';
            }
            return true;
          }).map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`cursor-pointer group flex items-center gap-2 py-4 px-1 border-b-2 font-bold text-xs uppercase tracking-wider transition-all ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600 font-extrabold'
                    : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* TAB CONTENT PANEL */}
      <div className="min-h-[300px]">
        
        {/* RESOURCES TAB */}
        {activeTab === 'resources' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Class Documents</h3>
              {userRole === 'faculty' && (
                <button
                  onClick={() => setShowAddResModal(true)}
                  className="cursor-pointer inline-flex items-center gap-1 rounded-full bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="h-4 w-4" /> Add Resources
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse h-12 bg-slate-100 rounded-xl"></div>
                ))}
              </div>
            ) : classResources.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <h4 className="text-sm font-bold text-slate-700">No resources uploaded yet</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  {userRole === 'faculty' 
                    ? 'Click "Add Resources" to upload course slides, PDFs, or lecture notes for students.' 
                    : 'Course materials uploaded by faculty will appear here.'}
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-xs font-semibold">
                    <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Title</th>
                        <th className="px-6 py-4">Type</th>
                        <th className="px-6 py-4">Uploaded on</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {classResources.map((res) => {
                        const typeTag = res.file_type || res.type || 'PDF';
                        const uploader = res.uploader_name || res.uploadedBy || 'Faculty';
                        const createdDate = res.created_at ? new Date(res.created_at).toLocaleDateString() : (res.uploadedDate || 'N/A');
                        const bytes = typeof res.file_size === 'number' ? res.file_size : null;
                        const formattedSize = bytes ? (bytes > 1024 * 1024 ? (bytes / (1024 * 1024)).toFixed(1) + ' MB' : (bytes / 1024).toFixed(0) + ' KB') : (res.size || 'N/A');

                        return (
                          <tr key={res.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`flex h-8 w-8 items-center justify-center rounded-lg font-black text-[10px] ${
                                  typeTag === 'PDF' ? 'bg-red-50 text-red-600' :
                                  typeTag === 'PPT' ? 'bg-orange-50 text-orange-600' :
                                  typeTag === 'IMAGE' ? 'bg-emerald-50 text-emerald-600' :
                                  'bg-blue-50 text-blue-600'
                                }`}>
                                  {typeTag}
                                </div>
                                <div>
                                  <button
                                    onClick={() => api.downloadResource(res.id, res.original_filename || res.title)}
                                    className="text-left text-slate-800 font-bold block hover:text-indigo-600 hover:underline cursor-pointer"
                                  >
                                    {res.title}
                                  </button>
                                  <span className="text-[10px] text-slate-400 font-semibold">{formattedSize} • By {uploader}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-500">{typeTag}</td>
                            <td className="px-6 py-4 text-slate-500">{createdDate}</td>
                            <td className="px-6 py-4 text-right space-x-2">
                              <button 
                                onClick={() => api.downloadResource(res.id, res.original_filename || res.title)}
                                className="cursor-pointer inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-colors" 
                                title="Download File"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                              {userRole === 'faculty' && (
                                <button 
                                  onClick={() => {
                                    if (window.confirm("Are you sure you want to delete this classroom resource? This action cannot be undone.")) {
                                      deleteResource(res.id);
                                    }
                                  }}
                                  className="cursor-pointer inline-flex items-center justify-center p-1.5 rounded-lg border border-rose-100 text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors" 
                                  title="Delete Document"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STUDENTS TAB */}
        {activeTab === 'students' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Class Roll-Call</h3>
            
            {enrolledStudents.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
                <Users className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <h4 className="text-sm font-bold text-slate-700">No students enrolled yet</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Students can join this classroom using invite code: <span className="font-mono font-bold text-indigo-600">{classroom?.inviteCode}</span>
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-xs font-semibold">
                    <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Student Name</th>
                        <th className="px-6 py-4">Roll Number</th>
                        <th className="px-6 py-4">Email Address</th>
                        <th className="px-6 py-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {enrolledStudents.map((student) => (
                        <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-800">{student.name}</td>
                          <td className="px-6 py-4 text-slate-500 font-mono">{student.rollNo}</td>
                          <td className="px-6 py-4 text-slate-500">{student.email}</td>
                          <td className="px-6 py-4 text-right">
                            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                              {student.status || 'Active'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ANNOUNCEMENTS TAB */}
        {activeTab === 'announcements' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Class Announcements</h3>
              {userRole === 'faculty' && (
                <button
                  onClick={handleAddAnnClick}
                  className="cursor-pointer inline-flex items-center gap-1 rounded-full bg-slate-400 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-500 transition-colors"
                  title="Announcement creation will be available in Phase 4"
                >
                  <Plus className="h-4 w-4" /> Add Announcement
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="animate-pulse rounded-3xl border border-slate-200 bg-white p-5 h-28"></div>
                ))}
              </div>
            ) : classAnnouncements.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
                <Megaphone className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <h4 className="text-sm font-bold text-slate-700">No announcements posted</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">Class announcements, schedule tweaks, and exam dates will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {classAnnouncements.map((ann) => (
                  <div key={ann.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                          <Megaphone className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-800 leading-tight">{ann.title}</h4>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">By {ann.author} • {ann.date}</p>
                        </div>
                      </div>
                      {userRole === 'faculty' && (
                        <button 
                          onClick={() => {
                            if (window.confirm("Are you sure you want to delete this announcement? This action cannot be undone.")) {
                              deleteAnnouncement(ann.id);
                            }
                          }}
                          className="cursor-pointer text-slate-400 hover:text-rose-600 transition-colors p-1.5" 
                          title="Remove Announcement"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <p className="mt-4 text-xs text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">{ann.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && classroom && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs max-w-2xl">
            <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Classroom Settings</h3>
            <p className="text-xs text-slate-500 mt-0.5">Configure access rules and course properties.</p>

            <div className="mt-6 space-y-6">
              {userRole === 'faculty' ? (
                <form onSubmit={(e) => { e.preventDefault(); alert("Classroom settings update ready for API integration."); }} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Subject Name :</label>
                      <input 
                        type="text" 
                        defaultValue={classroom.subject} 
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-xs text-slate-800 outline-hidden focus:bg-white focus:border-indigo-500" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Course Code :</label>
                      <input 
                        type="text" 
                        defaultValue={classroom.courseCode} 
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-xs text-slate-800 outline-hidden focus:bg-white focus:border-indigo-500" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Classroom Description :</label>
                    <textarea 
                      defaultValue={classroom.description} 
                      rows="3" 
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-xs text-slate-800 outline-hidden focus:bg-white focus:border-indigo-500 resize-none" 
                    />
                  </div>

                  <div className="border-t border-slate-100 pt-5 flex items-center justify-between">
                    <button 
                      type="button" 
                      onClick={() => {
                        if (window.confirm("Are you sure you want to delete this classroom? This action will permanently remove all resources and announcements. It cannot be undone.")) {
                          deleteClassroom(classroom.id);
                          navigate('/classrooms');
                        }
                      }}
                      className="cursor-pointer rounded-xl bg-rose-50 border border-rose-200 px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 className="h-4 w-4" /> Archive / Delete Classroom
                    </button>
                    <button 
                      type="submit" 
                      className="cursor-pointer rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
                    <h4 className="text-xs font-bold text-amber-800">Student Access</h4>
                    <p className="text-xs text-amber-700 mt-1">You are enrolled in this classroom as a student. You have view permission for resources and announcements, and can search them using the AI Assistant.</p>
                  </div>
                  
                  <div className="pt-4 flex justify-start">
                    <button 
                      onClick={() => { if(confirm("Leave this classroom?")) navigate('/classrooms'); }}
                      className="cursor-pointer rounded-xl bg-rose-50 border border-rose-200 px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors"
                    >
                      Leave Classroom
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* ADD RESOURCE MODAL */}
      {showAddResModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <h3 className="text-base font-bold text-slate-800">Add Resource File</h3>
            <p className="text-xs text-slate-500 mt-1">Select the document format type and file to upload.</p>
            
            {uploadSuccess && (
              <div className="mt-3 rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{uploadSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAddResourceSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Browse File :</label>
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    required
                    id="details-resource-file-input"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg"
                  />
                  <label
                    htmlFor="details-resource-file-input"
                    className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/20 py-4 text-center text-xs font-bold text-indigo-600 hover:bg-indigo-50/50 hover:border-indigo-400 transition-colors"
                  >
                    <Sparkles className="h-4 w-4 text-indigo-500" />
                    {selectedFile ? 'Change Selected File' : 'Choose File / Browse Files'}
                  </label>

                  {selectedFile && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-left space-y-1 text-[11px] font-semibold text-slate-600">
                      <p className="font-bold text-slate-800 truncate">File: {selectedFile.name}</p>
                      <p>Detected Format: <span className="font-bold text-indigo-600">{getFileType(selectedFile)}</span></p>
                      <p>File Size: <span className="font-bold text-indigo-600">{getFileSizeString(selectedFile)}</span></p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Document Title :</label>
                <input
                  type="text"
                  required
                  placeholder="Resource Title"
                  value={resTitle}
                  onChange={(e) => setResTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-xs text-slate-800 outline-hidden focus:bg-white focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tags (Optional) :</label>
                <input
                  type="text"
                  placeholder="e.g. syllabus, lecture1, lab"
                  value={resTags}
                  onChange={(e) => setResTags(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-xs text-slate-800 outline-hidden focus:bg-white focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Optional Description :</label>
                <textarea
                  placeholder="Provide short details about the resource..."
                  value={resDescription}
                  onChange={(e) => setResDescription(e.target.value)}
                  rows="2"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-xs text-slate-800 outline-hidden focus:bg-white focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddResModal(false);
                    setResTitle('');
                    setSelectedFile(null);
                    setResDescription('');
                    setUploadSuccess('');
                  }}
                  className="cursor-pointer rounded-xl px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedFile || !resTitle.trim()}
                  className={`rounded-xl px-5 py-2.5 text-xs font-bold text-white transition-colors ${
                    selectedFile && resTitle.trim() ? 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer' : 'bg-slate-300 cursor-not-allowed'
                  }`}
                >
                  Add Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD ANNOUNCEMENT MODAL */}
      {showAddAnnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <h3 className="text-base font-bold text-slate-800">Add Announcement</h3>
            <p className="text-xs text-slate-500 mt-1">Post a new announcement to the course board for students to read.</p>
            
            <form onSubmit={handleAddAnnouncementSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Announcement Title :</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SQL Homework Postponed"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-xs text-slate-800 outline-hidden focus:bg-white focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Message Content :</label>
                <textarea
                  required
                  placeholder="Type the announcement details..."
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  rows="4"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-xs text-slate-800 outline-hidden focus:bg-white focus:border-indigo-500 transition-colors resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddAnnModal(false)}
                  className="cursor-pointer rounded-xl px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cursor-pointer rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition-colors"
                >
                  Publish Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      {previewFile && (
        <DocumentViewer file={previewFile} onClose={() => setPreviewFile(null)} />
      )}

    </div>
  );
}
