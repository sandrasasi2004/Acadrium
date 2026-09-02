import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useUser } from '../common/UserContext';
import logo from '../../assets/logo.svg';
import { 
  LayoutDashboard, 
  BookOpen, 
  Megaphone, 
  FileText, 
  Briefcase, 
  User, 
  Sparkles,
  LogOut,
  X
} from 'lucide-react';

export default function Sidebar({ isOpen, setIsOpen }) {
  const { currentUser, userRole } = useUser();
  const navigate = useNavigate();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Classrooms', path: '/classrooms', icon: BookOpen },
    { name: 'Resources', path: '/resources', icon: FileText },
    { name: 'Announcements', path: '/announcements', icon: Megaphone },
    { name: 'Workspace', path: '/workspace', icon: Briefcase },
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'AI Assistant', path: '/ai-assistant', icon: Sparkles },
  ];

  const handleLogout = () => {
    navigate('/login');
    if (setIsOpen) setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:static lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-6">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Acadrium Logo" className="h-8 w-auto object-contain" />
          </div>
          {/* Close button on mobile */}
          <button 
            onClick={() => setIsOpen(false)}
            className="cursor-pointer rounded-md p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
          <img 
            src={currentUser.avatar} 
            alt={currentUser.name} 
            className="h-10 w-10 rounded-full border border-indigo-100 object-cover"
          />
          <div className="overflow-hidden">
            <h3 className="truncate text-sm font-bold text-slate-800 uppercase tracking-tight">{currentUser.name}</h3>
            <p className="text-xs font-medium text-indigo-650 capitalize">{userRole} Account</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen && setIsOpen(false)}
                className={({ isActive }) => `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-indigo-50 text-indigo-700 shadow-2xs font-semibold' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer Logout */}
        <div className="border-t border-slate-100 p-4">
          <button 
            onClick={handleLogout}
            className="cursor-pointer flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
