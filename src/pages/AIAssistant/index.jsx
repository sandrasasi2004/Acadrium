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
  ShieldCheck,
  Plus,
  MessageSquare,
  Edit2,
  Trash2,
  Check,
  X,
  History
} from 'lucide-react';
import DocumentViewer from '../../components/common/DocumentViewer';

export default function AIAssistant() {
  const userContext = useUser() || {};
  const { 
    aiChats = [], 
    chats = [], 
    activeChatId = null, 
    loadUserChats = async () => [], 
    createNewChat = async () => null, 
    openChat = async () => null, 
    renameChat = async () => ({}), 
    deleteChat = async () => ({}), 
    sendAiMessage = async () => ({}) 
  } = userContext;

  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedSourceDoc, setSelectedSourceDoc] = useState(null);
  
  // Renaming inline state
  const [editingChatId, setEditingChatId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const chatEndRef = useRef(null);

  const safeAiChats = Array.isArray(aiChats) ? aiChats : [];
  const safeChats = Array.isArray(chats) ? chats : [];

  useEffect(() => {
    async function initChats() {
      if (typeof loadUserChats === 'function') {
        const userChats = await loadUserChats();
        if (userChats && userChats.length > 0 && !activeChatId && typeof openChat === 'function') {
          openChat(userChats[0].id);
        }
      }
    }
    initChats();
  }, [loadUserChats, activeChatId, openChat]);

  // Auto scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [safeAiChats, isTyping]);

  const handleSendMessage = async (text) => {
    if (!text || !text.trim() || isTyping) return;
    setInputValue('');
    setIsTyping(true);
    await sendAiMessage(text.trim());
    setIsTyping(false);
  };

  const handleStartRename = (e, chat) => {
    e.stopPropagation();
    if (!chat) return;
    setEditingChatId(chat.id);
    setEditTitle(chat.title || '');
  };

  const handleSaveRename = async (e, chatId) => {
    e.stopPropagation();
    if (editTitle && editTitle.trim()) {
      await renameChat(chatId, editTitle.trim());
    }
    setEditingChatId(null);
  };

  const handleCancelRename = (e) => {
    e.stopPropagation();
    setEditingChatId(null);
  };

  const handleDeleteChat = async (e, chatId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this chat conversation?')) {
      await deleteChat(chatId);
    }
  };

  // Get active source documents from latest assistant response
  const latestBotMsg = [...safeAiChats].reverse().find(c => c && c.sender === 'bot' && Array.isArray(c.sources) && c.sources.length > 0);
  const activeSources = latestBotMsg && Array.isArray(latestBotMsg.sources) ? latestBotMsg.sources : [];

  const activeChat = safeChats.find(c => c && c.id === activeChatId) || null;


  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-8.5rem)]">
      
      {/* COLUMN 1: Persistent Chat Sidebar */}
      <div className="col-span-1 lg:col-span-3 rounded-3xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between overflow-hidden">
        
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-indigo-600" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">Conversations</h3>
          </div>
          <button
            onClick={() => createNewChat()}
            className="cursor-pointer flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 text-xs font-bold transition-all shadow-xs"
            title="New Conversation"
          >
            <Plus className="h-3.5 w-3.5" /> <span>New Chat</span>
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {safeChats.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/40 p-6 text-center space-y-2 my-2">
              <MessageSquare className="mx-auto h-7 w-7 text-slate-300 mb-1" />
              <p className="text-xs font-bold text-slate-600">No chat history</p>
              <p className="text-[10px] text-slate-400">Click "+ New Chat" to start an academic study session.</p>
            </div>
          ) : (
            safeChats.map((chat) => {
              const isActive = chat.id === activeChatId;
              const isEditing = chat.id === editingChatId;

              return (
                <div
                  key={chat.id}
                  onClick={() => !isEditing && openChat(chat.id)}
                  className={`group relative flex items-center justify-between rounded-2xl p-3 text-xs font-bold cursor-pointer transition-all ${
                    isActive 
                      ? 'bg-indigo-50/90 text-indigo-900 border border-indigo-200/80 shadow-2xs' 
                      : 'hover:bg-slate-100/70 text-slate-700 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                    <MessageSquare className={`h-4 w-4 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                    
                    {isEditing ? (
                      <div className="flex items-center gap-1 flex-1">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full rounded-md border border-indigo-300 bg-white px-2 py-0.5 text-xs font-medium text-slate-800 outline-hidden"
                          autoFocus
                        />
                        <button onClick={(e) => handleSaveRename(e, chat.id)} className="text-emerald-600 hover:text-emerald-800 p-1">
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={handleCancelRename} className="text-slate-400 hover:text-slate-600 p-1">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="truncate">{chat.title}</span>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => handleStartRename(e, chat)} 
                        className="cursor-pointer text-slate-400 hover:text-indigo-600 p-1 rounded-md hover:bg-indigo-100/50 transition-colors"
                        title="Rename Chat"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button 
                        onClick={(e) => handleDeleteChat(e, chat.id)} 
                        className="cursor-pointer text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-100/50 transition-colors"
                        title="Delete Chat"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-100 text-center bg-slate-50/30">
          <p className="text-[10px] text-slate-400 font-semibold">
            PostgreSQL Chat Storage • User Isolated
          </p>
        </div>
      </div>

      {/* COLUMN 2: Main Conversational Messaging Panel */}
      <div className="col-span-1 lg:col-span-6 rounded-3xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between overflow-hidden">
        
        {/* Chat Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-800">
                {activeChat ? activeChat.title : 'Acadrium AI Assistant'}
              </h2>
              <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                PGVector Grounded RAG • Zero Hallucination
              </p>
            </div>
          </div>
        </div>

        {/* Messaging Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/20">
          
          {/* Welcome Notice */}
          {safeAiChats.length === 0 && (
            <div className="max-w-md mx-auto rounded-3xl border border-indigo-100 bg-indigo-50/40 p-8 text-center space-y-3 my-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                <Sparkles className="h-7 w-7 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 mb-1">Acadrium Academic Assistant</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                  Ask any question about your course materials, PDF lectures, announcements, or timeline events.
                </p>
              </div>
            </div>
          )}

          {/* Messages list */}
          <div className="space-y-4">
            {safeAiChats.map((chat, idx) => (
              <div 
                key={idx}
                className={`flex gap-3 max-w-[90%] ${
                  chat.sender === 'user' ? 'ml-auto justify-end' : 'mr-auto justify-start'
                }`}
              >
                {chat.sender === 'bot' && (
                  <div className="hidden sm:flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 mt-1">
                    <Sparkles className="h-4.5 w-4.5" />
                  </div>
                )}
                
                <div className="flex flex-col">
                  <div className={`rounded-3xl px-5 py-3.5 text-xs leading-relaxed shadow-2xs whitespace-pre-wrap ${
                    chat.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none font-medium'
                      : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none font-sans font-normal'
                  }`}>
                    {chat.text || chat.content}
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
                            <span>{src.title || src.original_filename}</span>
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
                  }`}>{chat.time || 'Just now'}</span>
                </div>
              </div>
            ))}

            {/* Simulated Typing State */}
            {isTyping && (
              <div className="flex gap-3 max-w-[85%] mr-auto justify-start">
                <div className="hidden sm:flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                  <Sparkles className="h-4.5 w-4.5 animate-spin" />
                </div>
                <div className="flex flex-col">
                  <div className="rounded-3xl rounded-tl-none border border-slate-100 bg-white px-5 py-4 shadow-2xs">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                      <span className="h-2 w-2 animate-ping rounded-full bg-indigo-500"></span>
                      <span>Searching course vector DB & synthesizing response...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Input capsule bar */}
        <div className="p-4 border-t border-slate-200 bg-white shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputValue);
            }}
            className="flex items-center gap-2 bg-slate-100 rounded-full border border-slate-200 px-3 py-1.5 focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 transition-all"
          >
            <input
              type="text"
              placeholder="Ask anything about your syllabus, normalization, exams, or lecture uploads..."
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

      {/* COLUMN 3: Grounded Sources Panel */}
      <div className="col-span-1 lg:col-span-3 rounded-3xl border border-slate-200 bg-white p-4.5 shadow-xs flex flex-col justify-between overflow-hidden">
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
                    className="cursor-pointer rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all space-y-2 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white font-black text-[8px]">
                          {src.file_type || 'PDF'}
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-600">
                          {src.title || src.original_filename}
                        </h4>
                      </div>
                      {matchPct > 0 && (
                        <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[8px] font-extrabold text-emerald-700 border border-emerald-200">
                          {matchPct}% Match
                        </span>
                      )}
                    </div>

                    <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed font-sans">
                      {src.snippet || "Relevant document content extracted."}
                    </p>

                    <div className="flex items-center justify-between text-[9px] text-slate-400 font-semibold pt-1 border-t border-slate-100">
                      <span>{src.classroom_name || src.classroomName || 'Workspace'}</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedSourceDoc(src); }}
                        className="cursor-pointer inline-flex items-center gap-1 text-indigo-600 font-bold hover:text-indigo-800 hover:underline text-[9px]"
                      >
                        Open Document <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Panel Footer */}
        <div className="mt-3 border-t border-slate-100 pt-3 text-center">
          <p className="text-[9px] text-slate-400 font-semibold">
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
