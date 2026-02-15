import React, { useState, useEffect } from 'react';
import { Lobby } from './components/Lobby';
import { PreOpForm } from './components/PreOpForm';
import { PostOpForm } from './components/PostOpForm';
import { InternalMedForm } from './components/InternalMedForm';
import { SurgicalChoice } from './components/SurgicalChoice';
import { ViewState } from './types';
import { Sun, Moon, KeyRound, Bot } from 'lucide-react';


const getInitialTheme = (): 'light' | 'dark' => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// Background decoration bubbles - Moved outside App component
const Background = () => (
  <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
     <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-200/30 dark:bg-indigo-900/30 blur-3xl mix-blend-multiply animate-blob"></div>
     <div className="absolute top-[10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-200/30 dark:bg-purple-900/30 blur-3xl mix-blend-multiply animate-blob animation-delay-2000"></div>
     <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] rounded-full bg-pink-200/30 dark:bg-pink-900/30 blur-3xl mix-blend-multiply animate-blob animation-delay-4000"></div>
  </div>
);

// API Key Popup Component - Moved outside App component
const ApiKeyPopup: React.FC<{
  apiKeyInput: string;
  setApiKeyInput: (value: string) => void;
  handleApiKeySubmit: (e: React.FormEvent) => void;
  setShowApiKeyPopup: (show: boolean) => void;
  apiKeyError: string | null;
  setApiKeyError: (error: string | null) => void;
}> = ({ apiKeyInput, setApiKeyInput, handleApiKeySubmit, setShowApiKeyPopup, apiKeyError, setApiKeyError }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 w-full max-w-md m-4 border dark:border-slate-700">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-full">
          <KeyRound className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-slate-200">Kích hoạt tính năng AI</h2>
      </div>
      <p className="text-gray-600 dark:text-slate-400 mb-6 text-sm">
        Vui lòng nhập MedKey của bạn để sử dụng các tính năng thông minh, bao gồm chatbot và hỗ trợ viết bệnh án.
      </p>
      <form onSubmit={handleApiKeySubmit}>
        <input
          type="password"
          className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 outline-none transition-all duration-200 ease-in-out shadow-sm text-base ${
            apiKeyError
              ? 'border-red-500 focus:ring-4 focus:ring-red-100 dark:focus:ring-red-900/50'
              : 'border-gray-300 dark:border-slate-600 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/50'
          }`}
          placeholder="Nhập MedKey..."
          value={apiKeyInput}
          onChange={(e) => {
            setApiKeyInput(e.target.value);
            if (apiKeyError) setApiKeyError(null);
          }}
          autoFocus
        />
        {apiKeyError && (
          <p className="text-red-500 text-sm mt-2 animate-shake">{apiKeyError}</p>
        )}
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => {
              setApiKeyInput('');
              setShowApiKeyPopup(false);
              setApiKeyError(null);
            }}
            className="px-5 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-200 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-indigo-200 dark:hover:shadow-indigo-900/50"
          >
            Xác nhận
          </button>
        </div>
      </form>
    </div>
  </div>
);


const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('LOBBY');
  const [user, setUser] = useState<{

  name: string;

  picture: string;

  email: string;

  exp: number;

} | null>(() => {
    const savedUser = localStorage.getItem('medig-user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme());
  const [showApiKeyPopup, setShowApiKeyPopup] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  const isAiEnabled = !!user;

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };
  
  const handleOpenApiKeyPopup = () => {
    setShowApiKeyPopup(true);
  };

const handleApiKeySubmit = async (e: React.FormEvent) => {

  e.preventDefault();

  try {

    const res = await fetch(
      "https://gemini-proxy.minhnaath.workers.dev/verify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          key: apiKeyInput
        })
      }
    );

    if (!res.ok) {

      throw new Error(
        "Server error: " + res.status
      );

    }

    const data = await res.json();

    if (data.success) {

      const newUser = {
        name: "AI User",
        picture: "robot-icon",
        email: "verified-key",
        exp: data.exp
      };

      localStorage.setItem(
        "medig-user",
        JSON.stringify(newUser)
      );

      setUser(newUser);

      setApiKeyInput("");

      setShowApiKeyPopup(false);

      setApiKeyError(null);

    } else {

      setApiKeyError(
        data.error
      );

    }

  } catch (err: any) {

    setApiKeyError(
      "Không thể kết nối server"
    );

  }

};

const daysLeft =
user?.exp
? Math.max(
0,
Math.ceil(
(user.exp - Date.now()) / 86400000
)
)
: 0;

const expDate =
user?.exp
? new Date(user.exp).toLocaleDateString("vi-VN")
: "";

useEffect(() => {

if (
user?.exp &&
Date.now() > user.exp
) {

handleLogout();

}

}, [user]);


  const handleLogout = () => {
    localStorage.removeItem('medig-user');
    setUser(null);
  };

  return (
    <div className="min-h-screen text-gray-800 dark:text-slate-200 relative flex overflow-hidden bg-gray-50 dark:bg-slate-900">
      <Background />
      
      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto relative">
        <header className="relative z-50 px-6 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setView('LOBBY')} role="button">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-sm">
              M
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-800 dark:text-slate-200">MediG</span>
          </div>

          <div className="flex items-center gap-4">
              <button onClick={toggleTheme} className="p-2 rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
                {theme === 'light' ? <Moon className="w-5 h-5 text-gray-600" /> : <Sun className="w-5 h-5 text-yellow-400" />}
              </button>
            {user ? (
              <div className="relative group">
                <button className="flex items-center gap-2 focus:outline-none">
                  {user.picture === 'robot-icon' ? (
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center border-2 border-transparent group-hover:border-indigo-300 transition">
                      <Bot className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                  ) : (
                    <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full border-2 border-transparent group-hover:border-indigo-300 transition" />
                  )}
                  <span className="font-semibold text-sm hidden sm:block dark:text-slate-300">{user.name}</span>
                </button>
                <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto z-50 border dark:border-slate-700">
                  <div className="px-4 py-2 text-xs text-green-500 dark:text-green-400 border-b dark:border-slate-700">Đã kích hoạt AI.
                    Hết hạn: {expDate} ({daysLeft} ngày).</div>
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700">Vô hiệu hóa</button>
                </div>
              </div>
            ) : (
              <button onClick={handleOpenApiKeyPopup} className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg font-semibold text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                <KeyRound className="w-4 h-4 text-gray-600 dark:text-slate-300" />
                <span className="hidden sm:block">Kích hoạt AI</span>
              </button>
            )}
          </div>
        </header>

        <div className="p-4 md:p-8">
          {view === 'LOBBY' && <Lobby onSelectForm={(type) => {
             if (type === 'surgical') setView('SURGICAL_CHOICE');
             if (type === 'internal_med') setView('FORM_INTERNAL_MED');
          }} />}
          {view === 'SURGICAL_CHOICE' && <SurgicalChoice 
            onBack={() => setView('LOBBY')}
            onSelect={(type) => {
              if (type === 'pre_op') setView('FORM_PRE_OP');
              if (type === 'post_op') setView('FORM_POST_OP');
            }}
          />}
          {view === 'FORM_PRE_OP' && <PreOpForm onBack={() => setView('SURGICAL_CHOICE')} isAiEnabled={!!isAiEnabled} />}
          {view === 'FORM_POST_OP' && <PostOpForm onBack={() => setView('SURGICAL_CHOICE')} isAiEnabled={!!isAiEnabled} />}
          {view === 'FORM_INTERNAL_MED' && <InternalMedForm onBack={() => setView('LOBBY')} isAiEnabled={!!isAiEnabled} />}
        </div>
      </main>

      {showApiKeyPopup && <ApiKeyPopup 
        apiKeyInput={apiKeyInput}
        setApiKeyInput={setApiKeyInput}
        handleApiKeySubmit={handleApiKeySubmit}
        setShowApiKeyPopup={setShowApiKeyPopup}
        apiKeyError={apiKeyError}
        setApiKeyError={setApiKeyError}
      />}

      {/* Styles for blob animation */}
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
        .animate-shake {
            animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </div>
  );
};

export default App;