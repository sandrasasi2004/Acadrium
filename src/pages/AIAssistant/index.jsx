import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '../../components/common/UserContext';
import { 
  Send, 
  Plus, 
  Sparkles, 
  Paperclip,
  MessageSquare
} from 'lucide-react';

export default function AIAssistant() {
  const { aiChats, sendAiMessage } = useUser();
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Recent chats index (Mock sidebar list)
  const mockSessions = [
    { id: "s_1", title: "General Questions", preview: "Ask anything about classroom materials..." }
  ];
  const [activeSession, setActiveSession] = useState("s_1");

  // Auto scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiChats, isTyping]);

  const handleSendMessage = async (text) => {
    if (!text.trim() || isTyping) return;
    setInputValue('');
    setIsTyping(true);
    await sendAiMessage(text);
    setIsTyping(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[calc(100vh-8rem)]">
      
      {/* LEFT COLUMN: Conversational Sessions List (Hidden on mobile) */}
      <div className="hidden md:block md:col-span-4 lg:col-span-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between overflow-hidden">
        <div className="space-y-4 overflow-y-auto">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Conversations</h3>
            <button className="cursor-pointer p-1.5 rounded-lg border border-slate-100 hover:bg-slate-50 text-slate-500 hover:text-indigo-600 transition-colors">
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2">
            {mockSessions.map((session) => (
              <button
                key={session.id}
                onClick={() => setActiveSession(session.id)}
                className={`cursor-pointer w-full text-left rounded-2xl p-3 border transition-all ${
                  activeSession === session.id
                    ? 'border-indigo-100 bg-indigo-50/50 shadow-2xs'
                    : 'border-transparent hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className={`h-4 w-4 ${activeSession === session.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span className={`text-xs font-bold truncate block ${activeSession === session.id ? 'text-indigo-900' : 'text-slate-700'}`}>
                    {session.title}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium truncate mt-1 pl-6">
                  {session.preview}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Model Badge */}
        <div className="mt-4 border-t border-slate-100 pt-4 px-2">
          <div className="rounded-2xl bg-indigo-50/50 border border-indigo-100 p-3 text-center">
            <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest block">Core Model</span>
            <span className="text-xs font-black text-indigo-900 mt-1 block">Acadrium RAG v1.4</span>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Immersion Chat Area */}
      <div className="col-span-1 md:col-span-8 lg:col-span-9 rounded-3xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between overflow-hidden">
        
        {/* Chat Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-800">Acadrium AI Assistant</h2>
              <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Active contextual retrieval loaded
              </p>
            </div>
          </div>
        </div>

        {/* Messaging Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/20">
          
          {/* Welcome robot box if chat is empty */}
          {aiChats.length <= 1 && (
            <div className="max-w-xl mx-auto rounded-3xl border border-indigo-100 bg-indigo-50/30 p-8 text-center space-y-3 my-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                <Sparkles className="h-7 w-7 animate-bounce" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 mb-1">Knowledge Assistant</h3>
                <p className="text-xs text-slate-655 text-slate-600 leading-relaxed font-semibold">
                  Ask anything about your uploaded classroom materials.
                </p>
              </div>
            </div>
          )}

          {/* Messages list */}
          <div className="space-y-4">
            {aiChats.map((chat, idx) => (
              <div 
                key={idx}
                className={`flex gap-3 max-w-[80%] ${
                  chat.sender === 'user' ? 'ml-auto justify-end' : 'mr-auto justify-start'
                }`}
              >
                {/* Robot Icon for Bot */}
                {chat.sender === 'bot' && (
                  <div className="hidden sm:flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                    <Sparkles className="h-4.5 w-4.5" />
                  </div>
                )}
                
                <div className="flex flex-col">
                  <div className={`rounded-3xl px-5 py-3 text-xs leading-relaxed shadow-2xs whitespace-pre-wrap ${
                    chat.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                  }`}>
                    {chat.text}
                  </div>
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
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-500" style={{ animationDelay: '0ms' }}></span>
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-500" style={{ animationDelay: '150ms' }}></span>
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-500" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 px-2">Acadrium AI thinking...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Large Input capsule bar */}
        <div className="p-4 md:p-6 border-t border-slate-200 bg-white shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputValue);
            }}
            className="flex items-center gap-2 bg-slate-100 rounded-full border border-slate-200 px-2 py-1.5 focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 transition-all"
          >
            <button
              type="button"
              className="cursor-pointer flex h-10 w-10 shrink-0 items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Paperclip className="h-5 w-5" />
            </button>
            <input
              type="text"
              placeholder="Ask anything about your syllabus or lecture uploads..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isTyping}
              className="flex-1 bg-transparent py-2.5 text-xs text-slate-800 outline-hidden placeholder:text-slate-400"
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
    </div>
  );
}
