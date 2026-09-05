import React, { useState } from 'react';
import { useUser } from '../../components/common/UserContext';
import { Mail, School, BookOpen, Edit2, Sparkles, Key, Camera } from 'lucide-react';

export default function Profile() {
  const { currentUser, setCurrentUser, userRole, updateProfileAvatar } = useUser();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  // Edit Form State
  const [editName, setEditName] = useState(currentUser?.name || 'Acadrium User');
  const [editEmail, setEditEmail] = useState(currentUser?.email || 'user@acadrium.edu');
  const [editDept, setEditDept] = useState(currentUser?.department || 'Academic Department');
  const [editSem, setEditSem] = useState(currentUser?.semester || 'Semester II');

  const handleAvatarFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      updateProfileAvatar(url);
    }
  };

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState('');

  const handleEditSubmit = (e) => {
    e.preventDefault();
    setCurrentUser(prev => ({
      ...prev,
      name: editName,
      email: editEmail,
      department: editDept,
      ...(userRole === 'student' ? { semester: editSem } : {})
    }));
    setShowEditModal(false);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordStatus('Passwords do not match');
      return;
    }
    setPasswordStatus('Password updated successfully!');
    setTimeout(() => {
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordStatus('');
    }, 1500);
  };

  const userDisplayName = currentUser?.name || (userRole === 'faculty' ? 'Faculty User' : 'Student User');
  const userEmail = currentUser?.email || 'user@acadrium.edu';
  const userDept = currentUser?.department || 'Academic Department';
  const userId = currentUser?.id || 'usr_account';

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Page Title */}
      <div>
        <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">My Profile</h1>
        <p className="text-xs text-slate-500 mt-1">Manage your account ID, contact details, and institutional alignment.</p>
      </div>

      {/* Main Profile Info Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-xs relative overflow-hidden">
        
        {/* Background Accent Glow */}
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          {/* Avatar frame */}
          <div className="relative group cursor-pointer" title="Edit Profile Picture">
            <input
              type="file"
              id="profile-avatar-input"
              onChange={handleAvatarFileChange}
              accept="image/png, image/jpeg, image/jpg, image/webp"
              className="hidden"
            />
            <label htmlFor="profile-avatar-input" className="cursor-pointer block relative">
              <img 
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                alt={userDisplayName} 
                className="h-28 w-28 rounded-3xl object-cover border border-indigo-150 shadow-md ring-4 ring-indigo-50 group-hover:opacity-75 transition-opacity"
              />
              <span className="absolute inset-0 flex items-center justify-center rounded-3xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-6 w-6 text-white" />
              </span>
              <span className="absolute -bottom-2.5 -right-2.5 flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
                <Sparkles className="h-4 w-4" />
              </span>
            </label>
          </div>

          {/* Identity details */}
          <div className="flex-1 text-center sm:text-left space-y-3">
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h2 className="text-lg font-extrabold text-slate-800 tracking-tight uppercase">{userDisplayName}</h2>
                <span className="rounded-full bg-indigo-600 px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                  {userRole}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-semibold mt-1">Acadrium ID: {userId}</p>
            </div>

            {/* Profile Fields List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-600">
              <div className="flex items-center justify-center sm:justify-start gap-2.5">
                <Mail className="h-4.5 w-4.5 text-indigo-600 shrink-0" />
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Email Address</p>
                  <p className="text-slate-700 font-bold mt-0.5">{userEmail}</p>
                </div>
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-2.5">
                <School className="h-4.5 w-4.5 text-indigo-600 shrink-0" />
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Academic Department</p>
                  <p className="text-slate-700 font-bold mt-0.5">{userDept}</p>
                </div>
              </div>

              {userRole === 'student' && (
                <div className="flex items-center justify-center sm:justify-start gap-2.5 col-span-1">
                  <BookOpen className="h-4.5 w-4.5 text-indigo-600 shrink-0" />
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Current Semester</p>
                    <p className="text-slate-700 font-bold mt-0.5">{currentUser?.semester || 'Semester II'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="pt-4 flex flex-wrap justify-center sm:justify-start gap-3">
              <button
                onClick={() => {
                  setEditName(userDisplayName);
                  setEditEmail(userEmail);
                  setEditDept(userDept);
                  setEditSem(currentUser?.semester || 'Semester II');
                  setShowEditModal(true);
                }}
                className="cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <Edit2 className="h-4 w-4" /> Edit Profile Details
              </button>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <Key className="h-4 w-4" /> Change Password
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* EDIT PROFILE DIALOG */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <h3 className="text-base font-bold text-slate-800">Edit Profile Details</h3>
            <p className="text-xs text-slate-500 mt-1">Modify your contact details. Changes apply immediately.</p>
            
            <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Full Name :</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-xs text-slate-800 outline-hidden focus:bg-white focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Email Address :</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-xs text-slate-800 outline-hidden focus:bg-white focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Department :</label>
                <input
                  type="text"
                  required
                  value={editDept}
                  onChange={(e) => setEditDept(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-xs text-slate-800 outline-hidden focus:bg-white focus:border-indigo-500 transition-colors"
                />
              </div>

              {userRole === 'student' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Semester :</label>
                  <select
                    value={editSem}
                    onChange={(e) => setEditSem(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-xs text-slate-800 outline-hidden focus:bg-white focus:border-indigo-500 transition-colors"
                  >
                    <option value="Semester I">Semester I</option>
                    <option value="Semester II">Semester II</option>
                    <option value="Semester III">Semester III</option>
                    <option value="Semester IV">Semester IV</option>
                  </select>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="cursor-pointer rounded-xl px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cursor-pointer rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD DIALOG */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <h3 className="text-base font-bold text-slate-800">Change Password</h3>
            <p className="text-xs text-slate-500 mt-1">Configure your login credentials.</p>
            
            {passwordStatus && (
              <div className={`mt-3 rounded-lg p-3 text-xs font-semibold ${
                passwordStatus.includes('successfully') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {passwordStatus}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Current Password :</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-xs text-slate-800 outline-hidden focus:bg-white focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">New Password :</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-xs text-slate-800 outline-hidden focus:bg-white focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Confirm New Password :</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-xs text-slate-800 outline-hidden focus:bg-white focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="cursor-pointer rounded-xl px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cursor-pointer rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition-colors"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
