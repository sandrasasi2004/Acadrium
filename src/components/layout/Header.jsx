import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '../common/UserContext';
import { Search } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Header() {
  const { 
    userRole, 
    currentUser
  } = useUser();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const placeholderText = userRole === 'faculty' 
    ? "Search classrooms, resources, announcements..."
    : "Search classrooms, resources, notes...";

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 md:px-8 shadow-xs">
      
      {/* SEARCH UTILITY */}
      <div className="relative w-full max-w-xs sm:block" ref={dropdownRef}>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder={placeholderText}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchDropdown(true);
            }}
            onFocus={() => setShowSearchDropdown(true)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-4 text-xs text-slate-800 outline-hidden transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* SEARCH OVERLAY DROPDOWN (Backend integration placeholder) */}
        {showSearchDropdown && searchQuery.trim().length > 0 && (
          <div className="absolute left-0 right-0 mt-2 rounded-xl border border-slate-200 bg-white p-4 shadow-xl z-50 text-center">
            <p className="text-xs font-semibold text-slate-600">
              Search will become available after backend integration.
            </p>
          </div>
        )}
      </div>

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
