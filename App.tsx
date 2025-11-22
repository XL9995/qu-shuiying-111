import React, { useState } from 'react';
import { PhotoWorkspace } from './components/PhotoWorkspace';
import { VideoWorkspace } from './components/VideoWorkspace';
import { AppMode } from './types';
import { Image as ImageIcon, Video as VideoIcon, Sparkles } from 'lucide-react';

function App() {
  const [mode, setMode] = useState<AppMode>(AppMode.PHOTO);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col relative overflow-x-hidden selection:bg-indigo-500/30">
      {/* Ambient Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] rounded-full bg-purple-600/5 blur-[100px]" />
      </div>

      {/* Header */}
      <header className="border-b border-white/5 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white via-indigo-100 to-slate-400 bg-clip-text text-transparent">
                ClearView AI
              </h1>
              <p className="text-[10px] font-medium text-indigo-300/80 tracking-wider uppercase">Studio Edition</p>
            </div>
          </div>
          
          <nav className="flex bg-slate-800/50 p-1.5 rounded-2xl border border-white/5 backdrop-blur-md">
            <button
              onClick={() => setMode(AppMode.PHOTO)}
              className={`
                flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300
                ${mode === AppMode.PHOTO 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 scale-[1.02]' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'}
              `}
            >
              <ImageIcon className="w-4 h-4" />
              Photo Cleaner
            </button>
            <button
              onClick={() => setMode(AppMode.VIDEO)}
              className={`
                flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300
                ${mode === AppMode.VIDEO 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 scale-[1.02]' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'}
              `}
            >
              <VideoIcon className="w-4 h-4" />
              Video Reconstruct
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative z-10">
        <div className="flex-1 w-full animate-in fade-in duration-500">
          {mode === AppMode.PHOTO ? <PhotoWorkspace /> : <VideoWorkspace />}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 bg-slate-900/40 backdrop-blur-lg mt-auto relative z-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-slate-400 font-medium">Powered by Google Gemini 2.5 Flash & Veo 3.1</p>
          <p className="mt-2 text-xs text-slate-600">Designed for professional media restoration.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;