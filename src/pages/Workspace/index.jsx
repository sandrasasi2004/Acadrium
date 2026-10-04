import React, { useState, useEffect } from 'react';
import { useUser } from '../../components/common/UserContext';
import * as api from '../../services/api';
import { 
  FolderUp, 
  FileText, 
  Trash2, 
  Plus, 
  Download,
  BookOpen,
  Sparkles,
  Save,
  PenTool,
  CornerDownRight,
  ClipboardList,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye
} from 'lucide-react';
import DocumentViewer from '../../components/common/DocumentViewer';

export default function Workspace() {
  const { 
    workspaceFiles, 
    workspaceNotes, 
    isLoading,
    error,
    showToast,
    loadWorkspaceFiles,
    uploadWorkspaceFile,
    deleteWorkspaceFile,
    loadWorkspaceNotes,
    createWorkspaceNote,
    updateWorkspaceNote,
    deleteWorkspaceNote
  } = useUser();

  useEffect(() => {
    loadWorkspaceFiles();
    loadWorkspaceNotes();
  }, []);

  const [previewFile, setPreviewFile] = useState(null);

  // Tab State: 'uploads' or 'notes'
  const [activeTab, setActiveTab] = useState('uploads'); 

  // Search filter state
  const [searchQuery, setSearchQuery] = useState('');

  // Upload state & modal
  const [selectedFile, setSelectedFile] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docDescription, setDocDescription] = useState('');
  const [docTags, setDocTags] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  // Notes state
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  
  // Note Form State
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  // Set default selected note ID when workspaceNotes populates
  useEffect(() => {
    if (workspaceNotes && workspaceNotes.length > 0 && !selectedNoteId) {
      setSelectedNoteId(workspaceNotes[0].id);
    }
  }, [workspaceNotes, selectedNoteId]);

  // File Upload Handlers
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (!docTitle.trim()) {
        setDocTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const getFileType = (file) => {
    if (!file) return 'PDF';
    const ext = file.name.split('.').pop().toLowerCase();
    if (['ppt', 'pptx'].includes(ext)) return 'PPT';
    if (['doc', 'docx'].includes(ext)) return 'DOC';
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) return 'IMAGE';
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

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!docTitle.trim() || !selectedFile) {
      showToast('Please select a file and enter a title.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', docTitle.trim());
    if (docDescription.trim()) formData.append('description', docDescription.trim());
    if (docTags.trim()) formData.append('tags', docTags.trim());

    const result = await uploadWorkspaceFile(formData);
    if (result && result.success) {
      setUploadSuccess('File uploaded to private workspace!');
      setTimeout(() => {
        setShowUploadModal(false);
        setDocTitle('');
        setDocDescription('');
        setDocTags('');
        setSelectedFile(null);
        setUploadSuccess('');
      }, 1200);
    }
  };

  const handleDownload = async (doc) => {
    try {
      const filename = doc.original_filename || doc.title || 'downloaded-file';
      await api.downloadWorkspaceFile(doc.id, filename);
    } catch (err) {
      showToast(err.message || 'Failed to download file.', 'error');
    }
  };

  // Filter workspace files based on search query
  const filteredFiles = (workspaceFiles || []).filter(file => {
    const q = searchQuery.toLowerCase();
    return (file.title || '').toLowerCase().includes(q) ||
           (file.original_filename || '').toLowerCase().includes(q) ||
           (file.tags || '').toLowerCase().includes(q);
  });

  // Filter workspace notes based on search query
  const filteredNotes = (workspaceNotes || []).filter(note => {
    const q = searchQuery.toLowerCase();
    return (note.title || '').toLowerCase().includes(q) ||
           (note.content || '').toLowerCase().includes(q);
  });

  // Notes Action Handlers (PostgreSQL Backed)
  const selectedNote = (workspaceNotes || []).find(n => n.id === selectedNoteId);

  const startCreateNote = () => {
    setIsCreatingNote(true);
    setIsEditingNote(false);
    setNoteTitle('');
    setNoteContent('');
  };

  const startEditNote = () => {
    if (!selectedNote) return;
    setIsEditingNote(true);
    setIsCreatingNote(false);
    setNoteTitle(selectedNote.title);
    setNoteContent(selectedNote.content || '');
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!noteTitle.trim()) {
      showToast('Please enter a note title.', 'error');
      return;
    }

    if (isCreatingNote) {
      const result = await createWorkspaceNote(noteTitle.trim(), noteContent.trim());
      if (result.success && result.data) {
        setIsCreatingNote(false);
        setSelectedNoteId(result.data.id);
      }
    } else if (isEditingNote && selectedNoteId) {
      const result = await updateWorkspaceNote(selectedNoteId, noteTitle.trim(), noteContent.trim());
      if (result.success) {
        setIsEditingNote(false);
      }
    }
  };

  const handleDeleteNoteClick = async (id) => {
    if (window.confirm("Are you sure you want to delete this personal note? This action cannot be undone.")) {
      const result = await deleteWorkspaceNote(id);
      if (result.success) {
        const remaining = (workspaceNotes || []).filter(n => n.id !== id);
        if (remaining.length > 0) {
          setSelectedNoteId(remaining[0].id);
        } else {
          setSelectedNoteId(null);
        }
        setIsEditingNote(false);
        setIsCreatingNote(false);
      }
    }
  };

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
          <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Private Workspace</h1>
          <p className="text-xs text-slate-500 mt-1">Your secure document drawer and notebook. Stored safely in PostgreSQL.</p>
        </div>

        {activeTab === 'uploads' ? (
          <button
            onClick={() => setShowUploadModal(true)}
            className="cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-full bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" /> Upload File
          </button>
        ) : (
          <button
            onClick={startCreateNote}
            className="cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-full bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" /> Create Note
          </button>
        )}
      </div>

      {/* Tabs Layout */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6 md:space-x-8">
          <button
            onClick={() => setActiveTab('uploads')}
            className={`cursor-pointer group flex items-center gap-2 py-4 px-1 border-b-2 font-bold text-xs uppercase tracking-wider transition-all ${
              activeTab === 'uploads'
                ? 'border-indigo-600 text-indigo-600 font-extrabold'
                : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
            }`}
          >
            <FolderUp className="h-4 w-4" />
            My Uploads ({workspaceFiles.length})
          </button>
          
          <button
            onClick={() => setActiveTab('notes')}
            className={`cursor-pointer group flex items-center gap-2 py-4 px-1 border-b-2 font-bold text-xs uppercase tracking-wider transition-all ${
              activeTab === 'notes'
                ? 'border-indigo-600 text-indigo-600 font-extrabold'
                : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
            }`}
          >
            <FileText className="h-4 w-4" />
            My Notes ({workspaceNotes.length})
          </button>
        </nav>
      </div>

      {/* Search Filter Bar */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-xs">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder={activeTab === 'uploads' ? "Search files by title, tags..." : "Search notes by title, details..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-4 text-xs text-slate-800 outline-hidden transition-all focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Workspace Body Panel */}
      <div className="min-h-[400px]">
        
        {/* MY UPLOADS VIEW */}
        {activeTab === 'uploads' && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-3 shadow-xs">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse h-12 bg-slate-100 rounded-2xl"></div>
                ))}
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-xs">
                <FolderUp className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <h4 className="text-sm font-bold text-slate-700">No private documents found</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  {searchQuery ? 'No workspace files match your search query.' : 'Click "Upload File" to store personal course files.'}
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-xs font-semibold">
                    <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4">File Name</th>
                        <th className="px-6 py-4">Type</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Uploaded Date</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredFiles.map((doc) => {
                        const typeTag = doc.file_type || doc.type || 'PDF';
                        const createdDate = doc.created_at ? new Date(doc.created_at).toLocaleDateString() : (doc.uploadedDate || 'N/A');
                        const formattedSize = getFileSizeString(doc.file_size || doc.size);

                        const statusVal = (doc.processing_status || doc.extraction_status || 'COMPLETED').toUpperCase();
                        const ocrVal = (doc.ocr_status || 'NOT_APPLICABLE').toUpperCase();
                        const isProcessing = statusVal === 'PENDING' || statusVal === 'PROCESSING';
                        const isFailed = statusVal === 'FAILED';
                        const pageCount = doc.page_count || 0;
                        const wordCount = doc.word_count || 0;

                        return (
                          <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-black text-[9px] ${
                                  typeTag === 'PDF' ? 'bg-red-50 text-red-600' :
                                  typeTag === 'PPT' ? 'bg-orange-50 text-orange-600' :
                                  typeTag === 'IMAGE' ? 'bg-emerald-50 text-emerald-600' :
                                  'bg-blue-50 text-blue-600'
                                }`}>
                                  {typeTag}
                                </div>
                                <div>
                                  <button
                                    onClick={() => handleDownload(doc)}
                                    className="text-left text-slate-800 font-bold block hover:text-indigo-600 hover:underline cursor-pointer"
                                  >
                                    {doc.title}
                                  </button>
                                  <span className="text-[10px] text-slate-400 font-semibold">
                                    {formattedSize} • Private {pageCount > 0 ? `• ${pageCount} pgs` : ''} {wordCount > 0 ? `• ${wordCount} words` : ''}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-500">{typeTag}</td>
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
                            <td className="px-6 py-4 text-slate-500">{createdDate}</td>
                            <td className="px-6 py-4 text-right space-x-2">
                              <button 
                                onClick={() => setPreviewFile(doc)}
                                className="cursor-pointer inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-colors" 
                                title="Preview Document"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => handleDownload(doc)}
                                className="cursor-pointer inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-colors" 
                                title="Download Document"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => {
                                  if (window.confirm("Are you sure you want to delete this private workspace file? This action cannot be undone.")) {
                                    deleteWorkspaceFile(doc.id);
                                  }
                                }}
                                className="cursor-pointer inline-flex items-center justify-center p-1.5 rounded-lg border border-rose-100 text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors" 
                                title="Delete Document"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MY NOTES VIEW */}
        {activeTab === 'notes' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Notes List Column */}
            <div className="md:col-span-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between h-[480px]">
              <div className="flex-1 overflow-y-auto space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Personal Notes (PostgreSQL)</h3>
                  <button 
                    onClick={startCreateNote}
                    className="cursor-pointer p-1.5 rounded-lg border border-slate-100 hover:bg-slate-50 text-indigo-600 transition-colors"
                    title="Add Note"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {filteredNotes.length === 0 ? (
                  <div className="text-center p-6 border border-dashed border-slate-200 rounded-2xl">
                    <p className="text-xs font-bold text-slate-600">
                      {searchQuery ? 'No notes match your search' : 'No notes created yet'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {searchQuery ? 'Try adjusting your search terms.' : 'Create personal study notes or teaching outlines.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredNotes.map((note) => (
                      <button
                        key={note.id}
                        onClick={() => {
                          setSelectedNoteId(note.id);
                          setIsEditingNote(false);
                          setIsCreatingNote(false);
                        }}
                        className={`cursor-pointer w-full text-left rounded-2xl p-3 border transition-all ${
                          selectedNoteId === note.id && !isCreatingNote
                            ? 'border-indigo-150 bg-indigo-50/50 shadow-2xs'
                            : 'border-transparent hover:bg-slate-50/70'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <BookOpen className={`h-4 w-4 shrink-0 ${selectedNoteId === note.id && !isCreatingNote ? 'text-indigo-600' : 'text-slate-400'}`} />
                          <span className={`text-xs font-bold truncate block ${selectedNoteId === note.id && !isCreatingNote ? 'text-indigo-900' : 'text-slate-700'}`}>
                            {note.title || 'Untitled Note'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-semibold truncate mt-1 pl-6">
                          {note.content || 'Empty note content...'}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 border-t border-slate-100 pt-3">
                <button 
                  onClick={startCreateNote}
                  className="cursor-pointer flex w-full items-center justify-center gap-1.5 rounded-xl border border-indigo-100 bg-indigo-50/20 py-2.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50/50 transition-all"
                >
                  <Plus className="h-4 w-4" /> Create New Note
                </button>
              </div>
            </div>

            {/* Note Content Editor / Viewer Column */}
            <div className="md:col-span-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs min-h-[480px] flex flex-col">
              
              {/* CREATING OR EDITING STATE */}
              {(isCreatingNote || isEditingNote) ? (
                <form onSubmit={handleSaveNote} className="flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-sm font-bold text-slate-800">
                        {isCreatingNote ? 'Create New Personal Note' : 'Edit Note Details'}
                      </h3>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        PostgreSQL Persistence
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Note Title :</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. PostgreSQL Indexing Guide"
                          value={noteTitle}
                          onChange={(e) => setNoteTitle(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-xs text-slate-800 outline-hidden focus:bg-white focus:border-indigo-500 transition-colors font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Write Details :</label>
                        <textarea
                          placeholder="Type personal notes content..."
                          value={noteContent}
                          onChange={(e) => setNoteContent(e.target.value)}
                          rows="10"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-xs text-slate-800 outline-hidden focus:bg-white focus:border-indigo-500 transition-colors resize-none leading-relaxed font-semibold"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4 flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingNote(false);
                        setIsEditingNote(false);
                      }}
                      className="cursor-pointer rounded-xl px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="cursor-pointer rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-md"
                    >
                      <Save className="h-4 w-4" /> Save
                    </button>
                  </div>
                </form>
              ) : selectedNote ? (
                /* NOTE VIEWER STATE */
                <div className="flex-1 flex flex-col justify-between text-left">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h2 className="text-base font-extrabold text-slate-800 tracking-tight">{selectedNote.title || 'Untitled Note'}</h2>
                        <span className="text-[10px] font-semibold text-slate-400 mt-1 block">Created on {selectedNote.date || 'N/A'} • Private to {selectedNote.owner_name || 'Owner'}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={startEditNote}
                          className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all flex items-center gap-1"
                        >
                          <PenTool className="h-3.5 w-3.5 text-indigo-500" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteNoteClick(selectedNote.id)}
                          className="cursor-pointer rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-100 hover:text-rose-700 transition-all flex items-center gap-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed font-semibold whitespace-pre-wrap max-h-[320px] overflow-y-auto bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                      {selectedNote.content || <span className="italic text-slate-400">Empty note contents. Click Edit to add details.</span>}
                    </p>
                  </div>

                  <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-[11px] font-bold text-indigo-400">
                    <span className="flex items-center gap-1 font-semibold uppercase tracking-wider">
                      <CornerDownRight className="h-3.5 w-3.5 text-indigo-500" /> Acadrium PostgreSQL Protected Note
                    </span>
                  </div>
                </div>
              ) : (
                /* EMPTY STATE */
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <ClipboardList className="h-12 w-12 text-slate-300 mb-3" />
                  <h4 className="text-sm font-bold text-slate-700">No note selected</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                    Select a note from the list, or click **"Create New Note"** to write teaching plans or study summaries.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* PRIVATE FILE UPLOAD MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <h3 className="text-base font-bold text-slate-800">Upload Private File</h3>
            <p className="text-xs text-slate-500 mt-1">This file will be stored in your private repository and is not shared with anyone.</p>

            {uploadSuccess && (
              <div className="mt-3 rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{uploadSuccess}</span>
              </div>
            )}
            
            <form onSubmit={handleUploadSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Browse Private File :</label>
                <div className="flex flex-col gap-2 text-left">
                  <input
                    type="file"
                    required
                    id="workspace-file-input"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg"
                  />
                  <label
                    htmlFor="workspace-file-input"
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
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Document Title :</label>
                <input
                  type="text"
                  required
                  placeholder="Document Title"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-xs text-slate-800 outline-hidden focus:bg-white focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tags (Optional) :</label>
                <input
                  type="text"
                  placeholder="e.g. personal, research, draft"
                  value={docTags}
                  onChange={(e) => setDocTags(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-xs text-slate-800 outline-hidden focus:bg-white focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Optional Description :</label>
                <textarea
                  placeholder="Provide short details about the workspace file..."
                  value={docDescription}
                  onChange={(e) => setDocDescription(e.target.value)}
                  rows="2"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-xs text-slate-800 outline-hidden focus:bg-white focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setDocTitle('');
                    setDocDescription('');
                    setDocTags('');
                    setSelectedFile(null);
                    setUploadSuccess('');
                  }}
                  className="cursor-pointer rounded-xl px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedFile || !docTitle.trim()}
                  className={`rounded-xl px-5 py-2.5 text-xs font-bold text-white transition-colors ${
                    selectedFile && docTitle.trim() ? 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer' : 'bg-slate-300 cursor-not-allowed'
                  }`}
                >
                  Upload File
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
