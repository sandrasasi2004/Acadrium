import React from 'react';
import { useUser } from '../common/UserContext';
import { Link } from 'react-router-dom';

export default function Header() {
  const { 
    userRole, 
    currentUser
  } = useUser();

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-end border-b border-slate-200 bg-white px-4 md:px-8 shadow-xs">
      
      {/* Right side user profile badge */}
      <div className="flex items-center gap-3">
        <Link to="/profile" className="flex items-center gap-3 hover:opacity-85 transition-opacity">
          <div className="text-left">
            <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[150px]">
              {currentUser?.name || currentUser?.full_name || 'Acadrium User'}
            </p>
            <p className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider">
              {userRole || 'Student'}
            </p>
          </div>
        </Link>
      </div>

    </header>
  );
}
