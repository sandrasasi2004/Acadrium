import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '../../components/common/UserContext';
import { 
  Send, 
  Sparkles, 
  FileText,
  BookOpen,
  Info,
  ExternalLink,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import DocumentViewer from '../../components/common/DocumentViewer';

export default function AIAssistant() {
  const { aiChats, sendAiMessage } = useUser();
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedSourceDoc, setSelectedSourceDoc] = useState(null);
  const chatEndRef = useRef(null);

  // Auto scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiChats, isTyping]);

  const handleSendMessage = async (text) => {
    if (!text.trim() || isTyping) return;
    setInputValue('');
    setIsTyping(true);
    await sendAiMessage(text.trim());
    setIsTyping(false);
  };

  // Get active source documents from latest assistant response
  const latestBotMsg = [...aiChats].reverse().find(c => c.sender === 'bot' && c.sources && c.sources.length > 0);
  const activeSources = latestBotMsg ? latestBotMsg.sources : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-8rem)]">
      
      {/* LEFT / MAIN COLUMN: Conversational Chat Panel */}
      <div className="col-span-1 lg:col-span-8 rounded-3xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between overflow-hidden">
        
        {/* Chat Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-800">Acadrium RAG AI Assistant</h2>
              <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                PGVector Semantic Search Active
              </p>
            </div>
          </div>
        </div>

        {/* Messaging Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/20">
          
          {/* Welcome Notice */}
          {aiChats.length === 0 && (
            <div className="max-w-xl mx-auto rounded-3xl border border-indigo-100 bg-indigo-50/40 p-8 text-center space-y-3 my-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                <Sparkles className="h-7 w-7 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 mb-1">Acadrium Document AI</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                  Ask any question about your course materials, PDF lectures, DOCX notes, or PPT slides. Answers are generated strictly from your uploaded resources.
                </p>
              </div>
            </div>
          )}

          {/* Messages list */}
          <div className="space-y-4">
            {aiChats.map((chat, idx) => (
              <div 
                key={idx}
                className={`flex gap-3 max-w-[85%] ${
                  chat.sender === 'user' ? 'ml-auto justify-end' : 'mr-auto justify-start'
                }`}
              >
                {chat.sender === 'bot' && (
                  <div className="hidden sm:flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 mt-1">
                    <Sparkles className="h-4.5 w-4.5" />
                  </div>
                )}
                
                <div className="flex flex-col">
                  <div className={`rounded-3xl px-5 py-3 text-xs leading-relaxed shadow-2xs whitespace-pre-wrap ${
                    chat.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none font-medium'
                      : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none font-sans font-normal'
                  }`}>
                    {chat.text}
                  </div>
                  
                  {/* Inline Sources list if bot message */}
                  {chat.sender === 'bot' && chat.sources && chat.sources.length > 0 && (
                    <div className="mt-2.5 space-y-1.5 pl-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Citations Used:</span>
                      <div className="flex flex-wrap gap-2">
                        {chat.sources.map((src, sIdx) => (
                          <button
                            key={sIdx}
                            onClick={() => setSelectedSourceDoc(src)}
                            className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-indigo-50/80 hover:bg-indigo-100 px-3 py-1.5 text-[10px] font-bold text-indigo-700 border border-indigo-200/60 transition-all"
                          >
                            <FileText className="h-3 w-3 text-indigo-600" />
                            <span>{src.title}</span>
                            {src.similarity ? (
                              <span className="bg-indigo-200/60 text-indigo-900 px-1.5 py-0.2 rounded-md font-extrabold text-[8px]">
                                {Math.round(src.similarity * 100)}%
                              </span>
                            ) : null}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <span className={`text-[9px] text-slate-400 mt-1 font-semibold px-2 ${
                    chat.sender === 'user' ? 'text-right' : 'text-left'
                  }`}>{chat.time}</span>
                </div>
              </div>
            ))}

            {/* Simulated Typing State */}
            {isTyping && (
              <div className="flex gap-3 max-w-[80%] mr-auto justify-start">
                <div className="hidden sm:flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                  <Sparkles className="h-4.5 w-4.5 animate-spin" />
                </div>
                <div className="flex flex-col">
                  <div className="rounded-3xl rounded-tl-none border border-slate-100 bg-white px-5 py-4.5 shadow-2xs">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                      <span className="h-2 w-2 animate-ping rounded-full bg-indigo-500"></span>
                      <span>Retrieving PGVector documents & synthesizing response...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Input capsule bar */}
        <div className="p-4 md:p-6 border-t border-slate-200 bg-white shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputValue);
            }}
            className="flex items-center gap-2 bg-slate-100 rounded-full border border-slate-200 px-3 py-1.5 focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 transition-all"
          >
            <input
              type="text"
              placeholder="Ask anything about your syllabus, normalization, database, or lecture uploads..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isTyping}
              className="flex-1 bg-transparent py-2.5 px-2 text-xs text-slate-800 outline-hidden placeholder:text-slate-400 font-medium"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              className={`cursor-pointer flex h-10 w-10 items-center justify-center rounded-full text-white shadow-xs shrink-0 transition-all ${
                inputValue.trim() && !isTyping
                  ? 'bg-indigo-600 hover:bg-indigo-700'
                  : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>

      </div>

      {/* RIGHT COLUMN: Grounded Sources Panel */}
      <div className="col-span-1 lg:col-span-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between overflow-hidden">
        <div className="space-y-4 overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-indigo-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">Source References</h3>
            </div>
            <span className="text-[10px] font-bold text-slate-400">
              {activeSources.length} {activeSources.length === 1 ? 'Source' : 'Sources'}
            </span>
          </div>

          {activeSources.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center space-y-2">
              <ShieldCheck className="mx-auto h-8 w-8 text-slate-300 mb-1" />
              <p className="text-xs font-bold text-slate-600">No sources active</p>
              <p className="text-[10px] text-slate-400">Ask a question to see grounded source documents retrieved from your database.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeSources.map((src, sIdx) => {
                const matchPct = src.similarity ? Math.round(src.similarity * 100) : 0;
                return (
                  <div 
                    key={sIdx}
                    onClick={() => setSelectedSourceDoc(src)}
                    className="cursor-pointer rounded-2xl border border-slate-200 bg-slate-50/60 p-4 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all space-y-2 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white font-black text-[9px]">
                          {src.file_type || 'PDF'}
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-600">
                          {src.title}
                        </h4>
                      </div>
                      {matchPct > 0 && (
                        <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-extrabold text-emerald-700 border border-emerald-200">
                          {matchPct}% Match
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed font-sans">
                      {src.snippet || "Relevant document content extracted."}
                    </p>

                    <div className="flex items-center justify-between text-[9px] text-slate-400 font-semibold pt-1 border-t border-slate-100">
                      <span>{src.classroom_name}</span>
                      <span className="flex items-center gap-0.5 text-indigo-600 font-bold group-hover:underline">
                        View Document <ChevronRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Panel Footer */}
        <div className="mt-4 border-t border-slate-100 pt-4 text-center">
          <p className="text-[10px] text-slate-400 font-semibold">
            Acadrium RAG Protocol • Strict Zero-Hallucination Enforced
          </p>
        </div>

      </div>

      {/* DOCUMENT VIEWER MODAL */}
      {selectedSourceDoc && (
        <DocumentViewer file={selectedSourceDoc} onClose={() => setSelectedSourceDoc(null)} />
      )}

    </div>
  );
}
