import React, { useState, useEffect } from 'react';
import { useUser } from '../../components/common/UserContext';
import { Megaphone, Trash2, Edit2, Plus, Search, Filter, AlertCircle } from 'lucide-react';

export default function Announcements() {
  const { 
    userRole, 
    announcements, 
    classrooms, 
    isLoading,
    error,
    loadAnnouncements,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement
  } = useUser();

  useEffect(() => {
    loadAnnouncements();
  }, []);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');

  // Modal State
  const [showAddAnnModal, setShowAddAnnModal] = useState(false);
  const [editingAnnId, setEditingAnnId] = useState(null);
  const [annTitle, setAnnTitle] = useState('');
  const [annClassroomId, setAnnClassroomId] = useState('');
  const [annContent, setAnnContent] = useState('');

  // Set default classroom when classrooms load
  useEffect(() => {
    if (classrooms.length > 0 && !annClassroomId) {
      setAnnClassroomId(classrooms[0].id);
    }
  }, [classrooms, annClassroomId]);

  const handleAddClick = () => {
    setEditingAnnId(null);
    setAnnTitle('');
    setAnnContent('');
    if (classrooms.length > 0) setAnnClassroomId(classrooms[0].id);
    setShowAddAnnModal(true);
  };

  const handleEditAnnClick = (ann) => {
    setEditingAnnId(ann.id);
    setAnnTitle(ann.title);
    setAnnContent(ann.content);
    setAnnClassroomId(ann.classroom_id || ann.classroomId);
    setShowAddAnnModal(true);
  };

  // Handle post/update announcement submit
  const handleAddAnnSubmit = async (e) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;
    if (editingAnnId) {
      await updateAnnouncement(editingAnnId, annTitle.trim(), annContent.trim());
    } else {
      const targetClassId = annClassroomId || (classrooms[0] ? classrooms[0].id : null);
      if (!targetClassId) return;
      await addAnnouncement(targetClassId, annTitle.trim(), annContent.trim());
    }
    setShowAddAnnModal(false);
    setEditingAnnId(null);
    setAnnTitle('');
    setAnnContent('');
  };

  // Filter announcements
  const filteredAnnouncements = announcements.filter(ann => {
    const titleMatch = ann.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const contentMatch = ann.content?.toLowerCase().includes(searchQuery.toLowerCase());
    const clsNameMatch = (ann.classroomName || ann.classroom_name || '')
      .toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSearch = titleMatch || contentMatch || clsNameMatch;

    const annClassId = String(ann.classroom_id || ann.classroomId);
    const matchesClass = selectedClass === 'all' || annClassId === String(selectedClass);
    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-6">
      
      {/* Error Alert Banner */}
      {error && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-700 font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Announcements</h1>
          <p className="text-xs text-slate-500 mt-1">Review announcements, scheduling updates, and exam rosters.</p>
        </div>

        {userRole === 'faculty' && (
          <button
            onClick={handleAddClick}
            className="cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-full bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Announcement
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search title, content, or classroom..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-4 text-xs text-slate-800 outline-hidden transition-all focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-700 outline-hidden focus:bg-white focus:border-indigo-500 transition-colors w-full sm:w-auto"
          >
            <option value="all">All Course Boards</option>
            {classrooms.map(c => (
              <option key={c.id} value={c.id}>{c.subject}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Announcements Stream List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6 space-y-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-slate-200"></div>
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 w-48 rounded-md bg-slate-200"></div>
                  <div className="h-2.5 w-32 rounded-md bg-slate-200"></div>
                </div>
              </div>
              <div className="h-12 w-full rounded-md bg-slate-100"></div>
            </div>
          ))}
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-xs">
          <Megaphone className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <h4 className="text-sm font-bold text-slate-700">No announcements posted</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            {searchQuery || selectedClass !== 'all' 
              ? 'No announcements match your search filters.' 
              : 'Class notices, schedule tweaks, and exam dates will appear here once published by faculty.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map((ann) => (
            <div 
              key={ann.id} 
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs hover:border-indigo-100 hover:shadow-indigo-50/30 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                    <Megaphone className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 leading-tight">{ann.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                        {ann.classroomName || ann.classroom_name || 'General'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        Posted by {ann.author || ann.author_name || 'Faculty'} • {ann.date || (ann.created_at ? new Date(ann.created_at).toLocaleDateString() : '')}
                      </span>
                    </div>
                  </div>
                </div>

                {userRole === 'faculty' && (
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleEditAnnClick(ann)}
                      className="cursor-pointer text-slate-400 hover:text-indigo-600 transition-colors p-1.5" 
                      title="Edit Announcement"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
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
                  </div>
                )}
              </div>

              <p className="mt-4 text-xs text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">
                {ann.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* FACULTY: ADD / EDIT ANNOUNCEMENT MODAL */}
      {showAddAnnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <h3 className="text-base font-bold text-slate-800">{editingAnnId ? 'Edit Announcement' : 'Add Announcement'}</h3>
            <p className="text-xs text-slate-500 mt-1">{editingAnnId ? 'Update announcement content.' : 'Post a new announcement to the course board for students to read.'}</p>
            
            <form onSubmit={handleAddAnnSubmit} className="mt-4 space-y-4">
              {!editingAnnId && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Select Classroom Board :</label>
                  <select
                    value={annClassroomId}
                    onChange={(e) => setAnnClassroomId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-xs text-slate-800 outline-hidden focus:bg-white focus:border-indigo-500 transition-colors"
                  >
                    {classrooms.length === 0 ? (
                      <option value="">No classrooms available</option>
                    ) : (
                      classrooms.map(c => (
                        <option key={c.id} value={c.id}>{c.subject}</option>
                      ))
                    )}
                  </select>
                </div>
              )}

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
                  placeholder="Type announcement details..."
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  rows="4"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-xs text-slate-800 outline-hidden focus:bg-white focus:border-indigo-500 transition-colors resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddAnnModal(false);
                    setEditingAnnId(null);
                    setAnnTitle('');
                    setAnnContent('');
                  }}
                  className="cursor-pointer rounded-xl px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cursor-pointer rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition-colors"
                >
                  {editingAnnId ? 'Save Changes' : 'Publish Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
