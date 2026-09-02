import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '../common/UserContext';
import { Search, BookOpen, FileText, FolderHeart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Header() {
  const { 
    userRole, 
    setUserRole, 
    currentUser,
    classrooms,
    resources,
    myUploads
  } = useUser();
  const navigate = useNavigate();
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

  // Search logic across categories (excluding bookmarks)
  const searchResults = {
    classrooms: classrooms.filter(c => 
      c.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.courseCode.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 3),
    resources: resources.filter(r => 
      r.title.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 3),
    myUploads: (myUploads || []).filter(u => 
      u.title.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 3)
  };

  const hasResults = searchQuery.trim().length > 0 && (
    searchResults.classrooms.length > 0 ||
    searchResults.resources.length > 0 ||
    searchResults.myUploads.length > 0
  );

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
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-4 text-xs text-slate-805 outline-hidden transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* SEARCH OVERLAY DROPDOWN */}
        {showSearchDropdown && searchQuery.trim().length > 0 && (
          <div className="absolute left-0 right-0 mt-2 max-h-96 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 shadow-xl z-50">
            {!hasResults ? (
              <p className="text-xs text-slate-400 p-2 text-center">No matches found</p>
            ) : (
              <div className="space-y-3 text-left">
                {/* Classrooms */}
                {searchResults.classrooms.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-1">Classrooms</h4>
                    {searchResults.classrooms.map(c => (
                      <button
                        key={c.id}
                        onClick={() => {
                          navigate(`/classrooms/${c.id}`);
                          setSearchQuery('');
                          setShowSearchDropdown(false);
                        }}
                        className="cursor-pointer flex items-center gap-2 w-full rounded-lg px-2 py-1.5 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                      >
                        <BookOpen className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                        <span className="truncate font-bold">{c.subject}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Shared Resources */}
                {searchResults.resources.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-1">Classroom Resources</h4>
                    {searchResults.resources.map(r => (
                      <button
                        key={r.id}
                        onClick={() => {
                          navigate('/resources');
                          setSearchQuery('');
                          setShowSearchDropdown(false);
                        }}
                        className="cursor-pointer flex items-center gap-2 w-full rounded-lg px-2 py-1.5 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                      >
                        <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate font-medium">{r.title}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Workspace Uploads */}
                {searchResults.myUploads.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-1">My Uploads (Private)</h4>
                    {searchResults.myUploads.map(u => (
                      <button
                        key={u.id}
                        onClick={() => {
                          navigate('/workspace');
                          setSearchQuery('');
                          setShowSearchDropdown(false);
                        }}
                        className="cursor-pointer flex items-center gap-2 w-full rounded-lg px-2 py-1.5 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                      >
                        <FolderHeart className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate font-medium">{u.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right side options */}
      <div className="flex items-center gap-3 md:gap-6">
        
        {/* INTERACTIVE DEMO ROLE SWITCHER (FIXED) */}
        <div className="flex items-center gap-2 rounded-full bg-indigo-50 p-1 pr-3 border border-indigo-100 shadow-2xs">
          <button
            onClick={() => {
              if (userRole !== 'faculty') setUserRole('faculty');
            }}
            className={`cursor-pointer rounded-full px-3 py-1 text-xs font-bold transition-all shadow-xs ${
              userRole === 'faculty' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white text-indigo-700 hover:bg-slate-50'
            }`}
          >
            Faculty
          </button>
          <button
            onClick={() => {
              if (userRole !== 'student') setUserRole('student');
            }}
            className={`cursor-pointer rounded-full px-3 py-1 text-xs font-bold transition-all shadow-xs ${
              userRole === 'student' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white text-indigo-700 hover:bg-slate-50'
            }`}
          >
            Student
          </button>
          <span className="hidden lg:inline text-[10px] uppercase tracking-wider text-indigo-400 font-bold">
            Demo Control
          </span>
        </div>

        {/* Vertical divider */}
        <div className="h-6 w-px bg-slate-200"></div>

        {/* User profile details */}
        <Link to="/profile" className="flex items-center gap-3 hover:opacity-85 transition-opacity">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="h-9 w-9 rounded-full object-cover border border-indigo-200 ring-2 ring-indigo-50"
          />
          <div className="hidden text-left md:block">
            <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[100px]">{currentUser.name}</p>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{userRole}</p>
          </div>
        </Link>
      </div>
    </header>
  );
}
