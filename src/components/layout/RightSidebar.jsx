import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '../common/UserContext';
import { Send, Plus, Sparkles, MessageSquareCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function RightSidebar() {
  const { aiChats, sendAiMessage } = useUser();
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);
  const navigate = useNavigate();

  // Auto scroll to bottom of chat
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
    <aside className="flex flex-col h-[calc(100vh-4rem)] w-full lg:w-80 xl:w-96 border-l border-slate-200 bg-slate-50">
      
      {/* AI Header - Clickable to open full assistant */}
      <div 
        onClick={() => navigate('/ai-assistant')}
        className="cursor-pointer flex items-center justify-between bg-white px-6 py-4 border-b border-slate-200 hover:bg-slate-50 transition-colors"
        title="Open Full AI Assistant"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">Acadrium <span className="text-indigo-600 font-semibold">AI Assistant</span></h2>
            <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              PostgreSQL RAG Connected
            </p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* Welcome State */}
        {aiChats.length === 0 && (
          <div 
            onClick={() => navigate('/ai-assistant')}
            className="cursor-pointer rounded-2xl border border-indigo-100 bg-indigo-50/50 p-6 shadow-sm text-center relative overflow-hidden hover:bg-indigo-50 hover:border-indigo-300 transition-all"
            title="Open Full AI Assistant"
          >
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <MessageSquareCode className="h-8 w-8" />
            </div>
            <h4 className="text-xs font-bold text-slate-800 mb-2">Acadrium AI Academic Companion</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
              Ask questions about lecture files, announcements, or study notes. Click to open full workspace.
            </p>
          </div>
        )}

        {/* Message bubble streams */}
        <div className="space-y-3">
          {aiChats.map((chat, idx) => (
            <div 
              key={idx} 
              className={`flex flex-col max-w-[85%] ${
                chat.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
              }`}
            >
              <div className={`rounded-2xl px-4 py-2.5 text-xs shadow-2xs whitespace-pre-wrap leading-relaxed ${
                chat.sender === 'user' 
                  ? 'bg-indigo-600 text-white rounded-br-none' 
                  : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none font-medium'
              }`}>
                {chat.text}
              </div>
              <span className="text-[9px] text-slate-400 mt-1 px-1 font-semibold">{chat.time}</span>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex flex-col items-start mr-auto max-w-[85%]">
              <div className="rounded-2xl rounded-bl-none border border-slate-200 bg-white px-4 py-3 shadow-2xs">
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-500" style={{ animationDelay: '0ms' }}></span>
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-500" style={{ animationDelay: '150ms' }}></span>
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-500" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
              <span className="text-[9px] text-slate-400 mt-1 px-1">Acadrium AI typing...</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Input Box capsule */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputValue);
          }}
          className="relative flex items-center bg-slate-100 rounded-full border border-slate-200 px-3 focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 transition-all"
        >
          <input
            type="text"
            placeholder="Ask Acadrium AI..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isTyping}
            className="flex-1 bg-transparent py-2.5 text-xs text-slate-800 outline-hidden placeholder:text-slate-400"
          />

          <button
            type="submit"
            disabled={!inputValue.trim() || isTyping}
            className={`cursor-pointer flex h-8 w-8 items-center justify-center rounded-full text-white transition-all shadow-xs shrink-0 ${
              inputValue.trim() && !isTyping
                ? 'bg-indigo-600 hover:bg-indigo-700'
                : 'bg-slate-300 cursor-not-allowed'
            }`}
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </aside>
  );
}
