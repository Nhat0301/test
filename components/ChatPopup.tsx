import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, User, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PatientRecord, PostOpRecord, ChatMessage } from '../types';
import { generateChatResponse } from '../services/geminiService';

interface ChatPopupProps {
  isOpen: boolean;
  onClose: () => void;
  patientData: PatientRecord | PostOpRecord;
  formType: 'pre-op' | 'post-op' | 'internal-med';
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export const ChatPopup: React.FC<ChatPopupProps> = ({ isOpen, onClose, patientData, formType, messages, setMessages }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
        // Reset only input and loading state, not messages
        setInput('');
        setIsLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  if (!isOpen) return null;
  
  const handleSend = async () => {
    if (input.trim() === '' || isLoading) return;
    
    const userMessage: ChatMessage = { role: 'user', text: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await generateChatResponse(patientData, newMessages, formType);
      const aiMessage: ChatMessage = { role: 'model', text: responseText };
      setMessages([...newMessages, aiMessage]);
    } catch (error: any) {
      console.error("Chat AI error:", error);
      let errorMessageText = "Xin lỗi, tôi đã gặp lỗi. Vui lòng thử lại.";
      // Check for the specific 429 error and provide a more informative message
      if (error.toString().includes('429')) {
        errorMessageText = "Lỗi: Đã đạt đến giới hạn yêu cầu. Vui lòng thử lại sau ít phút. Nếu bạn sử dụng chức năng AI quá thường xuyên, lỗi này có thể xảy ra.";
      }
      const errorMessage: ChatMessage = { role: 'model', text: errorMessageText };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl h-[90vh] md:h-[80vh] flex flex-col overflow-hidden border dark:border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-slate-700 flex-shrink-0">
          <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800 dark:text-slate-200"><Bot className="text-purple-600 dark:text-purple-400"/> Trợ lý AI</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300"><X className="w-5 h-5"/></button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Initial message - only show if there are no messages yet */}
          {messages.length === 0 && (
            <div className="flex items-start gap-3 animate-fadeIn">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-full flex-shrink-0"><Bot className="w-5 h-5 text-purple-600 dark:text-purple-400" /></div>
              <div className="bg-gray-100 dark:bg-slate-700 rounded-xl p-3 max-w-[85%]">
                <p className="text-sm font-medium text-gray-800 dark:text-slate-200">Xin chào! Tôi đã truy cập vào hồ sơ của bệnh nhân này. Hãy hỏi tôi bất cứ điều gì về nó.</p>
              </div>
            </div>
          )}

          {messages.map((msg, index) => (
            <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''} animate-fadeIn`}>
              {msg.role === 'model' && <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-full flex-shrink-0"><Bot className="w-5 h-5 text-purple-600 dark:text-purple-400" /></div>}
              <div className={`rounded-xl p-3 max-w-[85%] ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-slate-700'}`}>
                <div className="chat-content dark:text-slate-200">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.text}
                  </ReactMarkdown>
                </div>
              </div>
              {msg.role === 'user' && <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-full flex-shrink-0"><User className="w-5 h-5 text-blue-600 dark:text-blue-400" /></div>}
            </div>
          ))}

          {isLoading && (
             <div className="flex items-start gap-3 animate-fadeIn">
               <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-full flex-shrink-0"><Bot className="w-5 h-5 text-purple-600 dark:text-purple-400" /></div>
               <div className="bg-gray-100 dark:bg-slate-700 rounded-lg p-3 max-w-[85%] flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-500 dark:text-slate-400"/>
                  <span className="text-sm text-gray-500 dark:text-slate-400">Đang suy nghĩ...</span>
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0">
          <div className="relative">
            <input 
              type="text" 
              className="w-full pl-4 pr-14 py-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-purple-300 dark:focus:ring-purple-500 outline-none transition-shadow"
              placeholder="Hỏi một câu về bệnh án..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              disabled={isLoading}
            />
            <button onClick={handleSend} disabled={isLoading || input.trim() === ''} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-slate-600 transition-all active:scale-90">
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
       <style>{`
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .chat-content {
          font-size: 0.875rem; /* 14px */
          line-height: 1.5;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        .chat-content > *:first-child { margin-top: 0; }
        .chat-content > *:last-child { margin-bottom: 0; }
        .chat-content p { margin-bottom: 0.5rem; }
        .chat-content h1, .chat-content h2, .chat-content h3 {
          font-size: 1rem;
          font-weight: 700;
          margin-top: 0.75rem;
          margin-bottom: 0.25rem;
          line-height: 1.2;
        }
        .dark .chat-content h1, .dark .chat-content h2, .dark .chat-content h3 {
          color: #e2e8f0; /* slate-200 */
        }
        .chat-content ul, .chat-content ol {
          padding-left: 1.25rem;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .chat-content li { margin-bottom: 0.25rem; }
        .chat-content strong { font-weight: 700; }
        .chat-content a { color: #4F46E5; text-decoration: underline; }
        .dark .chat-content a { color: #818cf8; }
        .chat-content code {
            font-size: 0.8em;
            background-color: rgba(0,0,0,0.08);
            padding: 0.1em 0.3em;
            border-radius: 4px;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        }
        .dark .chat-content code {
            background-color: rgba(255,255,255,0.1);
            color: #e2e8f0;
        }
        .bg-blue-600 .chat-content a { color: #E0E7FF; }
        .bg-blue-600 .chat-content code { background-color: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
};