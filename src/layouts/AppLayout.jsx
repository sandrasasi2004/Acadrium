import React, { useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import RightSidebar from '../components/layout/RightSidebar';
import { Menu, Sparkles, X, CheckCircle2 } from 'lucide-react';
import { useUser } from '../components/common/UserContext';

export default function AppLayout({ children, showAiSidebar = true }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aiSidebarOpen, setAiSidebarOpen] = useState(true);
  const { toast } = useUser();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-800 relative">
      
      {/* GLOBAL TOAST ALERTS */}
      {toast && (
        <div className="fixed top-5 right-5 z-55 flex items-center gap-2.5 rounded-2xl bg-white border border-slate-200 px-4 py-3 shadow-xl animate-in fade-in slide-in-from-top-5 duration-300">
          <CheckCircle2 className={`h-4.5 w-4.5 ${
            toast.type === 'error' ? 'text-rose-500' : 'text-emerald-500'
          }`} />
          <span className="text-xs font-bold text-slate-800">{toast.message}</span>
        </div>
      )}

      {/* LEFT SIDEBAR */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* MAIN CONTAINER */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* TOP BAR / HEADER */}
        <div className="flex items-center bg-white border-b border-slate-200">
          {/* Hamburger toggle for Left Sidebar (Visible on mobile/tablet) */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="cursor-pointer px-4 text-slate-500 hover:text-slate-700 lg:hidden"
            title="Open Menu"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Standard Header */}
          <div className="flex-1">
            <Header />
          </div>

          {/* AI Toggle Button for Right Sidebar (Visible on mobile/tablet or conditionally on desktop) */}
          {showAiSidebar && (
            <button
              onClick={() => setAiSidebarOpen(!aiSidebarOpen)}
              className={`cursor-pointer flex h-10 w-10 items-center justify-center mr-4 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:hidden ${
                aiSidebarOpen ? 'bg-indigo-50 text-indigo-600' : ''
              }`}
              title="Toggle AI Companion"
            >
              <Sparkles className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* WORKSPACE CONTENT + RIGHT SIDEBAR */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* MIDDLE SCROLLABLE PAGE AREA */}
          <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>

          {/* RIGHT SIDEBAR (AI CHAT PANEL) */}
          {showAiSidebar && (
            <div className={`fixed inset-y-0 right-0 z-40 w-80 sm:w-96 shadow-2xl lg:shadow-none lg:static lg:block transition-transform duration-300 ${
              aiSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:hidden'
            }`}>
              {/* Close Button on mobile inside Right Sidebar overlay */}
              <div className="absolute top-4 right-4 z-50 lg:hidden">
                <button
                  onClick={() => setAiSidebarOpen(false)}
                  className="cursor-pointer flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <RightSidebar />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
