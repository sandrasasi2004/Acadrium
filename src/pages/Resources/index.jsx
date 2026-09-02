import React, { useState } from 'react';
import { useUser } from '../../components/common/UserContext';
import { FileText, Search, Filter, Download, Trash2, Plus, Sparkles, CheckCircle2, X, Eye } from 'lucide-react';
import DocumentViewer from '../../components/common/DocumentViewer';

export default function Resources() {
  const { 
    userRole, 
    resources, 
    classrooms, 
    addResource,
    deleteResource,
    showToast
  } = useUser();

  const [previewFile, setPreviewFile] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  // Modal State
  const [showAddResModal, setShowAddResModal] = useState(false);
  const [resTitle, setResTitle] = useState('');
  const [resClassroomId, setResClassroomId] = useState(classrooms[0]?.id || '');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [resDescription, setResDescription] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (!resTitle.trim()) {
        setResTitle(file.name.replace(/\.[^/.]+$/, "")); // strip extension
      }
    }
  };

  const getFileType = (file) => {
    if (!file) return 'PDF';
    const ext = file.name.split('.').pop().toLowerCase();
    if (['ppt', 'pptx'].includes(ext)) return 'PPT';
    if (['doc', 'docx'].includes(ext)) return 'DOCX';
    return 'PDF';
  };

  const getFileSizeString = (file) => {
    if (!file) return '0 KB';
    if (file.size > 1024 * 1024) {
      return (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    }
    return (file.size / 1024).toFixed(0) + ' KB';
  };

  // Handle resource submit
  const handleAddResSubmit = (e) => {
    e.preventDefault();
    if (!resTitle.trim() || !selectedFile) return;

    const calculatedType = getFileType(selectedFile);
    const calculatedSize = getFileSizeString(selectedFile);

    addResource(resClassroomId, resTitle, calculatedType, calculatedSize, selectedFile);
    
    setUploadSuccess('File uploaded successfully!');
    setTimeout(() => {
      setShowAddResModal(false);
      setResTitle('');
      setSelectedFile(null);
      setResDescription('');
      setUploadSuccess('');
    }, 1500);
  };

  // Filter resources based on user criteria
  const filteredResources = resources.filter(res => {
    const matchesSearch = res.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          res.classroomName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = selectedClass === 'all' || res.classroomId === selectedClass;
    const matchesType = selectedType === 'all' || res.type === selectedType;
    return matchesSearch && matchesClass && matchesType;
  });

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Resources</h1>
          <p className="text-xs text-slate-500 mt-1">Shared classroom materials uploaded by faculty.</p>
        </div>

        {userRole === 'faculty' && (
          <button
            onClick={() => setShowAddResModal(true)}
            className="cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-full bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Resource
          </button>
        )}
      </div>

      {/* Filter Options Bar */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search by title, subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-4 text-xs text-slate-800 outline-hidden transition-all focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Categories Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-700 outline-hidden focus:bg-white focus:border-indigo-500 transition-colors w-full sm:w-auto"
            >
              <option value="all">All Classrooms</option>
              {classrooms.map(c => (
                <option key={c.id} value={c.id}>{c.subject}</option>
              ))}
            </select>
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-700 outline-hidden focus:bg-white focus:border-indigo-500 transition-colors w-full sm:w-auto"
          >
            <option value="all">All File Types</option>
            <option value="PDF">PDF Documents</option>
            <option value="PPT">PowerPoint Slides</option>
            <option value="DOCX">Word Documents</option>
          </select>
        </div>
      </div>

      {/* Resources Table Container */}
      {filteredResources.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-xs">
          <FileText className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <h4 className="text-sm font-bold text-slate-700">No resources match your filters</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">Try typing a different name, selecting a different class, or resetting your filter fields.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs font-semibold">
              <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Resource Details</th>
                  <th className="px-6 py-4">Classroom</th>
                  <th className="px-6 py-4">Uploaded Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredResources.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-black text-xs ${
                          res.type === 'PDF' ? 'bg-red-50 text-red-600' :
                          res.type === 'PPT' ? 'bg-orange-50 text-orange-600' :
                          'bg-blue-50 text-blue-600'
                        }`}>
                          {res.type}
                        </div>
                        <div>
                          <button
                            onClick={() => setPreviewFile(res)}
                            className="text-left text-slate-800 font-bold block hover:text-indigo-650 hover:underline cursor-pointer"
                          >
                            {res.title}
                          </button>
                          <span className="text-[10px] text-slate-400 font-semibold">{res.size || '2.0 MB'} • By {res.uploadedBy}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-700">
                        {res.classroomName}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium">{res.uploadedDate}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={() => setPreviewFile(res)}
                        className="cursor-pointer inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-colors" 
                        title="View Document"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="cursor-pointer inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-colors" title="Download Resource">
                        <Download className="h-4 w-4" />
                      </button>
                      {userRole === 'faculty' && (
                        <button 
                          onClick={() => {
                            if (window.confirm("Are you sure you want to delete this shared course resource? This action cannot be undone.")) {
                              deleteResource(res.id);
                            }
                          }}
                          className="cursor-pointer inline-flex items-center justify-center p-2 rounded-xl border border-rose-105 border-rose-100 text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors" 
                          title="Delete Resource"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD RESOURCE MODAL */}
      {showAddResModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <h3 className="text-base font-bold text-slate-800">Add Resource File</h3>
            <p className="text-xs text-slate-500 mt-1">Provide a mock title and select the classroom directory.</p>
            
            {uploadSuccess && (
              <div className="mt-3 rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{uploadSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAddResSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Classroom Subject :</label>
                <select
                  value={resClassroomId}
                  onChange={(e) => setResClassroomId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-xs text-slate-800 outline-hidden focus:bg-white focus:border-indigo-500 transition-colors"
                >
                  {classrooms.map(c => (
                    <option key={c.id} value={c.id}>{c.subject}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Browse File :</label>
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    required
                    id="resource-file-input"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                  />
                  <label
                    htmlFor="resource-file-input"
                    className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/20 py-4 text-center text-xs font-bold text-indigo-650 hover:bg-indigo-50/50 hover:border-indigo-400 transition-colors"
                  >
                    <Sparkles className="h-4 w-4 text-indigo-500" />
                    {selectedFile ? 'Change Selected File' : 'Choose File / Browse Files'}
                  </label>

                  {selectedFile && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-left space-y-1 text-[11px] font-semibold text-slate-650">
                      <p className="font-bold text-slate-850 truncate">File: {selectedFile.name}</p>
                      <p>Detected Format: <span className="font-bold text-indigo-650">{getFileType(selectedFile)}</span></p>
                      <p>File Size: <span className="font-bold text-indigo-650">{getFileSizeString(selectedFile)}</span></p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Document Title :</label>
                <input
                  type="text"
                  required
                  placeholder="Document Title (Auto-populated from file name)"
                  value={resTitle}
                  onChange={(e) => setResTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-xs text-slate-800 outline-hidden focus:bg-white focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Optional Description :</label>
                <textarea
                  placeholder="Provide short details about the resource..."
                  value={resDescription}
                  onChange={(e) => setResDescription(e.target.value)}
                  rows="2"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-xs text-slate-800 outline-hidden focus:bg-white focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddResModal(false);
                    setResTitle('');
                    setSelectedFile(null);
                    setResDescription('');
                    setUploadSuccess('');
                  }}
                  className="cursor-pointer rounded-xl px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedFile || !resTitle.trim()}
                  className={`rounded-xl px-5 py-2.5 text-xs font-bold text-white transition-colors ${
                    selectedFile && resTitle.trim() ? 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer' : 'bg-slate-300 cursor-not-allowed'
                  }`}
                >
                  Add Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}      {/* DOCUMENT PREVIEW MODAL */}
      {previewFile && (
        <DocumentViewer file={previewFile} onClose={() => setPreviewFile(null)} />
      )}

    </div>
  );
}
