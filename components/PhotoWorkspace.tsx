import React, { useState, useEffect } from 'react';
import { UploadZone } from './UploadZone';
import { CompareSlider } from './CompareSlider';
import { geminiService, fileToBase64 } from '../services/geminiService';
import { ProcessingStatus, BatchItem } from '../types';
import { Wand2, AlertCircle, X, Loader2, Eye, Trash2, CheckCircle2, Sparkles, Play, Square } from 'lucide-react';

export const PhotoWorkspace: React.FC = () => {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [processingQueue, setProcessingQueue] = useState<boolean>(false);

  // Process queue effect
  useEffect(() => {
    const processNext = async () => {
      if (!processingQueue) return;

      const nextItem = items.find(item => item.status === ProcessingStatus.QUEUED);
      if (!nextItem) {
        setProcessingQueue(false);
        return;
      }

      updateItemStatus(nextItem.id, ProcessingStatus.PROCESSING);

      try {
        const base64 = await fileToBase64(nextItem.file);
        const cleanedBase64 = await geminiService.removeWatermarkImage(base64, nextItem.file.type);
        
        setItems(prev => prev.map(item => {
          if (item.id === nextItem.id) {
            return {
              ...item,
              status: ProcessingStatus.COMPLETED,
              resultUrl: `data:image/png;base64,${cleanedBase64}`
            };
          }
          return item;
        }));
      } catch (err: any) {
        console.error(err);
        updateItemStatus(nextItem.id, ProcessingStatus.ERROR, err.message || "Failed");
      }
    };

    processNext();
  }, [items, processingQueue]);

  const updateItemStatus = (id: string, status: ProcessingStatus, error?: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, status, error } : item
    ));
  };

  const handleFilesSelect = async (files: File[]) => {
    const newItems: BatchItem[] = await Promise.all(files.map(async (file) => {
      const base64 = await fileToBase64(file);
      return {
        id: Math.random().toString(36).substring(7),
        file,
        status: ProcessingStatus.QUEUED,
        originalUrl: `data:${file.type};base64,${base64}`,
        timestamp: Date.now(),
      };
    }));

    setItems(prev => [...prev, ...newItems]);
    // Removed auto-start: setProcessingQueue(true); 
  };

  const removeItem = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setItems(prev => prev.filter(i => i.id !== id));
    if (activeItemId === id) setActiveItemId(null);
  };

  const clearAll = () => {
    setItems([]);
    setActiveItemId(null);
    setProcessingQueue(false);
  };

  const startProcessing = () => {
    setProcessingQueue(true);
  };

  const stopProcessing = () => {
    setProcessingQueue(false);
  };

  const activeItem = items.find(i => i.id === activeItemId);
  const queuedCount = items.filter(i => i.status === ProcessingStatus.QUEUED).length;
  const isProcessing = items.some(i => i.status === ProcessingStatus.PROCESSING);

  return (
    <div className="max-w-7xl mx-auto p-6 min-h-[calc(100vh-100px)]">
      <div className="mb-10 flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="relative">
          <h2 className="text-4xl font-bold text-white mb-2 tracking-tight">Magic Image Cleaner</h2>
          <p className="text-slate-400 text-lg">AI-powered watermark removal for professionals.</p>
          <div className="absolute -left-8 -top-8 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none"></div>
        </div>
        {items.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 bg-slate-900/40 p-2 pr-4 rounded-2xl border border-white/5 backdrop-blur-md shadow-xl">
             <UploadZone 
               accept="image/png,image/jpeg,image/webp" 
               label="Add Photos"
               onFilesSelect={handleFilesSelect}
               isCompact={true}
               disabled={processingQueue}
             />
             
             <div className="h-6 w-px bg-white/10 hidden sm:block"></div>

             {processingQueue ? (
               <button 
                 onClick={stopProcessing}
                 className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border border-red-500/20"
               >
                 <Square className="w-4 h-4 fill-current" />
                 Stop
               </button>
             ) : (
               <button 
                 onClick={startProcessing}
                 disabled={queuedCount === 0}
                 className={`
                   flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border
                   ${queuedCount > 0 
                     ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-transparent shadow-lg shadow-indigo-500/20' 
                     : 'bg-slate-800 text-slate-500 border-white/5 cursor-not-allowed'}
                 `}
               >
                 <Play className="w-4 h-4 fill-current" />
                 Start Processing {queuedCount > 0 && `(${queuedCount})`}
               </button>
             )}

             <div className="h-6 w-px bg-white/10 hidden sm:block"></div>
             
             <button onClick={clearAll} disabled={processingQueue} className="text-slate-400 hover:text-red-400 text-sm font-medium transition-colors disabled:opacity-50">
               Clear Queue
             </button>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="max-w-2xl mx-auto mt-24 animate-in fade-in zoom-in-95 duration-500">
          <div className="bg-slate-900/30 p-1 rounded-[2rem] border border-white/5 backdrop-blur-xl shadow-2xl">
            <UploadZone 
              accept="image/png,image/jpeg,image/webp" 
              label="Upload Photos to Clean"
              onFilesSelect={handleFilesSelect}
            />
          </div>
          <div className="mt-8 grid grid-cols-3 gap-6 text-center">
            {[
                { icon: Sparkles, title: "AI Powered", desc: "Advanced removal" },
                { icon: Wand2, title: "Auto-Fill", desc: "Seamless background" },
                { icon: CheckCircle2, title: "High Quality", desc: "Preserves details" }
            ].map((f, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-indigo-400 mb-1">
                        <f.icon className="w-6 h-6" />
                    </div>
                    <h4 className="text-white font-semibold text-sm">{f.title}</h4>
                    <p className="text-xs text-slate-500">{f.desc}</p>
                </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          {/* Progress Bar */}
          <div className="relative h-1.5 w-full bg-slate-800/50 rounded-full overflow-hidden">
             <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 h-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                style={{ width: `${(items.filter(i => i.status === ProcessingStatus.COMPLETED || i.status === ProcessingStatus.ERROR).length / items.length) * 100}%` }}
             />
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {items.map(item => (
              <div 
                key={item.id} 
                onClick={() => item.status === ProcessingStatus.COMPLETED && setActiveItemId(item.id)}
                className={`
                  group relative bg-slate-800/40 backdrop-blur-md rounded-2xl border transition-all duration-300 overflow-hidden
                  ${activeItemId === item.id ? 'border-indigo-500/50 ring-1 ring-indigo-500/20' : 'border-white/5 hover:border-indigo-500/30'}
                  ${item.status === ProcessingStatus.COMPLETED ? 'cursor-pointer hover:shadow-2xl hover:-translate-y-1' : 'cursor-default'}
                `}
              >
                <div className="aspect-[4/3] relative bg-slate-900/50 overflow-hidden">
                  <img 
                    src={item.resultUrl || item.originalUrl} 
                    alt="Thumbnail" 
                    className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${item.status === ProcessingStatus.PROCESSING ? 'opacity-40 scale-105 blur-sm' : ''}`} 
                  />
                  
                  {/* Status Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {item.status === ProcessingStatus.PROCESSING && (
                       <div className="bg-slate-950/60 p-3 rounded-2xl backdrop-blur-md shadow-xl border border-white/10">
                         <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                       </div>
                    )}
                    {item.status === ProcessingStatus.QUEUED && (
                       <div className="bg-slate-950/60 px-3 py-1.5 rounded-full backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-slate-300 border border-white/5">
                         Queued
                       </div>
                    )}
                    {item.status === ProcessingStatus.ERROR && (
                       <div className="bg-red-500/20 p-3 rounded-full backdrop-blur-md border border-red-500/30">
                         <AlertCircle className="w-6 h-6 text-red-400" />
                       </div>
                    )}
                    {item.status === ProcessingStatus.COMPLETED && (
                       <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 absolute inset-0 flex items-center justify-center backdrop-blur-[2px]">
                          <span className="bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                            Click to Preview
                          </span>
                       </div>
                    )}
                  </div>

                  {/* Quick Actions (Hover) */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2 z-10">
                    <button 
                      onClick={(e) => removeItem(item.id, e)}
                      className="bg-slate-950/60 p-2 rounded-xl hover:bg-red-500/80 text-white backdrop-blur-md transition-colors border border-white/10 shadow-lg"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="p-3.5 flex items-center justify-between border-t border-white/5 bg-white/5">
                  <div className="truncate flex-1 pr-3">
                    <p className="text-sm font-medium text-slate-200 truncate">{item.file.name}</p>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide mt-0.5">
                      {(item.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  
                  {item.status === ProcessingStatus.COMPLETED && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveItemId(item.id);
                      }}
                      className="flex items-center gap-1.5 bg-indigo-600/90 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-lg shadow-indigo-900/20 group-hover:scale-105"
                    >
                      <Eye className="w-3 h-3" />
                      Preview
                    </button>
                  )}
                  {item.status === ProcessingStatus.ERROR && (
                     <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Failed</span>
                  )}
                  {item.status === ProcessingStatus.QUEUED && (
                     <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Waiting</span>
                  )}
                  {item.status === ProcessingStatus.PROCESSING && (
                     <span className="text-[10px] font-medium text-indigo-400 uppercase tracking-wider animate-pulse">Processing</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comparison Modal Overlay */}
      {activeItem && activeItem.resultUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300 p-4">
          <div className="relative w-full max-w-7xl h-[90vh] bg-[#0B1120] rounded-3xl border border-white/10 shadow-2xl flex flex-col ring-1 ring-white/5">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 md:p-5 border-b border-white/5 bg-white/[0.02] shrink-0">
              <div className="flex items-center gap-4">
                 <div className="p-2.5 rounded-xl bg-green-500/10 border border-green-500/20 hidden sm:block">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                 </div>
                 <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">{activeItem.file.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-medium">PROCESSED</span>
                      <span>•</span>
                      <span>{(activeItem.file.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                 </div>
              </div>
              <button 
                onClick={() => setActiveItemId(null)}
                className="group p-2 rounded-xl hover:bg-white/10 transition-colors border border-transparent hover:border-white/5"
              >
                <X className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
              </button>
            </div>
            
            {/* Modal Content - Comparison Slider */}
            <div className="flex-1 overflow-hidden bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-slate-950/50 relative">
               <div className="absolute inset-0 flex items-center justify-center p-2 md:p-8">
                  <CompareSlider 
                    beforeImage={activeItem.originalUrl} 
                    afterImage={activeItem.resultUrl} 
                  />
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};