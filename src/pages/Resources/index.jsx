import React, { useState, useEffect } from 'react';
import { useUser } from '../../components/common/UserContext';
import * as api from '../../services/api';
import { FileText, Search, Filter, Download, Trash2, Plus, Sparkles, CheckCircle2, AlertCircle, Eye } from 'lucide-react';
import DocumentViewer from '../../components/common/DocumentViewer';

export default function Resources() {
  const { 
    userRole, 
    resources, 
    classrooms, 
    isLoading,
    error,
    showToast,
    loadResources,
    fetchClassrooms,
    uploadResource,
    deleteResource
  } = useUser();

  useEffect(() => {
    loadResources();
    fetchClassrooms();
  }, []);

  const [previewFile, setPreviewFile] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [semanticResults, setSemanticResults] = useState(null);
  const [isSearchingSemantic, setIsSearchingSemantic] = useState(false);

  // Debounced vector semantic search API call
  useEffect(() => {
    if (!searchQuery || !searchQuery.trim()) {
      setSemanticResults(null);
      setIsSearchingSemantic(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingSemantic(true);
      const res = await api.searchResourcesSemantic(searchQuery.trim());
      if (res && res.success && Array.isArray(res.data)) {
        setSemanticResults(res.data);
      } else {
        setSemanticResults(null);
      }
      setIsSearchingSemantic(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Modal State
  const [showAddResModal, setShowAddResModal] = useState(false);
  const [resTitle, setResTitle] = useState('');
  const [resTags, setResTags] = useState('');
  const [resClassroomId, setResClassroomId] = useState(classrooms[0]?.id || '');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [resDescription, setResDescription] = useState('');

  // Update default target classroom when classrooms array changes
  useEffect(() => {
    if (classrooms.length > 0 && !resClassroomId) {
      setResClassroomId(classrooms[0].id);
    }
  }, [classrooms]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (!resTitle.trim()) {
        setResTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const getFileType = (file) => {
    if (!file) return 'PDF';
    const ext = file.name.split('.').pop().toLowerCase();
    if (['ppt', 'pptx'].includes(ext)) return 'PPT';
    if (['doc', 'docx'].includes(ext)) return 'DOCX';
    if (['txt'].includes(ext)) return 'TXT';
    if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) return 'IMAGE';
    return 'PDF';
  };

  const getFileSizeString = (input) => {
    if (!input && input !== 0) return '0 KB';

    if (typeof input === 'object' && input !== null) {
      if (input.file_size !== undefined) {
        input = input.file_size;
      } else if (input.size !== undefined) {
        input = input.size;
      }
    }

    if (typeof input === 'string') {
      const trimmed = input.trim();
      if (trimmed.includes('KB') || trimmed.includes('MB') || trimmed.includes('GB') || trimmed.includes('B')) {
        return trimmed;
      }
      const parsed = parseFloat(trimmed);
      if (!isNaN(parsed) && parsed > 0) {
        input = parsed;
      } else {
        return '0 KB';
      }
    }

    if (typeof input === 'number' && input > 0) {
      if (input >= 1024 * 1024) {
        return (input / (1024 * 1024)).toFixed(1) + ' MB';
      }
      return (input / 1024).toFixed(0) + ' KB';
    }

    return '0 KB';
  };

  const handleAddResSubmit = async (e) => {
    e.preventDefault();
    if (!resTitle.trim() || !selectedFile || !resClassroomId) {
      showToast('Please select a file, target classroom, and enter a title.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('classroom_id', resClassroomId);
    formData.append('title', resTitle.trim());
    if (resDescription.trim()) formData.append('description', resDescription.trim());
    if (resTags.trim()) formData.append('tags', resTags.trim());

    const result = await uploadResource(formData);
    if (result && result.success) {
      setUploadSuccess('File uploaded successfully!');
      setTimeout(() => {
        setShowAddResModal(false);
        setResTitle('');
        setResTags('');
        setSelectedFile(null);
        setResDescription('');
        setUploadSuccess('');
      }, 1200);
    }
  };

  const handleDownload = async (resource) => {
    try {
      const filename = resource.original_filename || resource.title || 'downloaded-file';
      await api.downloadResource(resource.id, filename);
    } catch (err) {
      showToast(err.message || 'Failed to download resource file.', 'error');
    }
  };

  // Filter resources (either from vector semantic search API or fallback list filter)
  const baseList = semanticResults !== null ? semanticResults : resources;

  const filteredResources = baseList.filter(res => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = semanticResults !== null ? true : (
      (res.title || '').toLowerCase().includes(query) || 
      (res.original_filename || '').toLowerCase().includes(query) ||
      (res.tags || '').toLowerCase().includes(query) ||
      (res.classroom_name || res.classroomName || '').toLowerCase().includes(query)
    );
    const matchesClass = selectedClass === 'all' || strEquals(res.classroom_id || res.classroomId, selectedClass);
    const matchesType = selectedType === 'all' || (res.file_type || res.type) === selectedType;
    return matchesSearch && matchesClass && matchesType;
  });

  function strEquals(a, b) {
    return String(a || '').toLowerCase() === String(b || '').toLowerCase();
  }

  return (
    <div className="space-y-6">
      
      {/* Error Alert Banner */}
      {error && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-700 font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Resources</h1>
          <p className="text-xs text-slate-500 mt-1">Shared classroom materials uploaded by faculty. Powered by PGVector Semantic Search.</p>
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
        {/* Semantic Search Bar */}
        <div className="relative w-full md:max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-indigo-500">
            {isSearchingSemantic ? <Sparkles className="h-4 w-4 animate-spin text-indigo-600" /> : <Search className="h-4 w-4 text-indigo-500" />}
          </span>
          <input
            type="text"
            placeholder="Vector Semantic Search (e.g. DBMS normalization, java concepts)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-indigo-200 bg-indigo-50/20 py-2.5 pl-9 pr-4 text-xs font-semibold text-slate-800 outline-hidden transition-all focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500"
          />
          {semanticResults !== null && (
            <span className="absolute right-3 top-2.5 text-[9px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
              PGVector Active
            </span>
          )}
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
            <option value="IMAGE">Images</option>
          </select>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading || isSearchingSemantic ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-3 shadow-xs">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse h-12 bg-slate-100 rounded-2xl"></div>
          ))}
        </div>
      ) : filteredResources.length === 0 ? (
        /* Empty State */
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-xs">
          <FileText className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <h4 className="text-sm font-bold text-slate-700">No matching resources found</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            {searchQuery || selectedClass !== 'all' || selectedType !== 'all' 
              ? 'No resources matched your semantic vector query or filters.' 
              : 'Shared classroom materials will appear here once uploaded by faculty.'}
          </p>
        </div>
      ) : (
        /* Resources Table Container */
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs font-semibold">
              <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Resource Details</th>
                  <th className="px-6 py-4">Classroom</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Uploaded Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredResources.map((res) => {
                  const typeTag = (res.file_type || res.type || 'PDF').toUpperCase();
                  const uploader = res.uploader_name || res.uploadedBy || 'Faculty';
                  const classroomName = res.classroom_name || res.classroomName || 'Classroom';
                  const createdDate = res.created_at ? new Date(res.created_at).toLocaleDateString() : (res.uploadedDate || 'N/A');
                  const formattedSize = getFileSizeString(res.file_size || res.size);

                  const statusVal = (res.processing_status || res.extraction_status || 'COMPLETED').toUpperCase();
                  const isProcessing = statusVal === 'PENDING' || statusVal === 'PROCESSING';
                  const isFailed = statusVal === 'FAILED';
                  const pageCount = res.page_count || 0;
                  const wordCount = res.word_count || 0;
                  const similarityScore = res.similarity ? Math.round(res.similarity * 100) : null;

                  return (
                    <tr key={res.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-black text-xs ${
                            typeTag === 'PDF' ? 'bg-red-50 text-red-600' :
                            typeTag === 'PPT' ? 'bg-orange-50 text-orange-600' :
                            typeTag === 'IMAGE' ? 'bg-emerald-50 text-emerald-600' :
                            'bg-blue-50 text-blue-600'
                          }`}>
                            {typeTag}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleDownload(res)}
                                className="text-left text-slate-800 font-bold block hover:text-indigo-600 hover:underline cursor-pointer"
                              >
                                {res.title}
                              </button>
                              {similarityScore !== null && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[9px] font-extrabold text-indigo-700 border border-indigo-200">
                                  <Sparkles className="h-2.5 w-2.5 text-indigo-600" />
                                  {similarityScore}% Match
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-semibold">
                              {formattedSize} • By {uploader} {pageCount > 0 ? `• ${pageCount} pgs` : ''} {wordCount > 0 ? `• ${wordCount} words` : ''}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-700">
                          {classroomName}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 items-start">
                          {isProcessing ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700 border border-amber-200">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Processing...
                            </span>
                          ) : isFailed ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-bold text-rose-700 border border-rose-200">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                              Failed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Processed
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium">{createdDate}</td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button 
                          onClick={() => setPreviewFile(res)}
                          className="cursor-pointer inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-colors" 
                          title="Preview Resource"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDownload(res)}
                          className="cursor-pointer inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-colors" 
                          title="Download Resource"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        {userRole === 'faculty' && (
                          <button 
                            onClick={() => {
                              if (window.confirm("Are you sure you want to delete this shared course resource? This action cannot be undone.")) {
                                deleteResource(res.id);
                              }
                            }}
                            className="cursor-pointer inline-flex items-center justify-center p-2 rounded-xl border border-rose-100 text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors" 
                            title="Delete Resource"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
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
            <p className="text-xs text-slate-500 mt-1">Select the file and target classroom directory.</p>
            
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
                  {classrooms.length === 0 ? (
                    <option value="">No Classrooms Available</option>
                  ) : (
                    classrooms.map(c => (
                      <option key={c.id} value={c.id}>{c.subject}</option>
                    ))
                  )}
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
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.png,.jpg,.jpeg,.webp"
                  />
                  <label
                    htmlFor="resource-file-input"
                    className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/20 py-4 text-center text-xs font-bold text-indigo-600 hover:bg-indigo-50/50 hover:border-indigo-400 transition-colors"
                  >
                    <Sparkles className="h-4 w-4 text-indigo-500" />
                    {selectedFile ? 'Change Selected File' : 'Choose File / Browse Files'}
                  </label>

                  {selectedFile && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-left space-y-1 text-[11px] font-semibold text-slate-600">
                      <p className="font-bold text-slate-800 truncate">File: {selectedFile.name}</p>
                      <p>Detected Format: <span className="font-bold text-indigo-600">{getFileType(selectedFile)}</span></p>
                      <p>File Size: <span className="font-bold text-indigo-600">{getFileSizeString(selectedFile)}</span></p>
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
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tags (Optional) :</label>
                <input
                  type="text"
                  placeholder="e.g. syllabus, lecture, unit1"
                  value={resTags}
                  onChange={(e) => setResTags(e.target.value)}
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
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      {previewFile && (
        <DocumentViewer file={previewFile} onClose={() => setPreviewFile(null)} />
      )}

    </div>
  );
}
