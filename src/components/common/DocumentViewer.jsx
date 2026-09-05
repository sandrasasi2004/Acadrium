import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  ChevronLeft, 
  ChevronRight,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { useUser } from './UserContext';

export default function DocumentViewer({ file, onClose }) {
  const { showToast } = useUser();
  const [zoom, setZoom] = useState(1.0);
  const [currentPage, setCurrentPage] = useState(1);
  const [realFileUrl, setRealFileUrl] = useState(null);
  const [textContent, setTextContent] = useState('');

  const ext = file?.title?.split('.').pop().toLowerCase() || '';
  const isImage = file?.type === 'IMAGE' || ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext);
  const isText = file?.type === 'TXT' || ext === 'txt';
  const isPdf = file?.type === 'PDF' || ext === 'pdf';
  const isPpt = file?.type === 'PPT' || ['ppt', 'pptx'].includes(ext);
  const isWord = file?.type === 'DOCX' || ['doc', 'docx'].includes(ext);

  // Set total pages dynamically based on format
  const totalPages = isPdf ? 5 : isPpt ? 8 : 1;

  useEffect(() => {
    if (file && file.fileObj) {
      if (isImage) {
        const url = URL.createObjectURL(file.fileObj);
        setRealFileUrl(url);
        return () => URL.revokeObjectURL(url);
      } else if (isText) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setTextContent(e.target.result);
        };
        reader.readAsText(file.fileObj);
      }
    }
  }, [file, isImage, isText]);

  if (!file) return null;

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleFitScreen = () => setZoom(1.0);

  // Pagination controls
  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };
  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  const triggerDownload = () => {
    showToast(`Downloading: ${file.title}`, 'success');
  };

  // Phase 4 placeholder notice for preview
  const renderDocumentContent = () => {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center my-8">
        <FileText className="h-16 w-16 text-indigo-400 mb-4 animate-bounce" />
        <h3 className="text-base font-extrabold text-slate-800">Document Preview Unavailable</h3>
        <p className="text-xs font-semibold text-slate-500 mt-2 max-w-md leading-relaxed">
          Full document rendering and file preview functionality will be enabled in <span className="font-bold text-indigo-600">Phase 4 (Resource Upload & Management)</span>.
        </p>
        <div className="mt-6 rounded-2xl bg-indigo-50 border border-indigo-100 p-3.5 text-[11px] font-bold text-indigo-700">
          File Name: {file.title} • Format: {file.type} • Size: {file.size || 'N/A'}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex flex-col justify-between overflow-hidden">
      
      {/* Top Header Controls Bar */}
      <div className="h-16 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between px-4 sm:px-6 shrink-0">
        
        {/* Left Side: Metadata Info */}
        <div className="flex items-center gap-3 min-w-0 max-w-[40%] sm:max-w-[30%]">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-650 text-white font-black text-xs">
            {file.type}
          </div>
          <div className="min-w-0 text-left">
            <h4 className="text-xs font-bold truncate text-slate-100">{file.title}</h4>
            <p className="text-[9px] text-slate-400 font-semibold truncate mt-0.5">
              Size: {file.size} • Format: {file.type}
            </p>
          </div>
        </div>

        {/* Middle: Document Page & Zoom Controls */}
        <div className="flex items-center gap-3 sm:gap-6 shrink-0">
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2 border-r border-slate-800 pr-3 sm:pr-6">
              <button 
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="cursor-pointer p-1 rounded-md text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-[10px] font-bold text-slate-300 whitespace-nowrap">
                Page {currentPage} of {totalPages}
              </span>
              <button 
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="cursor-pointer p-1 rounded-md text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
                title="Next Page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Zoom controls */}
          <div className="flex items-center gap-2">
            <button 
              onClick={handleZoomOut}
              className="cursor-pointer p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-[10px] font-bold text-slate-300 w-10 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button 
              onClick={handleZoomIn}
              className="cursor-pointer p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button 
              onClick={handleFitScreen}
              className="cursor-pointer p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Fit to Screen"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={triggerDownload}
            className="cursor-pointer rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
            title="Download Document"
          >
            <Download className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Download</span>
          </button>
          <button 
            onClick={onClose}
            className="cursor-pointer rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-900/30 text-rose-250 text-rose-200 px-3.5 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-all"
            title="Close Viewer"
          >
            <X className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Close</span>
          </button>
        </div>

      </div>

      {/* Main Document Content Canvas */}
      <div className="flex-1 overflow-auto bg-slate-950/95 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="absolute top-4 left-4 z-10 hidden md:block text-slate-550 text-[10px] uppercase font-bold text-slate-500 select-none">
          Acadrium Document Sandboxed Viewer Mode
        </div>

        {/* Document Sheet Page Container */}
        <div className="bg-white shadow-2xl rounded-3xl p-6 sm:p-10 max-w-3xl min-h-[550px] w-full text-slate-800 flex flex-col justify-between select-none relative overflow-hidden transition-all duration-200 border border-slate-100">
          
          {/* Watermark brand overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] select-none pointer-events-none">
            <span className="text-slate-900 font-black text-6xl rotate-12">ACADRIUM</span>
          </div>

          {/* Render parsed contents */}
          <div className="flex-1">
            {renderDocumentContent()}
          </div>

          {/* Footer Info details (remains relative for layout spacing) */}
          <div className="border-t border-slate-100 pt-5 mt-6 flex flex-col sm:flex-row items-center justify-between text-[10px] font-semibold text-slate-400 gap-2 shrink-0 text-left">
            <div>
              <p>Uploaded By: <span className="text-slate-655 text-slate-600 font-bold">{file.uploadedBy || 'Student Workspace'}</span></p>
              {file.classroomName && <p className="mt-0.5">Subject: <span className="text-indigo-500 font-bold">{file.classroomName}</span></p>}
            </div>
            <p className="uppercase tracking-widest text-slate-400">Secure Academic Memory Node</p>
          </div>

        </div>

      </div>

    </div>
  );
}
