import React, { useEffect } from 'react';
import { useUser } from '../../components/common/UserContext';
import { 
  FileText, 
  Megaphone, 
  ArrowRight, 
  Sparkles, 
  AlertCircle,
  BookOpen,
  Users,
  FolderGit2
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { 
    userRole, 
    classrooms,
    resources, 
    announcements,
    workspaceFiles,
    isLoading,
    error,
    fetchClassrooms
  } = useUser();

  useEffect(() => {
    fetchClassrooms();
  }, []);

  // Get data limits
  const recentResources = resources.slice(0, 3);
  const recentAnnouncements = announcements.slice(0, 3);

  // Calculate statistics from real database arrays
  const totalStudents = classrooms.reduce((acc, c) => acc + (c.student_count || c.studentCount || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Error Alert Banner */}
      {error && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-700 font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="rounded-3xl bg-linear-to-r from-indigo-600 via-indigo-700 to-indigo-800 p-6 md:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-lg">
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/30 px-3 py-1 text-xs font-bold text-indigo-100 uppercase tracking-wider backdrop-blur-xs">
            <Sparkles className="h-3 w-3" /> Acadrium Portal
          </span>
          <h1 className="mt-4 text-2xl md:text-3xl font-extrabold tracking-tight">
            {userRole === 'faculty' ? 'Faculty Dashboard' : 'Student Dashboard'}
          </h1>
          <p className="mt-2 text-sm text-indigo-100/90 leading-relaxed font-medium">
            Welcome to Acadrium. Your academic companion and document management system.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 top-0 hidden w-1/3 bg-radial-gradient from-white/10 to-transparent opacity-70 lg:block pointer-events-none"></div>
        <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-indigo-500/20 blur-xl pointer-events-none"></div>
      </div>

      {/* KPI STATISTICS CARDS (Feature Group 6) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {userRole === 'faculty' ? (
          <>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Classrooms</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <BookOpen className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-800">{classrooms.length}</p>
              <p className="text-[10px] font-semibold text-slate-500">Active Course Sections</p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Course Materials</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <FileText className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-800">{resources.length}</p>
              <p className="text-[10px] font-semibold text-slate-500">Uploaded Resources</p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Announcements</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <Megaphone className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-800">{announcements.length}</p>
              <p className="text-[10px] font-semibold text-slate-500">Published Notices</p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Enrolled Students</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-800">{totalStudents}</p>
              <p className="text-[10px] font-semibold text-slate-500">Active Students</p>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Enrolled Classes</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <BookOpen className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-800">{classrooms.length}</p>
              <p className="text-[10px] font-semibold text-slate-500">Active Enrolled Courses</p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Class Resources</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <FileText className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-800">{resources.length}</p>
              <p className="text-[10px] font-semibold text-slate-500">Available Resources</p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Announcements</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <Megaphone className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-800">{announcements.length}</p>
              <p className="text-[10px] font-semibold text-slate-500">Class Notices</p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Workspace Files</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <FolderGit2 className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-800">{(workspaceFiles || []).length}</p>
              <p className="text-[10px] font-semibold text-slate-500">Private Vault Items</p>
            </div>
          </>
        )}
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

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-200"></div>
                    <div className="space-y-1.5">
                      <div className="h-3 w-32 rounded-md bg-slate-200"></div>
                      <div className="h-2.5 w-24 rounded-md bg-slate-200"></div>
                    </div>
                  </div>
                  <div className="h-2.5 w-12 rounded-md bg-slate-200"></div>
                </div>
              ))}
            </div>
          ) : recentResources.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
              <FileText className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              <p className="text-xs font-bold text-slate-600">No classroom uploads yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Uploaded course materials will appear here once added.</p>
            </div>
          ) : (
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
          )}
        </div>

        {/* Recent Announcements */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Recent Announcements</h3>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Class notices & updates</p>
            </div>
            <Link to="/announcements" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse flex items-start gap-3">
                  <div className="h-4.5 w-4.5 rounded-full bg-slate-200 shrink-0 mt-1"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-3 w-40 rounded-md bg-slate-200"></div>
                    <div className="h-2.5 w-full rounded-md bg-slate-200"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : recentAnnouncements.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
              <Megaphone className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              <p className="text-xs font-bold text-slate-600">No announcements posted yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Class notices will appear here once published by faculty.</p>
            </div>
          ) : (
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
          )}
        </div>
      </div>

    </div>
  );
}

