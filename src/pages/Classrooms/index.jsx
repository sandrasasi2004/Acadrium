import React, { useState } from 'react';
import { useUser } from '../../components/common/UserContext';
import { BookOpen, Users, Plus, ArrowRight, ClipboardList, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Classrooms() {
  const { 
    userRole, 
    classrooms, 
    createClassroom, 
    joinClassroom 
  } = useUser();

  // Dialog State
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joinStatus, setJoinStatus] = useState({ type: '', message: '' });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassSem, setNewClassSem] = useState('Sem II');
  const [newClassDesc, setNewClassDesc] = useState('');

  // Handle student joining classroom
  const handleJoinClass = (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    const result = joinClassroom(inviteCode);
    if (result.success) {
      setJoinStatus({ type: 'success', message: `Successfully joined ${result.subject}!` });
      setInviteCode('');
      setTimeout(() => {
        setShowJoinModal(false);
        setJoinStatus({ type: '', message: '' });
      }, 1500);
    } else {
      setJoinStatus({ type: 'error', message: result.message });
    }
  };

  // Handle faculty creating classroom
  const handleCreateClass = (e) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    createClassroom(newClassName, newClassSem, newClassDesc);
    setShowCreateModal(false);
    setNewClassName('');
    setNewClassDesc('');
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Academic Classrooms</h1>
          <p className="text-xs text-slate-500 mt-1">Manage, join, and browse your course resource directories.</p>
        </div>

        {/* Dynamic Join / Create Button */}
        {userRole === 'faculty' ? (
          <button
            onClick={() => setShowCreateModal(true)}
            className="cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-full bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" /> Create Classroom
          </button>
        ) : (
          <button
            onClick={() => setShowJoinModal(true)}
            className="cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-full bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" /> Join Classroom
          </button>
        )}
      </div>

      {/* Classroom Cards Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {classrooms.map((cls) => (
          <div 
            key={cls.id} 
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:-translate-y-1 hover:border-indigo-300 hover:shadow-indigo-50 hover:shadow-md flex flex-col justify-between group"
          >
            <div>
              {/* Card Icon Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <BookOpen className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-600">
                  {cls.semester}
                </span>
              </div>

              {/* Subject Title & Details */}
              <h3 className="text-sm font-extrabold text-slate-800 tracking-tight group-hover:text-indigo-700 transition-colors line-clamp-1">
                {cls.subject}
              </h3>
              
              <div className="mt-2 space-y-1 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                <p>Course: <span className="text-slate-600 font-bold">{cls.courseCode}</span></p>
                <p>Invite Code: <span className="text-indigo-600 font-mono font-bold select-all">{cls.inviteCode}</span></p>
              </div>

              <p className="mt-3 text-xs text-slate-500 line-clamp-2 leading-relaxed font-medium">
                {cls.description}
              </p>
            </div>

            {/* Card Footer Details */}
            <div className="mt-5 border-t border-slate-100 pt-4 flex items-center justify-between">
              <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                <Users className="h-4 w-4 text-slate-400" />
                {cls.studentCount} Students
              </span>
              <Link
                to={`/classrooms/${cls.id}`}
                className="cursor-pointer inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
              >
                Enter Class <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* STUDENT: JOIN CLASS MODAL */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <h3 className="text-base font-bold text-slate-800">Join Classroom</h3>
            <p className="text-xs text-slate-500 mt-1">Enter the 10-character code provided by your faculty advisor.</p>
            
            {joinStatus.message && (
              <div className={`mt-3 rounded-lg p-3 text-xs font-semibold flex items-center gap-2 ${
                joinStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {joinStatus.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                <span>{joinStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleJoinClass} className="mt-4 space-y-4">
              <input
                type="text"
                required
                placeholder="e.g. a564bfdsaf"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm uppercase font-mono tracking-widest text-slate-800 outline-hidden focus:bg-white focus:border-indigo-500 transition-colors"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowJoinModal(false);
                    setJoinStatus({ type: '', message: '' });
                  }}
                  className="cursor-pointer rounded-xl px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cursor-pointer rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition-colors"
                >
                  Join Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FACULTY: CREATE CLASS MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <h3 className="text-base font-bold text-slate-800">Create Classroom</h3>
            <p className="text-xs text-slate-500 mt-1">Set up a new space for students to access resources.</p>
            
            <form onSubmit={handleCreateClass} className="mt-4 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Subject Name :</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Database Management System"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-xs text-slate-800 outline-hidden focus:bg-white focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Semester :</label>
                  <select
                    value={newClassSem}
                    onChange={(e) => setNewClassSem(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-xs text-slate-800 outline-hidden focus:bg-white focus:border-indigo-500 transition-colors"
                  >
                    <option value="Sem I">Sem I</option>
                    <option value="Sem II">Sem II</option>
                    <option value="Sem III">Sem III</option>
                    <option value="Sem IV">Sem IV</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Description (Optional) :</label>
                <textarea
                  placeholder="Summarize course curriculum details..."
                  value={newClassDesc}
                  onChange={(e) => setNewClassDesc(e.target.value)}
                  rows="3"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-xs text-slate-800 outline-hidden focus:bg-white focus:border-indigo-500 transition-colors resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="cursor-pointer rounded-xl px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cursor-pointer rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition-colors"
                >
                  Create Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
