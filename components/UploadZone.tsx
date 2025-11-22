import React, { useCallback, useState } from 'react';
import { FileImage, FileVideo, Plus, UploadCloud } from 'lucide-react';

interface UploadZoneProps {
  onFilesSelect: (files: File[]) => void;
  accept: string;
  label: string;
  isCompact?: boolean;
  disabled?: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFilesSelect, accept, label, isCompact = false, disabled = false }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelect(Array.from(e.dataTransfer.files));
    }
  }, [onFilesSelect, disabled]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelect(Array.from(e.target.files));
    }
    // Reset value so same files can be selected again if needed
    e.target.value = '';
  }, [onFilesSelect]);

  if (isCompact) {
    return (
       <div className={`relative inline-block ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <input
            type="file"
            accept={accept}
            multiple
            onChange={handleChange}
            disabled={disabled}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <button disabled={disabled} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all border border-white/10 backdrop-blur-md hover:shadow-lg hover:shadow-indigo-500/10">
            <Plus className="w-4 h-4" />
            <span>Add Files</span>
          </button>
       </div>
    )
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative w-full h-72 rounded-3xl flex flex-col items-center justify-center transition-all duration-500 ease-out
        border-[3px] border-dashed
        ${isDragging 
          ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01] shadow-2xl shadow-indigo-500/20' 
          : 'border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50 hover:border-slate-600'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer group'}
      `}
    >
      <input
        type="file"
        accept={accept}
        multiple
        onChange={handleChange}
        disabled={disabled}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />
      
      <div className="flex flex-col items-center text-center p-6 space-y-5 pointer-events-none">
        <div className={`
          p-5 rounded-2xl shadow-2xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3
          ${isDragging ? 'bg-indigo-500 text-white' : 'bg-gradient-to-br from-slate-700 to-slate-800 border border-white/5'}
        `}>
           {accept.includes('video') ? (
            <FileVideo className={`w-10 h-10 ${isDragging ? 'text-white' : 'text-blue-400'}`} />
          ) : (
            <FileImage className={`w-10 h-10 ${isDragging ? 'text-white' : 'text-indigo-400'}`} />
          )}
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-white group-hover:text-indigo-300 transition-colors">{label}</h3>
          <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
            Drag & drop your files here, or click to browse.
            <br />
            <span className="text-xs opacity-60">Supports high-resolution batch uploads</span>
          </p>
        </div>
        
        <div className="pt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-y-2 group-hover:translate-y-0">
            <div className="flex items-center gap-2 text-xs font-medium text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-full">
                <UploadCloud className="w-3 h-3" />
                <span>Ready to upload</span>
            </div>
        </div>
      </div>
    </div>
  );
};