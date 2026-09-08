import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { useUser } from './UserContext';
import * as api from '../../services/api';

export default function DocumentViewer({ file, onClose }) {
  const { showToast } = useUser();
  const [zoom, setZoom] = useState(1.0);
  const [blobUrl, setBlobUrl] = useState(null);
  const [isLoadingFile, setIsLoadingFile] = useState(true);
  const [previewError, setPreviewError] = useState(null);
  const [textContent, setTextContent] = useState('');

  const typeTag = (file?.file_type || file?.type || 'PDF').toUpperCase();
  const filename = file?.original_filename || file?.title || 'document';
  const ext = filename.split('.').pop().toLowerCase();
  
  const isImage = typeTag === 'IMAGE' || ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext);
  const isPdf = typeTag === 'PDF' || ext === 'pdf';
  const isText = typeTag === 'TXT' || ext === 'txt';
  const isDocx = typeTag === 'DOCX' || ['doc', 'docx'].includes(ext);
  const isPpt = typeTag === 'PPT' || ['ppt', 'pptx'].includes(ext);

  useEffect(() => {
    let isMounted = true;
    async function loadFileBlob() {
      if (!file?.id) return;
      if (isDocx || isPpt) {
        setIsLoadingFile(false);
        return;
      }
      setIsLoadingFile(true);
      setPreviewError(null);

      let result;
      if (file.classroom_id || file.uploader_name || file.uploadedBy) {
        result = await api.previewResourceBlob(file.id);
      } else {
        result = await api.previewWorkspaceBlob(file.id);
      }

      if (isMounted) {
        if (result.success && result.blob) {
          const url = URL.createObjectURL(result.blob);
          setBlobUrl(url);
          if (isText) {
            const text = await result.blob.text();
            setTextContent(text);
          }
        } else {
          setPreviewError(result.error || 'Unable to load file preview stream.');
        }
        setIsLoadingFile(false);
      }
    }

    loadFileBlob();

    return () => {
      isMounted = false;
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [file?.id, isDocx, isPpt]);

  if (!file) return null;

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleFitScreen = () => setZoom(1.0);

  const handleDownload = async () => {
    if (file.classroom_id || file.uploader_name || file.uploadedBy) {
      await api.downloadResource(file.id, filename);
    } else {
      await api.downloadWorkspaceFile(file.id, filename);
    }
  };

  const renderDocumentBody = () => {
    if (isLoadingFile) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center my-8">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mb-4"></div>
          <p className="text-xs font-bold text-slate-700">Fetching document preview stream...</p>
          <p className="text-[11px] text-slate-400 mt-1">Loading secure physical file from server</p>
        </div>
      );
    }

    if (isDocx) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center my-4 space-y-4">
          <div className="p-8 rounded-2xl bg-indigo-50/80 border border-indigo-100 text-center max-w-md shadow-xs">
            <FileText className="h-12 w-12 text-indigo-600 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-800">{filename}</h4>
            <p className="text-xs font-semibold text-slate-600 mt-2">
              Preview is not supported for DOCX files.
            </p>
            <button
              onClick={handleDownload}
              className="cursor-pointer mt-5 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition-all"
            >
              <Download className="h-4 w-4" /> Download File
            </button>
          </div>
        </div>
      );
    }

    if (isPpt) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center my-4 space-y-4">
          <div className="p-8 rounded-2xl bg-amber-50/80 border border-amber-100 text-center max-w-md shadow-xs">
            <FileText className="h-12 w-12 text-amber-600 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-800">{filename}</h4>
            <p className="text-xs font-semibold text-slate-600 mt-2">
              Preview is not supported for PowerPoint files.
            </p>
            <button
              onClick={handleDownload}
              className="cursor-pointer mt-5 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition-all"
            >
              <Download className="h-4 w-4" /> Download File
            </button>
          </div>
        </div>
      );
    }

    if (previewError) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center my-8">
          <AlertCircle className="h-12 w-12 text-rose-500 mb-3" />
          <h4 className="text-sm font-bold text-slate-800">Preview Error</h4>
          <p className="text-xs text-rose-600 font-semibold mt-1 max-w-sm">{previewError}</p>
        </div>
      );
    }

    if (isImage && blobUrl) {
      return (
        <div className="flex items-center justify-center overflow-auto max-h-[600px] w-full p-4">
          <img 
            src={blobUrl} 
            alt={filename} 
            className="max-h-[540px] w-auto object-contain rounded-2xl shadow-lg border border-slate-200 transition-transform duration-200" 
            style={{ transform: `scale(${zoom})` }}
          />
        </div>
      );
    }

    if (isPdf && blobUrl) {
      return (
        <div className="w-full h-[600px] rounded-2xl overflow-hidden shadow-inner border border-slate-200">
          <object data={blobUrl} type="application/pdf" className="w-full h-full">
            <iframe src={blobUrl} title={filename} className="w-full h-full border-0"></iframe>
          </object>
        </div>
      );
    }

    if (isText) {
      return (
        <div className="w-full max-h-[550px] overflow-auto p-6 bg-slate-50 rounded-2xl font-mono text-xs text-slate-800 border border-slate-200 whitespace-pre-wrap text-left">
          {textContent || 'Empty document file.'}
        </div>
      );
    }

    // DOCX, PPTX, or other binary files fallback to embedded browser viewer with download option
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center my-4 space-y-4">
        {blobUrl ? (
          <div className="w-full h-[550px] rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
            <iframe src={blobUrl} title={filename} className="w-full h-full border-0"></iframe>
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-indigo-50 border border-indigo-100 text-center max-w-md">
            <FileText className="h-12 w-12 text-indigo-600 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-800">{filename}</h4>
            <p className="text-xs text-slate-500 mt-1">Format: <span className="font-bold text-indigo-600">{typeTag}</span></p>
            <p className="text-xs text-slate-500 mt-0.5">Physical document verified on disk.</p>
            <button
              onClick={handleDownload}
              className="cursor-pointer mt-4 inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors"
            >
              <Download className="h-4 w-4" /> Download File to View
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex flex-col justify-between overflow-hidden animate-in fade-in duration-200">
      
      {/* Top Header Controls Bar */}
      <div className="h-16 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between px-4 sm:px-6 shrink-0">
        
        {/* Left Side: Metadata Info */}
        <div className="flex items-center gap-3 min-w-0 max-w-[40%] sm:max-w-[30%]">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white font-black text-xs">
            {typeTag}
          </div>
          <div className="min-w-0 text-left">
            <h4 className="text-xs font-bold truncate text-slate-100">{filename}</h4>
            <p className="text-[9px] text-slate-400 font-semibold truncate mt-0.5">
              Format: {typeTag}
            </p>
          </div>
        </div>

        {/* Middle: Zoom Controls */}
        <div className="flex items-center gap-2 shrink-0">
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

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={handleDownload}
            className="cursor-pointer rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
            title="Download Document"
          >
            <Download className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Download</span>
          </button>
          <button 
            onClick={onClose}
            className="cursor-pointer rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-900/30 text-rose-200 px-3.5 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-all"
            title="Close Viewer"
          >
            <X className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Close</span>
          </button>
        </div>

      </div>

      {/* Main Document Content Canvas */}
      <div className="flex-1 overflow-auto bg-slate-950/95 flex items-center justify-center p-4 sm:p-8 relative">
        <div className="absolute top-4 left-4 z-10 hidden md:block text-[10px] uppercase font-bold text-slate-500 select-none">
          Acadrium Document Viewer Mode
        </div>

        {/* Document Sheet Container */}
        <div className="bg-white shadow-2xl rounded-3xl p-4 sm:p-6 max-w-4xl min-h-[500px] w-full text-slate-800 flex flex-col justify-between select-none relative overflow-hidden transition-all duration-200 border border-slate-100">
          <div className="flex-1 flex flex-col items-center justify-center">
            {renderDocumentBody()}
          </div>
        </div>

      </div>

    </div>
  );
}
