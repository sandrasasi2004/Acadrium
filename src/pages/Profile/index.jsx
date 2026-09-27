import React, { useState } from 'react';
import { useUser } from '../../components/common/UserContext';
import { Mail, School, BookOpen, Edit2, Sparkles, Key, Camera, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Profile() {
  const { currentUser, userRole, updateProfile } = useUser();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);


  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  const handleOpenEditModal = () => {
    setEditName(currentUser?.full_name || currentUser?.name || '');
    setEditEmail(currentUser?.email || '');
    setEditDept(currentUser?.department && currentUser.department !== 'Not Set' ? currentUser.department : '');
    setEditSem(currentUser?.semester && currentUser.semester !== 'Not Set' ? currentUser.semester : '');
    setEditError('');
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError('');
    setIsSubmittingEdit(true);

    const payload = {
      full_name: editName.trim(),
      email: editEmail.trim(),
      department: editDept.trim() || null,
      ...(userRole === 'student' ? { semester: editSem.trim() || null } : {})
    };

    const res = await updateProfile(payload);
    setIsSubmittingEdit(false);

    if (res.success) {
      setShowEditModal(false);
    } else {
      setEditError(res.error || 'Failed to update profile details.');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordStatus('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    setIsSubmittingPassword(true);
    const res = await updateProfile({ password: newPassword });
    setIsSubmittingPassword(false);

    if (res.success) {
      setPasswordStatus('Password updated successfully!');
      setTimeout(() => {
        setShowPasswordModal(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordStatus('');
      }, 1500);
    } else {
      setPasswordError(res.error || 'Failed to update password.');
    }
  };

  const userDisplayName = currentUser?.full_name || currentUser?.name || 'Acadrium User';
  const userEmail = currentUser?.email || 'Not Set';
  const userDept = currentUser?.department && currentUser.department !== 'Not Set' ? currentUser.department : 'Not Set';
  const userSem = currentUser?.semester && currentUser.semester !== 'Not Set' ? currentUser.semester : 'Not Set';
  const userId = currentUser?.id || 'usr_account';

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Page Title */}
      <div>
        <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">My Profile</h1>
        <p className="text-xs text-slate-500 mt-1">Manage your contact details, department, semester, and account security.</p>
      </div>

      {/* Main Profile Info Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-xs relative overflow-hidden">
        
        {/* Background Accent Glow */}
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">


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
                  <p className={`font-bold mt-0.5 ${userDept === 'Not Set' ? 'text-slate-400 italic' : 'text-slate-700'}`}>{userDept}</p>
                </div>
              </div>

              {userRole === 'student' && (
                <div className="flex items-center justify-center sm:justify-start gap-2.5 col-span-1">
                  <BookOpen className="h-4.5 w-4.5 text-indigo-600 shrink-0" />
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Current Semester</p>
                    <p className={`font-bold mt-0.5 ${userSem === 'Not Set' ? 'text-slate-400 italic' : 'text-slate-700'}`}>{userSem}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="pt-4 flex flex-wrap justify-center sm:justify-start gap-3">
              <button
                onClick={handleOpenEditModal}
                className="cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <Edit2 className="h-4 w-4" /> Edit Profile Details
              </button>
              <button
                onClick={() => {
                  setPasswordError('');
                  setPasswordStatus('');
                  setShowPasswordModal(true);
                }}
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
            <p className="text-xs text-slate-500 mt-1">Modify your contact details. Changes persist to database.</p>
            
            {editError && (
              <div className="mt-3 rounded-lg bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-200 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

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
                  placeholder="e.g. Computer Science (leave empty if not set)"
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
                    <option value="">Not Set</option>
                    <option value="Semester I">Semester I</option>
                    <option value="Semester II">Semester II</option>
                    <option value="Semester III">Semester III</option>
                    <option value="Semester IV">Semester IV</option>
                    <option value="Semester V">Semester V</option>
                    <option value="Semester VI">Semester VI</option>
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
                  disabled={isSubmittingEdit}
                  className="cursor-pointer rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {isSubmittingEdit ? 'Saving...' : 'Save Changes'}
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
              <div className="mt-3 rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{passwordStatus}</span>
              </div>
            )}

            {passwordError && (
              <div className="mt-3 rounded-lg bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-200 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">New Password :</label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
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
                  placeholder="Re-enter new password"
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
                  disabled={isSubmittingPassword}
                  className="cursor-pointer rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {isSubmittingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
