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

  // Mock content generation for preview
  const renderDocumentContent = () => {
    if (isImage) {
      if (realFileUrl) {
        return (
          <div className="flex items-center justify-center p-4">
            <img 
              src={realFileUrl} 
              alt={file.title} 
              className="max-h-[500px] object-contain rounded-lg shadow-md transition-transform duration-200"
              style={{ transform: `scale(${zoom})` }}
            />
          </div>
        );
      }
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center" style={{ transform: `scale(${zoom})` }}>
          <div className="h-48 w-64 bg-slate-100 rounded-lg shadow-inner flex items-center justify-center text-slate-400">
            <ImageIcon className="h-16 w-16" />
          </div>
          <p className="mt-4 text-xs font-bold text-slate-500">Image Sandbox Preview Mode</p>
        </div>
      );
    }

    if (isText) {
      return (
        <div 
          className="text-left font-mono text-xs bg-slate-50 p-6 rounded-xl border border-slate-200 overflow-auto max-h-[550px] leading-relaxed transition-transform"
          style={{ transform: `scale(${zoom})` }}
        >
          {textContent || "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. (Mock text log)"}
        </div>
      );
    }

    if (isPdf) {
      return (
        <div 
          className="text-left space-y-4 transition-transform duration-200"
          style={{ transform: `scale(${zoom})` }}
        >
          <div className="border-b border-indigo-100 pb-3 flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-indigo-650 bg-indigo-50 px-2.5 py-0.5 rounded-full">Handout Page {currentPage}</span>
            <span className="text-[10px] font-semibold text-slate-400">DBMS Study Guide</span>
          </div>

          {currentPage === 1 && (
            <div className="space-y-4">
              <h2 className="text-base font-black text-slate-800 border-l-4 border-indigo-600 pl-2">Section 1. Relational Database Concepts</h2>
              <p className="text-xs text-slate-655 font-semibold leading-relaxed">
                A relational database is a digital database based on the relational model of data. Relational databases are built using relations (tables) representing attributes and tuples. Normalized relation structures prevent transaction update anomalies.
              </p>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-[11px] font-mono leading-relaxed">
                SELECT subject_id, count(student_id)<br />
                FROM enrollments<br />
                GROUP BY subject_id;
              </div>
            </div>
          )}

          {currentPage === 2 && (
            <div className="space-y-4">
              <h2 className="text-base font-black text-slate-800 border-l-4 border-indigo-600 pl-2">Section 2. Database Normalization Forms</h2>
              <p className="text-xs text-slate-655 font-semibold leading-relaxed">
                Normalization is the process of structuring a relational database in accordance with a series of normal forms to reduce redundancy and improve data integrity.
              </p>
              <ul className="text-xs text-slate-655 font-semibold list-disc pl-5 space-y-2">
                <li><strong>First Normal Form (1NF):</strong> All attributes contain only atomic (indivisible) values.</li>
                <li><strong>Second Normal Form (2NF):</strong> Must be in 1NF and all non-key attributes are fully functionally dependent on the primary key.</li>
                <li><strong>Third Normal Form (3NF):</strong> Must be in 2NF and no transitive functional dependencies exist.</li>
              </ul>
            </div>
          )}

          {currentPage === 3 && (
            <div className="space-y-4">
              <h2 className="text-base font-black text-slate-800 border-l-4 border-indigo-600 pl-2">Section 3. Boyce-Codd Normal Form (BCNF)</h2>
              <p className="text-xs text-slate-655 font-semibold leading-relaxed">
                Boyce-Codd Normal Form (BCNF) is a slightly stronger version of the Third Normal Form (3NF). A relation is in BCNF if and only if, for every one of its non-trivial functional dependencies X &rarr; Y, X is a superkey.
              </p>
              <p className="text-xs text-slate-500 italic">Example scenario: Table R(A, B, C) where dependencies are A &rarr; B and C &rarr; A. Normalizing this involves splitting the relation to avoid dependency preservation issues.</p>
            </div>
          )}

          {currentPage >= 4 && (
            <div className="space-y-4">
              <h2 className="text-base font-black text-slate-800 border-l-4 border-indigo-600 pl-2">Section {currentPage}. DBMS Transaction Management</h2>
              <p className="text-xs text-slate-655 font-semibold leading-relaxed">
                Transactions represent a unit of execution. In DBMS, transactions follow the ACID properties: Atomicity, Consistency, Isolation, and Durability.
              </p>
              <div className="rounded-xl border border-slate-200 bg-amber-50/50 p-4 text-xs font-semibold text-amber-800">
                Concurrency issues like dirty read, non-repeatable read, and phantom reads are controlled via Isolation Levels (Serializable, Repeatable Read, Read Committed, Read Uncommitted).
              </div>
            </div>
          )}
        </div>
      );
    }

    if (isPpt) {
      return (
        <div 
          className="text-left space-y-6 transition-transform duration-200"
          style={{ transform: `scale(${zoom})` }}
        >
          <div className="h-56 bg-slate-900 rounded-2xl p-6 text-white flex flex-col justify-between relative overflow-hidden shadow-md">
            <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-indigo-500/10 blur-xl"></div>
            <div>
              <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-950 px-2.5 py-0.5 rounded-full border border-indigo-900">Slide {currentPage}</span>
              <h2 className="text-base font-extrabold mt-3 tracking-tight">{currentPage === 1 ? file.title : `Module Topic ${currentPage}`}</h2>
            </div>
            <p className="text-[11px] text-slate-350 leading-relaxed font-semibold">
              {currentPage === 1 
                ? "Academic Presentation Lecture Slides Deck - Relational DB normalizations and search heuristics models."
                : `Slide details explaining sub-topic logs. f(n) evaluation heuristics, heuristics modeling, and VPC subnet settings.`
              }
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-700">Slide Notes:</h4>
            <p className="text-xs text-slate-500 leading-relaxed">Ensure students review the diagrams explaining normalizations. Concurrency protocols will be tested in internal examinations.</p>
          </div>
        </div>
      );
    }

    if (isWord) {
      return (
        <div 
          className="text-left space-y-4 transition-transform duration-200"
          style={{ transform: `scale(${zoom})` }}
        >
          <h2 className="text-base font-extrabold text-slate-800 underline decoration-indigo-500 decoration-2">{file.title}</h2>
          <p className="text-xs text-slate-655 font-semibold leading-relaxed">
            This Word Document file contains class notes, lecture manuals, and exam agendas compiled for study purposes. Ensure you read this resource alongside relational normalization slides.
          </p>
          <p className="text-xs text-slate-655 font-semibold leading-relaxed">
            Boyce-Codd Normal Form (BCNF), transaction logs, and locking protocols represent core components of Relational Database systems. Write down responses for query exercises before next lab.
          </p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <FileText className="h-12 w-12 text-slate-300 mb-3" />
        <p className="text-xs text-slate-600 font-bold leading-relaxed max-w-sm">
          Document preview will be available after backend integration.
        </p>
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
