import React, { useState, useEffect } from 'react';
import { UploadZone } from './UploadZone';
import { geminiService, fileToBase64 } from '../services/geminiService';
import { ProcessingStatus, BatchItem, VideoResolution, VideoAspectRatio } from '../types';
import { Film, AlertCircle, Trash2, Loader2, KeyRound, Play, Download, Settings2, ChevronDown, Image as ImageIcon, MonitorPlay, Wand2 } from 'lucide-react';

export const VideoWorkspace: React.FC = () => {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [processingQueue, setProcessingQueue] = useState<boolean>(false);
  const [promptText, setPromptText] = useState("Smooth cinematic motion, natural lighting");
  const [apiKeyError, setApiKeyError] = useState<boolean>(false);
  
  // Video Configuration State
  const [resolution, setResolution] = useState<VideoResolution>('720p');
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>('16:9');

  // Dropdown state
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdown && !(event.target as Element).closest('.download-menu')) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeDropdown]);

  // Process queue effect
  useEffect(() => {
    const processNext = async () => {
      if (!processingQueue) return;
      
      const nextItem = items.find(item => item.status === ProcessingStatus.QUEUED);
      
      if (!nextItem) {
        const isAnyProcessing = items.some(i => i.status === ProcessingStatus.PROCESSING);
        if (!isAnyProcessing) {
            setProcessingQueue(false);
        }
        return;
      }

      if (items.some(i => i.status === ProcessingStatus.PROCESSING)) return;

      updateItemStatus(nextItem.id, ProcessingStatus.PROCESSING);

      try {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        if (!hasKey) {
          await (window as any).aistudio.openSelectKey();
        }

        const apiKey = process.env.API_KEY;
        if (!apiKey) throw new Error("API Key not available. Please select a paid key.");

        const base64 = await fileToBase64(nextItem.file);
        
        const jobResolution = resolution;
        const jobAspectRatio = aspectRatio;

        const videoUrl = await geminiService.reconstructVideo(
          apiKey, 
          base64, 
          nextItem.file.type, 
          promptText, 
          jobResolution, 
          jobAspectRatio
        );
        
        setItems(prev => prev.map(item => {
          if (item.id === nextItem.id) {
            return {
              ...item,
              status: ProcessingStatus.COMPLETED,
              resultUrl: videoUrl,
              videoConfig: {
                resolution: jobResolution,
                aspectRatio: jobAspectRatio
              }
            };
          }
          return item;
        }));
      } catch (err: any) {
        console.error(err);
        let errorMsg = err.message || "Failed to reconstruct video";
        if (err.message?.includes("Requested entity was not found")) {
            errorMsg = "API Key Issue. Reset key.";
            setApiKeyError(true);
        }
        updateItemStatus(nextItem.id, ProcessingStatus.ERROR, errorMsg);
      }
    };

    processNext();
  }, [items, processingQueue, promptText, resolution, aspectRatio]);

  const updateItemStatus = (id: string, status: ProcessingStatus, error?: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, status, error } : item
    ));
  };

  const handleFilesSelect = async (files: File[]) => {
    setApiKeyError(false);
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
    setProcessingQueue(true);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const clearAll = () => {
    setItems([]);
    setProcessingQueue(false);
  };

  const handleKeySelection = async () => {
      try {
          await (window as any).aistudio.openSelectKey();
          setApiKeyError(false);
      } catch (e) {
          console.error(e);
      }
  }

  return (
    <div className="max-w-7xl mx-auto p-6 min-h-[calc(100vh-100px)]">
      <div className="mb-10 text-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-32 bg-blue-500/10 blur-3xl rounded-[50%] pointer-events-none" />
        <h2 className="text-4xl font-bold text-white mb-3 relative z-10">Video Reconstruction</h2>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg relative z-10">
          Configure your output and generate high-fidelity video reconstructions using Veo.
        </p>
        <div className="mt-6 flex justify-center relative z-10">
             <button onClick={handleKeySelection} className="group flex items-center gap-2.5 bg-slate-900/50 hover:bg-slate-800 text-slate-300 px-4 py-2 rounded-full border border-white/10 transition-all hover:border-blue-500/30 backdrop-blur-md text-sm font-medium">
                <KeyRound className="w-3.5 h-3.5 text-blue-400" />
                <span>Configure Billing API Key</span>
             </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="max-w-5xl mx-auto">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             
             {/* Config Panel */}
             <div className="md:col-span-1 space-y-6">
                <div className="bg-slate-900/40 p-6 rounded-3xl border border-white/5 backdrop-blur-xl shadow-xl h-full">
                    <div className="flex items-center gap-2.5 text-white font-semibold mb-6">
                       <div className="p-2 rounded-lg bg-blue-500/10">
                           <Settings2 className="w-5 h-5 text-blue-400" />
                       </div>
                       Output Config
                    </div>
                    
                    <div className="space-y-5">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Prompt Guide</label>
                        <textarea 
                          value={promptText}
                          onChange={(e) => setPromptText(e.target.value)}
                          rows={4}
                          className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none resize-none transition-all placeholder:text-slate-600"
                          placeholder="Describe the motion and style..."
                        />
                      </div>

                      <div className="space-y-4">
                        <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Resolution</label>
                           <div className="relative">
                             <select 
                               value={resolution}
                               onChange={(e) => setResolution(e.target.value as VideoResolution)}
                               className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none appearance-none cursor-pointer"
                             >
                                <option value="720p">720p HD</option>
                                <option value="1080p">1080p Full HD</option>
                             </select>
                             <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                           </div>
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Aspect Ratio</label>
                           <div className="relative">
                             <select 
                               value={aspectRatio}
                               onChange={(e) => setAspectRatio(e.target.value as VideoAspectRatio)}
                               className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none appearance-none cursor-pointer"
                             >
                                <option value="16:9">16:9 Landscape</option>
                                <option value="9:16">9:16 Portrait</option>
                             </select>
                             <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                           </div>
                        </div>
                      </div>
                    </div>
                </div>
             </div>

             {/* Upload Area */}
             <div className="md:col-span-2">
                 <div className="h-full bg-slate-900/20 rounded-[2.5rem] p-1.5 border border-white/5">
                    <UploadZone 
                        accept="image/png,image/jpeg" 
                        label="Upload Reference Frames"
                        onFilesSelect={handleFilesSelect}
                    />
                 </div>
             </div>
           </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 bg-slate-900/40 backdrop-blur-md p-6 rounded-2xl border border-white/5 shadow-lg">
              <div className="flex-1">
                 <div className="flex items-baseline gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">Processing Queue</h3>
                    <span className="text-sm text-slate-400 font-medium">
                        {items.filter(i => i.status === ProcessingStatus.COMPLETED).length} / {items.length} Completed
                    </span>
                 </div>
                 <div className="w-full max-w-md h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-700 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                        style={{ width: `${(items.filter(i => i.status === ProcessingStatus.COMPLETED || i.status === ProcessingStatus.ERROR).length / items.length) * 100}%` }}
                    />
                 </div>
              </div>
              <div className="flex items-center gap-3">
                 <button onClick={clearAll} className="text-slate-400 hover:text-red-400 text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-slate-800 transition-colors">
                    Clear All
                 </button>
                 <div className="h-8 w-px bg-white/10 mx-2"></div>
                 <UploadZone 
                    accept="image/png,image/jpeg" 
                    label="Add"
                    onFilesSelect={handleFilesSelect}
                    isCompact={true}
                 />
              </div>
          </div>
          
          {apiKeyError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-200 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 shadow-lg shadow-red-900/10">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                  <span className="text-sm font-medium">API Key authentication failed. Please click the 'Configure Billing API Key' button at the top.</span>
              </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {items.map(item => (
              <div 
                key={item.id} 
                className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/5 p-4 flex flex-col md:flex-row gap-6 items-start md:items-center relative group hover:border-blue-500/20 transition-all hover:bg-slate-900/80"
              >
                {/* Thumbnail */}
                <div className="w-full md:w-72 aspect-video bg-black rounded-xl overflow-hidden flex-shrink-0 relative shadow-xl border border-white/5">
                    <img src={item.originalUrl} className="w-full h-full object-cover opacity-50 group-hover:opacity-60 transition-opacity" alt="Reference" />
                    
                    {/* Thumbnail Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                         {item.status === ProcessingStatus.PROCESSING && (
                           <div className="flex flex-col items-center gap-3 bg-slate-950/80 p-4 rounded-2xl backdrop-blur-md border border-white/10">
                             <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                             <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">Generating</span>
                           </div>
                         )}
                         {item.status === ProcessingStatus.QUEUED && (
                            <div className="bg-black/60 backdrop-blur-sm border border-white/10 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-medium">
                                Pending
                            </div>
                         )}
                         {item.status === ProcessingStatus.ERROR && <AlertCircle className="w-10 h-10 text-red-400 drop-shadow-lg" />}
                         {item.status === ProcessingStatus.COMPLETED && (
                            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center backdrop-blur-sm border border-blue-500/40">
                                <Film className="w-6 h-6 text-blue-400 drop-shadow-lg" />
                            </div>
                         )}
                    </div>

                    {item.videoConfig && (
                        <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md text-[10px] font-medium text-white px-2 py-1 rounded-md border border-white/10">
                          {item.videoConfig.resolution} • {item.videoConfig.aspectRatio}
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 w-full flex flex-col justify-center h-full space-y-3">
                   <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg text-white font-semibold truncate max-w-[200px] md:max-w-md" title={item.file.name}>
                          {item.file.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                            <div className={`w-1.5 h-1.5 rounded-full ${
                                item.status === ProcessingStatus.COMPLETED ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' :
                                item.status === ProcessingStatus.PROCESSING ? 'bg-blue-400 animate-pulse' :
                                'bg-slate-600'
                            }`} />
                            <p className="text-xs text-slate-400 font-medium">
                                {item.status === ProcessingStatus.COMPLETED ? "Generation Successful" : 
                                item.status === ProcessingStatus.PROCESSING ? "Analyzing and rendering..." :
                                item.status === ProcessingStatus.QUEUED ? "Waiting in queue..." :
                                item.error || "Ready"}
                            </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeItem(item.id)} 
                        className="text-slate-600 hover:text-red-400 p-2 rounded-xl hover:bg-red-500/10 transition-colors"
                        title="Remove item"
                      >
                         <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                   
                   {/* Actions */}
                   {item.status === ProcessingStatus.COMPLETED && item.resultUrl && (
                       <div className="flex gap-3 pt-1 items-center">
                           <a 
                                href={item.resultUrl} 
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all border border-white/5 hover:border-white/10"
                            >
                                <Play className="w-3 h-3 fill-current" />
                                Preview
                            </a>
                            
                            {/* Download Menu */}
                            <div className="relative download-menu">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveDropdown(activeDropdown === item.id ? null : item.id);
                                }}
                                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all shadow-lg shadow-blue-500/20"
                              >
                                <Download className="w-3 h-3" />
                                Download
                                <ChevronDown className={`w-3 h-3 opacity-70 transition-transform duration-200 ${activeDropdown === item.id ? 'rotate-180' : ''}`} />
                              </button>
                              
                              {activeDropdown === item.id && (
                                <div className="absolute left-0 md:left-auto md:right-0 top-full mt-3 w-64 bg-[#1e293b] border border-slate-600/50 rounded-2xl shadow-2xl z-20 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 ring-1 ring-black/20">
                                  <div className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-900/80 border-b border-slate-700">
                                    Available Assets
                                  </div>
                                  <a 
                                    href={item.resultUrl} 
                                    download={`veo_render_${item.id}.mp4`}
                                    onClick={() => setActiveDropdown(null)}
                                    className="flex items-center gap-3.5 px-5 py-3.5 hover:bg-slate-700/50 transition-colors group/item"
                                  >
                                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover/item:bg-blue-500 group-hover/item:text-white transition-colors">
                                        <MonitorPlay className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <div className="text-sm font-medium text-slate-200 group-hover/item:text-white">Download Video</div>
                                      <div className="text-[10px] text-slate-500">{item.videoConfig?.resolution} • {item.videoConfig?.aspectRatio} • MP4</div>
                                    </div>
                                  </a>
                                  
                                  <div className="h-px bg-slate-700/50 mx-4 my-0"></div>
                                  
                                  <a 
                                    href={item.originalUrl} 
                                    download={`reference_${item.file.name}`}
                                    onClick={() => setActiveDropdown(null)}
                                    className="flex items-center gap-3.5 px-5 py-3.5 hover:bg-slate-700/50 transition-colors group/item"
                                  >
                                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover/item:bg-indigo-500 group-hover/item:text-white transition-colors">
                                        <ImageIcon className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <div className="text-sm font-medium text-slate-200 group-hover/item:text-white">Reference Frame</div>
                                      <div className="text-[10px] text-slate-500">Original Source Image</div>
                                    </div>
                                  </a>
                                </div>
                              )}
                            </div>
                       </div>
                   )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};