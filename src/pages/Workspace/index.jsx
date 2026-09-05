import React, { useState } from 'react';
import { useUser } from '../../components/common/UserContext';
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
  Eye,
  AlertCircle
} from 'lucide-react';
import DocumentViewer from '../../components/common/DocumentViewer';

export default function Workspace() {
  const { 
    myUploads, 
    myNotes, 
    isLoading,
    error,
    uploadPrivateDoc, 
    deletePrivateDoc,
    addNote,
    updateNote,
    deleteNote
  } = useUser();

  // Tab State: 'uploads' or 'notes'
  const [activeTab, setActiveTab] = useState('uploads'); 

  // Upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [docTitle, setDocTitle] = useState('');

  // Notes state
  const [selectedNoteId, setSelectedNoteId] = useState(myNotes[0]?.id || null);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  
  // Note Form State
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  // Document Viewer state
  const [viewingFile, setViewingFile] = useState(null);

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
    if (['doc', 'docx'].includes(ext)) return 'DOCX';
    if (['txt'].includes(ext)) return 'TXT';
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) return 'IMAGE';
    return 'PDF';
  };

  const getFileSizeString = (file) => {
    if (!file) return '0 KB';
    if (file.size > 1024 * 1024) {
      return (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    }
    return (file.size / 1024).toFixed(0) + ' KB';
  };

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!docTitle.trim() || !selectedFile) return;
    
    const calculatedType = getFileType(selectedFile);
    const calculatedSize = getFileSizeString(selectedFile);

    uploadPrivateDoc(docTitle, calculatedType, calculatedSize, selectedFile);
    
    setShowUploadModal(false);
    setDocTitle('');
    setSelectedFile(null);
  };

  // Notes Action Handlers
  const selectedNote = myNotes.find(n => n.id === selectedNoteId);

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
    setNoteContent(selectedNote.content);
  };

  const handleSaveNote = (e) => {
    e.preventDefault();
    if (isCreatingNote) {
      addNote(noteTitle, noteContent);
      setIsCreatingNote(false);
      if (myNotes.length > 0) {
        setSelectedNoteId(myNotes[0].id);
      }
    } else if (isEditingNote && selectedNoteId) {
      updateNote(selectedNoteId, noteTitle, noteContent);
      setIsEditingNote(false);
    }
  };

  const handleDeleteNoteClick = (id) => {
    if (window.confirm("Are you sure you want to delete this personal note? This action cannot be undone.")) {
      deleteNote(id);
      const remaining = myNotes.filter(n => n.id !== id);
      if (remaining.length > 0) {
        setSelectedNoteId(remaining[0].id);
      } else {
        setSelectedNoteId(null);
      }
      setIsEditingNote(false);
      setIsCreatingNote(false);
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
          <p className="text-xs text-slate-500 mt-1">Your secure document drawer and notebook. Visible only to you.</p>
        </div>

        {activeTab === 'uploads' && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-full bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" /> Upload File
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
            My Uploads
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
            My Notes
          </button>
        </nav>
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
            ) : myUploads.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-xs">
                <FolderUp className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <h4 className="text-sm font-bold text-slate-700">No private documents uploaded</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">Upload drafts, slides, or pictures. Visible strictly to you.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-xs font-semibold">
                    <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4">File Name</th>
                        <th className="px-6 py-4">Type</th>
                        <th className="px-6 py-4">Uploaded Date</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {myUploads.map((doc) => (
                        <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-black text-[9px] ${
                                doc.type === 'PDF' ? 'bg-red-50 text-red-600' :
                                doc.type === 'PPT' ? 'bg-orange-50 text-orange-600' :
                                doc.type === 'TXT' ? 'bg-slate-100 text-slate-600' :
                                doc.type === 'IMAGE' ? 'bg-emerald-50 text-emerald-600' :
                                'bg-blue-50 text-blue-600'
                              }`}>
                                {doc.type}
                              </div>
                              <div>
                                <button
                                  onClick={() => setViewingFile(doc)}
                                  className="text-left text-slate-800 font-bold block hover:text-indigo-600 hover:underline cursor-pointer"
                                >
                                  {doc.title}
                                </button>
                                <span className="text-[10px] text-slate-400 font-semibold">{doc.size} • Private</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-500">{doc.type}</td>
                          <td className="px-6 py-4 text-slate-500">{doc.uploadedDate}</td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <button 
                              onClick={() => setViewingFile(doc)}
                              className="cursor-pointer inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-colors" 
                              title="View Document"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="cursor-pointer inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-colors" title="Download Document">
                              <Download className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => {
                                if (window.confirm("Are you sure you want to delete this private file? This action cannot be undone.")) {
                                  deletePrivateDoc(doc.id);
                                }
                              }}
                              className="cursor-pointer inline-flex items-center justify-center p-1.5 rounded-lg border border-rose-100 text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors" 
                              title="Delete Document"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
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
            <div className="md:col-span-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between h-[450px]">
              <div className="flex-1 overflow-y-auto space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Personal Notes</h3>
                  <button 
                    onClick={startCreateNote}
                    className="cursor-pointer p-1.5 rounded-lg border border-slate-100 hover:bg-slate-50 text-indigo-600 transition-colors"
                    title="Add Note"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {myNotes.length === 0 ? (
                  <div className="text-center p-6 border border-dashed border-slate-200 rounded-2xl">
                    <p className="text-xs font-bold text-slate-600">No notes created yet</p>
                    <p className="text-[10px] text-slate-400 mt-1">Create personal study notes or teaching outlines.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {myNotes.map((note) => (
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
            <div className="md:col-span-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs min-h-[450px] flex flex-col">
              
              {/* CREATING OR EDITING STATE */}
              {(isCreatingNote || isEditingNote) ? (
                <form onSubmit={handleSaveNote} className="flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-sm font-bold text-slate-800">
                        {isCreatingNote ? 'Create New Note' : 'Edit Note Details'}
                      </h3>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Drafting note
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Note Title :</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Exam Study Log"
                          value={noteTitle}
                          onChange={(e) => setNoteTitle(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-xs text-slate-800 outline-hidden focus:bg-white focus:border-indigo-500 transition-colors font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Write Details :</label>
                        <textarea
                          placeholder="Type notes content..."
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
                      <Save className="h-4 w-4" /> Save Note
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
                        <span className="text-[10px] font-semibold text-slate-400 mt-1 block">Created on {selectedNote.date} • Private</span>
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

                    <p className="text-xs text-slate-700 leading-relaxed font-semibold whitespace-pre-wrap max-h-[300px] overflow-y-auto bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                      {selectedNote.content || <span className="italic text-slate-400">Empty note contents. Click Edit to add details.</span>}
                    </p>
                  </div>

                  <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-[11px] font-bold text-indigo-400">
                    <span className="flex items-center gap-1 font-semibold uppercase tracking-wider">
                      <CornerDownRight className="h-3.5 w-3.5 text-indigo-500" /> Acadrium Workspace Safe
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
            <p className="text-xs text-slate-500 mt-1">This file will be stored in your private repository and is not shared.</p>
            
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
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.webp"
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
                  placeholder="Document Title (Auto-populated from file name)"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-xs text-slate-800 outline-hidden focus:bg-white focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setDocTitle('');
                    setSelectedFile(null);
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

      {/* DOCUMENT VIEWER OVERLAY */}
      {viewingFile && (
        <DocumentViewer file={viewingFile} onClose={() => setViewingFile(null)} />
      )}

    </div>
  );
}
