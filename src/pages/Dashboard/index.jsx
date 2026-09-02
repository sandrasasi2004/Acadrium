import React, { useState } from 'react';
import { useUser } from '../../components/common/UserContext';
import { 
  FileText, 
  Megaphone, 
  BookOpen, 
  Plus, 
  ArrowRight, 
  Users, 
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  FolderUp,
  Megaphone as MegaphoneIcon
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { 
    userRole, 
    currentUser, 
    classrooms, 
    resources, 
    announcements,
    createClassroom,
    addAnnouncement,
    addResource
  } = useUser();

  const navigate = useNavigate();

  // Modals for Faculty Admin
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassSem, setNewClassSem] = useState('Sem II');
  const [newClassDesc, setNewClassDesc] = useState('');

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadClassId, setUploadClassId] = useState(classrooms[0]?.id || '');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');

  const [showPostModal, setShowPostModal] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postClassId, setPostClassId] = useState(classrooms[0]?.id || '');
  const [postContent, setPostContent] = useState('');

  // Handle operations
  const handleCreateClass = (e) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    createClassroom(newClassName, newClassSem, newClassDesc);
    setShowCreateModal(false);
    setNewClassName('');
    setNewClassDesc('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (!uploadTitle.trim()) {
        setUploadTitle(file.name.replace(/\.[^/.]+$/, "")); // strip extension
      }
    }
  };

  const getFileType = (file) => {
    if (!file) return 'PDF';
    const ext = file.name.split('.').pop().toLowerCase();
    if (['ppt', 'pptx'].includes(ext)) return 'PPT';
    if (['doc', 'docx'].includes(ext)) return 'DOCX';
    return 'PDF';
  };

  const getFileSizeString = (file) => {
    if (!file) return '0 KB';
    if (file.size > 1024 * 1024) {
      return (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    }
    return (file.size / 1024).toFixed(0) + ' KB';
  };

  const handleUploadResource = (e) => {
    e.preventDefault();
    if (!uploadTitle.trim() || !selectedFile) return;

    const calculatedType = getFileType(selectedFile);
    const calculatedSize = getFileSizeString(selectedFile);

    addResource(uploadClassId, uploadTitle, calculatedType, calculatedSize);
    
    setUploadSuccess('File uploaded successfully!');
    setTimeout(() => {
      setShowUploadModal(false);
      setUploadTitle('');
      setSelectedFile(null);
      setUploadDescription('');
      setUploadSuccess('');
    }, 1500);
  };

  const handlePostAnnouncement = (e) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) return;
    addAnnouncement(postClassId, postTitle, postContent);
    setShowPostModal(false);
    setPostTitle('');
    setPostContent('');
  };

  // Get data limits
  const recentResources = resources.slice(0, 3);
  const recentAnnouncements = announcements.slice(0, 3);

  // Dynamic Dashboard Render
  if (userRole === 'faculty') {
    return (
      <div className="space-y-6">
        
        {/* Welcome Banner */}
        <div className="rounded-3xl bg-linear-to-r from-indigo-600 via-indigo-700 to-indigo-800 p-6 md:p-8 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10 max-w-lg">
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/30 px-3 py-1 text-xs font-bold text-indigo-100 uppercase tracking-wider backdrop-blur-xs">
              <Sparkles className="h-3 w-3" /> Acadrium Faculty Dashboard
            </span>
            <h1 className="mt-4 text-2xl md:text-3xl font-extrabold tracking-tight">
              Hello {currentUser.name} 👋
            </h1>
            <p className="mt-2 text-sm text-indigo-100/90 leading-relaxed font-medium">
              Academic portal for managing classroom resources, student lists, and announcements.
            </p>
          </div>
          <div className="absolute right-0 bottom-0 top-0 hidden w-1/3 bg-radial-gradient from-white/10 to-transparent opacity-70 lg:block pointer-events-none"></div>
          <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-indigo-500/20 blur-xl pointer-events-none"></div>
        </div>

        {/* FACULTY QUICK ACTIONS */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Faculty Actions</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <button
              onClick={() => navigate('/classrooms')}
              className="cursor-pointer flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-xs transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-indigo-50 hover:shadow-md group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Eye className="h-5 w-5" />
              </div>
              <span className="mt-2.5 text-xs font-bold text-slate-700">View My Classrooms</span>
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="cursor-pointer flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-xs transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-indigo-50 hover:shadow-md group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Plus className="h-5 w-5" />
              </div>
              <span className="mt-2.5 text-xs font-bold text-slate-700">Create Classroom</span>
            </button>

            <button
              onClick={() => setShowUploadModal(true)}
              className="cursor-pointer flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-xs transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-indigo-50 hover:shadow-md group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <FolderUp className="h-5 w-5" />
              </div>
              <span className="mt-2.5 text-xs font-bold text-slate-700">Upload Resource</span>
            </button>

            <button
              onClick={() => setShowPostModal(true)}
              className="cursor-pointer flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-xs transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-indigo-50 hover:shadow-md group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <MegaphoneIcon className="h-5 w-5" />
              </div>
              <span className="mt-2.5 text-xs font-bold text-slate-700">Post Announcement</span>
            </button>
          </div>
        </div>

        {/* FEED SECTIONS */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Resources */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Recent Classroom Uploads</h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Faculty course uploads</p>
              </div>
              <Link to="/resources" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="space-y-3">
              {recentResources.map((res) => (
                <div key={res.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl font-black text-xs ${
                      res.type === 'PDF' ? 'bg-red-50 text-red-600' :
                      res.type === 'PPT' ? 'bg-orange-50 text-orange-600' :
                      'bg-blue-50 text-blue-600'
                    }`}>
                      {res.type}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{res.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{res.classroomName} • Uploaded by {res.uploadedBy}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-semibold">{res.uploadedDate}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Announcements */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Recent Announcements</h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Class notices updates</p>
              </div>
              <Link to="/announcements" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="space-y-4">
              {recentAnnouncements.map((ann) => (
                <div key={ann.id} className="relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-0 before:w-0.5 before:bg-indigo-100 last:before:hidden pb-1">
                  <div className="absolute left-0 top-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                    <Megaphone className="h-2.5 w-2.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-indigo-900">{ann.title}</h4>
                    <p className="text-[10px] font-semibold text-indigo-500 mt-0.5">{ann.classroomName} • {ann.date}</p>
                    <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">{ann.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MODALS */}
        {/* Create Classroom */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in duration-200">
              <h3 className="text-base font-bold text-slate-800">Create Classroom</h3>
              <form onSubmit={handleCreateClass} className="mt-4 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Subject Name :</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Database Management System"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-xs text-slate-800 outline-hidden focus:bg-white focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Semester :</label>
                  <select
                    value={newClassSem}
                    onChange={(e) => setNewClassSem(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-xs text-slate-800 outline-hidden focus:bg-white focus:border-indigo-500"
                  >
                    <option value="Sem I">Sem I</option>
                    <option value="Sem II">Sem II</option>
                    <option value="Sem III">Sem III</option>
                    <option value="Sem IV">Sem IV</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Description :</label>
                  <textarea
                    placeholder="Classroom course overview..."
                    value={newClassDesc}
                    onChange={(e) => setNewClassDesc(e.target.value)}
                    rows="3"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-xs text-slate-800 outline-hidden focus:bg-white focus:border-indigo-500 resize-none"
                  />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="rounded-xl px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100">Cancel</button>
                  <button type="submit" className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700">Create</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Upload Resource */}
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in duration-200">
              <h3 className="text-base font-bold text-slate-800">Upload Classroom Resource</h3>
              
              {uploadSuccess && (
                <div className="mt-3 rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 border border-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{uploadSuccess}</span>
                </div>
              )}

              <form onSubmit={handleUploadResource} className="mt-4 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Select Classroom :</label>
                  <select
                    value={uploadClassId}
                    onChange={(e) => setUploadClassId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-xs text-slate-800 outline-hidden focus:bg-white focus:border-indigo-500"
                  >
                    {classrooms.map(c => (
                      <option key={c.id} value={c.id}>{c.subject}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Browse File :</label>
                  <div className="flex flex-col gap-2">
                    <input
                      type="file"
                      required
                      id="faculty-file-input"
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.ppt,.pptx"
                    />
                    <label
                      htmlFor="faculty-file-input"
                      className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/20 py-4 text-center text-xs font-bold text-indigo-600 hover:bg-indigo-50/50 hover:border-indigo-400 transition-colors"
                    >
                      <Sparkles className="h-4 w-4 text-indigo-500" />
                      {selectedFile ? 'Change Selected File' : 'Choose File / Browse Files'}
                    </label>

                    {selectedFile && (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-left space-y-1 text-[11px] font-semibold text-slate-650">
                        <p className="font-bold text-slate-850 truncate">File: {selectedFile.name}</p>
                        <p>Detected Format: <span className="font-bold text-indigo-650">{getFileType(selectedFile)}</span></p>
                        <p>File Size: <span className="font-bold text-indigo-650">{getFileSizeString(selectedFile)}</span></p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Resource Title :</label>
                  <input
                    type="text"
                    required
                    placeholder="Resource Title (Auto-populated from file name)"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-xs text-slate-800 outline-hidden focus:bg-white focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Optional Description :</label>
                  <textarea
                    placeholder="Provide short details about the resource..."
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    rows="2"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-xs text-slate-800 outline-hidden focus:bg-white focus:border-indigo-500 resize-none"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button type="button" onClick={() => {
                    setShowUploadModal(false);
                    setUploadTitle('');
                    setSelectedFile(null);
                    setUploadDescription('');
                    setUploadSuccess('');
                  }} className="rounded-xl px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100">Cancel</button>
                  <button type="submit" disabled={!selectedFile || !uploadTitle.trim()} className={`rounded-xl px-5 py-2 text-xs font-bold text-white transition-colors ${
                    selectedFile && uploadTitle.trim() ? 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer' : 'bg-slate-300 cursor-not-allowed'
                  }`}>Upload</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Post Announcement */}
        {showPostModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in duration-200">
              <h3 className="text-base font-bold text-slate-800">Post Announcement</h3>
              <form onSubmit={handlePostAnnouncement} className="mt-4 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Select Classroom Board :</label>
                  <select
                    value={postClassId}
                    onChange={(e) => setPostClassId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-xs text-slate-800 outline-hidden focus:bg-white focus:border-indigo-500"
                  >
                    {classrooms.map(c => (
                      <option key={c.id} value={c.id}>{c.subject}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Announcement Title :</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Schedule for DBMS Lab shifted"
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-xs text-slate-800 outline-hidden focus:bg-white focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Content Details :</label>
                  <textarea
                    required
                    placeholder="Type description content..."
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    rows="4"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-xs text-slate-800 outline-hidden focus:bg-white focus:border-indigo-500 resize-none"
                  />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button type="button" onClick={() => setShowPostModal(false)} className="rounded-xl px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100">Cancel</button>
                  <button type="submit" className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700">Publish</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    );
  }

  // STUDENT VIEW (Simplified)
  return (
    <div className="space-y-6">
      
      {/* Welcome Banner Card */}
      <div className="rounded-3xl bg-linear-to-r from-indigo-600 via-indigo-700 to-indigo-800 p-6 md:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-lg">
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/30 px-3 py-1 text-xs font-bold text-indigo-100 uppercase tracking-wider backdrop-blur-xs">
            <Sparkles className="h-3 w-3" /> Acadrium Active Companion
          </span>
          <h1 className="mt-4 text-2xl md:text-3xl font-extrabold tracking-tight">
            Hello {currentUser.name.split(' ')[0]} 👋
          </h1>
          <p className="mt-2 text-sm text-indigo-100/90 leading-relaxed font-medium">
            Welcome back to Acadrium. Your AI-powered academic memory and document management companion.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 top-0 hidden w-1/3 bg-radial-gradient from-white/10 to-transparent opacity-70 lg:block pointer-events-none"></div>
        <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-indigo-500/20 blur-xl pointer-events-none"></div>
      </div>

      {/* Simplified Feed Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Classroom Uploads (Classroom resources uploaded by Faculty) */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Recent Classroom Uploads</h3>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Faculty course uploads</p>
            </div>
            <Link to="/resources" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentResources.map((res) => (
              <div 
                key={res.id} 
                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-3 hover:border-slate-200 transition-all hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl font-black text-xs ${
                    res.type === 'PDF' ? 'bg-red-50 text-red-600' :
                    res.type === 'PPT' ? 'bg-orange-50 text-orange-600' :
                    'bg-blue-50 text-blue-600'
                  }`}>
                    {res.type}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{res.title}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">{res.classroomName} • Uploaded by {res.uploadedBy}</p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 font-semibold">{res.uploadedDate}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Announcements */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Recent Announcements</h3>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Important course board updates</p>
            </div>
            <Link to="/announcements" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-4">
            {recentAnnouncements.map((ann) => (
              <div key={ann.id} className="relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-0 before:w-0.5 before:bg-indigo-100 last:before:hidden pb-1">
                <div className="absolute left-0 top-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                  <Megaphone className="h-2.5 w-2.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-indigo-900">{ann.title}</h4>
                  <p className="text-[10px] font-semibold text-indigo-500 mt-0.5">{ann.classroomName} • {ann.date}</p>
                  <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">{ann.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
