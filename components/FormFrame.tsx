import React, { useState } from 'react';
import { X, ExternalLink, Loader2 } from 'lucide-react';

interface FormFrameProps {
  url: string;
  title: string;
  onClose: () => void;
}

export const FormFrame: React.FC<FormFrameProps> = ({ url, title, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in relative">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <div className="flex items-center gap-3">
             <h3 className="text-lg font-bold text-slate-800">{title}</h3>
             <a href={url} target="_blank" rel="noreferrer" className="text-xs flex items-center gap-1 text-brand-600 hover:underline" title="Buka di tab baru">
                <ExternalLink size={12} /> Buka Tab Baru
             </a>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors"
          title="Tutup Form"
        >
          <X size={20} />
        </button>
      </div>
      
      <div className="flex-1 relative bg-slate-100">
        {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-50/80">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="animate-spin text-brand-600" size={32} />
                    <span className="text-sm font-medium text-slate-500">Memuat Formulir...</span>
                </div>
            </div>
        )}
        <iframe 
            src={url} 
            className="w-full h-full border-0" 
            onLoad={() => setIsLoading(false)}
            title="External Form"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      </div>
    </div>
  );
};