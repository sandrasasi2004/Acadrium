import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  Presentation,
  AlignLeft,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { useUser } from './UserContext';
import * as api from '../../services/api';

export default function DocumentViewer({ file, onClose }) {
  const { showToast } = useUser();
  const [zoom, setZoom] = useState(1.0);
  const [blobUrl, setBlobUrl] = useState(null);
  const [isLoadingFile, setIsLoadingFile] = useState(true);
  const [previewError, setPreviewError] = useState(null);
  const [extractedText, setExtractedText] = useState(file?.extracted_text || '');
  const [viewMode, setViewMode] = useState('preview'); // 'preview' or 'text'
  const [isReprocessing, setIsReprocessing] = useState(false);

  const typeTag = (file?.file_type || file?.type || 'PDF').toUpperCase();
  const filename = file?.original_filename || file?.title || 'document';
  const ext = filename.split('.').pop().toLowerCase();

  const isImage = typeTag === 'IMAGE' || ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext);
  const isPdf = typeTag === 'PDF' || ext === 'pdf';
  const isText = typeTag === 'TXT' || ext === 'txt';
  const isDocx = typeTag === 'DOCX' || ['doc', 'docx'].includes(ext);
  const isPpt = typeTag === 'PPT' || ['ppt', 'pptx'].includes(ext);

  const processingStatus = (file?.processing_status || file?.extraction_status || 'COMPLETED').toUpperCase();
  const ocrStatus = (file?.ocr_status || 'NOT_APPLICABLE').toUpperCase();
  const pageCount = file?.page_count || 0;
  const wordCount = file?.word_count || 0;

  useEffect(() => {
    let isMounted = true;
    async function loadPreviewData() {
      if (!file?.id) return;
      setIsLoadingFile(true);
      setPreviewError(null);

      // Fetch blob stream for PDF, Image, TXT
      if (isPdf || isImage || isText) {
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
              setExtractedText(text);
            }
          } else {
            setPreviewError(result.error || 'Unable to load physical preview stream.');
          }
        }
      }

      if (isMounted) {
        setIsLoadingFile(false);
      }
    }

    loadPreviewData();

    return () => {
      isMounted = false;
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [file?.id]);

  if (!file) return null;

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleFitScreen = () => setZoom(1.0);

  const handleDownload = async () => {
    try {
      if (file.classroom_id || file.uploader_name || file.uploadedBy) {
        await api.downloadResource(file.id, filename);
      } else {
        await api.downloadWorkspaceFile(file.id, filename);
      }
    } catch (err) {
      showToast(err.message || 'Download failed', 'error');
    }
  };

  const handleTriggerReprocess = async () => {
    setIsReprocessing(true);
    try {
      let res;
      if (file.classroom_id || file.uploader_name || file.uploadedBy) {
        res = await api.reprocessResource(file.id);
      } else {
        res = await api.reprocessWorkspaceFile(file.id);
      }
      if (res && res.success && res.data) {
        setExtractedText(res.data.extracted_text || '');
        showToast('Document reprocessed successfully!', 'success');
      } else if (res && res.extracted_text !== undefined) {
        setExtractedText(res.extracted_text || '');
        showToast('Document reprocessed successfully!', 'success');
      } else {
        showToast('Reprocessing completed.', 'info');
      }
    } catch (err) {
      showToast('Failed to trigger reprocessing.', 'error');
    } finally {
      setIsReprocessing(false);
    }
  };

  // Helper to parse slides for PPTX preview
  const renderPptxSlides = (text) => {
    if (!text || !text.trim()) return null;
    const lines = text.split('\n');
    const slides = [];
    let currentSlide = null;

    lines.forEach(line => {
      const match = line.match(/^Slide (\d+):?(.*)$/i);
      if (match) {
        if (currentSlide) slides.push(currentSlide);
        currentSlide = { number: match[1], title: match[2].trim(), content: [] };
      } else if (currentSlide) {
        if (line.trim()) currentSlide.content.push(line.trim());
      } else {
        if (!currentSlide) {
          currentSlide = { number: 1, title: 'Overview', content: [] };
        }
        if (line.trim()) currentSlide.content.push(line.trim());
      }
    });
    if (currentSlide) slides.push(currentSlide);

    return (
      <div className="space-y-6 w-full max-w-3xl mx-auto py-2">
        {slides.map((slide, idx) => (
          <div key={idx} className="rounded-2xl border border-amber-200 bg-linear-to-br from-amber-50/40 to-orange-50/20 p-6 shadow-xs text-left">
            <div className="flex items-center justify-between border-b border-amber-200/60 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Presentation className="h-5 w-5 text-amber-600" />
                <span className="text-xs font-black uppercase text-amber-700 tracking-wider">Slide {slide.number}</span>
              </div>
              <h4 className="text-sm font-bold text-slate-800">{slide.title || `Slide ${slide.number}`}</h4>
            </div>
            {slide.content.length > 0 ? (
              <ul className="space-y-2 text-xs text-slate-700 font-medium pl-2">
                {slide.content.map((bullet, bIdx) => (
                  <li key={bIdx} className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs italic text-slate-400">No additional body text on slide.</p>
            )}
          </div>
        ))}
      </div>
    );
  };

  const [summary, setSummary] = useState(file?.summary || file?.resource_summary || '');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      let res;
      if (file.classroom_id || file.uploader_name || file.uploadedBy) {
        res = await api.getResourceSummary(file.id);
      } else {
        res = await api.getWorkspaceSummary(file.id);
      }
      if (res && res.success && res.data?.summary) {
        setSummary(res.data.summary);
        setViewMode('summary');
        showToast('Academic summary generated!', 'success');
      } else if (res && res.summary) {
        setSummary(res.summary);
        setViewMode('summary');
        showToast('Academic summary generated!', 'success');
      } else {
        showToast('Unable to generate summary.', 'error');
      }
    } catch (err) {
      showToast('Summary generation failed.', 'error');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const renderDocumentBody = () => {
    if (isLoadingFile) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center my-8">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mb-4"></div>
          <p className="text-xs font-bold text-slate-700">Loading document preview...</p>
          <p className="text-[11px] text-slate-400 mt-1">Preparing document stream</p>
        </div>
      );
    }

    if (viewMode === 'summary') {
      return (
        <div className="w-full max-h-[550px] overflow-auto p-8 bg-indigo-50/40 rounded-2xl border border-indigo-100 text-left shadow-xs space-y-4 font-sans">
          <div className="flex items-center gap-2 border-b border-indigo-200/60 pb-3">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-800">AI Academic Document Summary</h3>
          </div>
          <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
            {summary || 'Generating summary...'}
          </div>
        </div>
      );
    }

    if (viewMode === 'text' || (isText && extractedText)) {
      return (
        <div className="w-full max-h-[550px] overflow-auto p-6 bg-slate-50 rounded-2xl font-mono text-xs text-slate-800 border border-slate-200 whitespace-pre-wrap text-left shadow-inner">
          {extractedText || 'No text extracted from document.'}
        </div>
      );
    }

    if (isDocx) {
      return extractedText ? (
        <div className="w-full max-h-[580px] overflow-auto p-8 bg-white rounded-2xl border border-slate-200 text-left shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-800">{filename}</h3>
            </div>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              DOCX Extracted Document View
            </span>
          </div>
          <div className="text-xs text-slate-700 leading-relaxed space-y-3 whitespace-pre-wrap font-sans">
            {extractedText}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 text-center my-4 space-y-4 w-full">
          <div className="p-8 rounded-3xl bg-indigo-50/80 border border-indigo-100 text-center max-w-md shadow-xs">
            <FileText className="h-12 w-12 text-indigo-600 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-800">{filename}</h4>
            <p className="text-xs font-semibold text-slate-600 mt-2">
              Text extraction is processing or pending for this Word Document.
            </p>
            <div className="flex justify-center gap-3 mt-5">
              <button
                onClick={handleTriggerReprocess}
                disabled={isReprocessing}
                className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-white px-4 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-50 transition-all"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isReprocessing ? 'animate-spin' : ''}`} /> Reprocess Text
              </button>
              <button
                onClick={handleDownload}
                className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition-all"
              >
                <Download className="h-4 w-4" /> Download File
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (isPpt) {
      return extractedText ? (
        <div className="w-full max-h-[580px] overflow-auto p-4 bg-white rounded-2xl border border-slate-200 text-left shadow-xs">
          {renderPptxSlides(extractedText)}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 text-center my-4 space-y-4 w-full">
          <div className="p-8 rounded-3xl bg-amber-50/80 border border-amber-100 text-center max-w-md shadow-xs">
            <Presentation className="h-12 w-12 text-amber-600 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-800">{filename}</h4>
            <p className="text-xs font-semibold text-slate-600 mt-2">
              Slide extraction is processing or pending for this PowerPoint file.
            </p>
            <div className="flex justify-center gap-3 mt-5">
              <button
                onClick={handleTriggerReprocess}
                disabled={isReprocessing}
                className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-white px-4 py-2 text-xs font-bold text-amber-700 hover:bg-amber-50 transition-all"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isReprocessing ? 'animate-spin' : ''}`} /> Reprocess Presentation
              </button>
              <button
                onClick={handleDownload}
                className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-amber-700 transition-all"
              >
                <Download className="h-4 w-4" /> Download Slides
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (previewError) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center my-8">
          <AlertCircle className="h-12 w-12 text-rose-500 mb-3" />
          <h4 className="text-sm font-bold text-slate-800">Preview Notice</h4>
          <p className="text-xs text-slate-600 font-semibold mt-1 max-w-sm">{previewError}</p>
          <button
            onClick={handleDownload}
            className="cursor-pointer mt-5 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition-all"
          >
            <Download className="h-4 w-4" /> Download Physical Document
          </button>
        </div>
      );
    }

    if (isImage && blobUrl) {
      return (
        <div className="flex flex-col items-center justify-center overflow-auto max-h-[600px] w-full p-4">
          <img 
            src={blobUrl} 
            alt={filename} 
            className="max-h-[520px] w-auto object-contain rounded-2xl shadow-lg border border-slate-200 transition-transform duration-200" 
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

    return (
      <div className="flex flex-col items-center justify-center p-8 text-center my-4 space-y-4">
        <div className="p-8 rounded-3xl bg-indigo-50 border border-indigo-100 text-center max-w-md shadow-xs">
          <FileText className="h-12 w-12 text-indigo-600 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-800">{filename}</h4>
          <p className="text-xs text-slate-500 mt-1">Format: <span className="font-bold text-indigo-600">{typeTag}</span></p>
          <button
            onClick={handleDownload}
            className="cursor-pointer mt-5 inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors"
          >
            <Download className="h-4 w-4" /> Download File to View
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex flex-col justify-between overflow-hidden animate-in fade-in duration-200">
      
      {/* Top Header Controls Bar */}
      <div className="h-16 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between px-4 sm:px-6 shrink-0">
        
        {/* Left Side: Metadata Info & Status Badges */}
        <div className="flex items-center gap-3 min-w-0 max-w-[45%]">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-black text-xs text-white ${
            typeTag === 'PDF' ? 'bg-red-600' :
            typeTag === 'PPT' ? 'bg-orange-600' :
            typeTag === 'IMAGE' ? 'bg-emerald-600' :
            'bg-indigo-600'
          }`}>
            {typeTag}
          </div>
          <div className="min-w-0 text-left">
            <h4 className="text-xs font-bold truncate text-slate-100">{filename}</h4>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-[9px] text-slate-400 font-semibold truncate">
                Format: {typeTag} {pageCount > 0 ? `• ${pageCount} pgs` : ''} {wordCount > 0 ? `• ${wordCount} words` : ''}
              </span>

              {/* Status Badges */}
              {processingStatus === 'PROCESSING' || processingStatus === 'PENDING' ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-950/80 px-2 py-0.5 text-[9px] font-bold text-amber-300 border border-amber-800/40">
                  <Clock className="h-2.5 w-2.5 animate-spin" /> Processing
                </span>
              ) : processingStatus === 'FAILED' ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-950/80 px-2 py-0.5 text-[9px] font-bold text-rose-300 border border-rose-800/40">
                  <AlertCircle className="h-2.5 w-2.5" /> Extraction Failed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/80 px-2 py-0.5 text-[9px] font-bold text-emerald-300 border border-emerald-800/40">
                  <CheckCircle2 className="h-2.5 w-2.5" /> Processed
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Middle: Controls & View Mode Toggles */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setViewMode('preview')}
              className={`cursor-pointer px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                viewMode === 'preview' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Preview
            </button>
            <button
              onClick={() => setViewMode('text')}
              className={`cursor-pointer px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                viewMode === 'text' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Text
            </button>
            {summary ? (
              <button
                onClick={() => setViewMode('summary')}
                className={`cursor-pointer px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  viewMode === 'summary' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Summary
              </button>
            ) : null}
          </div>

          <button
            onClick={handleGenerateSummary}
            disabled={isGeneratingSummary}
            className="cursor-pointer bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs border border-indigo-400/30"
          >
            <Sparkles className={`h-3.5 w-3.5 ${isGeneratingSummary ? 'animate-spin' : ''}`} />
            <span>{isGeneratingSummary ? 'Summarizing...' : 'Generate Summary'}</span>
          </button>

          {viewMode === 'preview' && (isImage || isPdf) && (
            <div className="hidden sm:flex items-center gap-1.5 shrink-0 bg-slate-800/60 p-1 rounded-xl border border-slate-700/50">
              <button 
                onClick={handleZoomOut}
                className="cursor-pointer p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <span className="text-[10px] font-bold text-slate-300 w-9 text-center select-none">
                {Math.round(zoom * 100)}%
              </span>
              <button 
                onClick={handleZoomIn}
                className="cursor-pointer p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <button 
                onClick={handleFitScreen}
                className="cursor-pointer p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                title="Fit to Screen"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={handleDownload}
            className="cursor-pointer rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs border border-slate-700"
            title="Download Document"
          >
            <Download className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Download</span>
          </button>
          <button 
            onClick={onClose}
            className="cursor-pointer rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-900/30 text-rose-200 px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-all"
            title="Close Viewer"
          >
            <X className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Close</span>
          </button>
        </div>

      </div>

      {/* Main Document Content Canvas */}
      <div className="flex-1 overflow-auto bg-slate-950/95 flex items-center justify-center p-4 sm:p-6 relative">
        <div className="absolute top-4 left-4 z-10 hidden md:block text-[10px] uppercase font-bold text-slate-500 select-none">
          Acadrium Document Intelligence Layer
        </div>

        {/* Document Sheet Container */}
        <div className="bg-white shadow-2xl rounded-3xl p-4 sm:p-6 max-w-4xl min-h-[500px] w-full text-slate-800 flex flex-col justify-between relative overflow-hidden transition-all duration-200 border border-slate-100">
          <div className="flex-1 flex flex-col items-center justify-center">
            {renderDocumentBody()}
          </div>
        </div>

      </div>

    </div>
  );
}
