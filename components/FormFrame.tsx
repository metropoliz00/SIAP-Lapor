import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Loader2 } from 'lucide-react';
import { FORM_LINKS } from '../types';

interface FormFrameProps {
  url: string;
  title: string;
  onClose: () => void;
}

export const FormFrame: React.FC<FormFrameProps> = ({ url, title, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);

  // Fallback timeout jika onLoad tidak trigger (misal karena cache atau network quirk)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 5000); // 5 detik max loading spinner
    return () => clearTimeout(timer);
  }, []);

  // Cek apakah URL adalah form yang membutuhkan frame panjang (1300px++)
  // Menggunakan 'includes' untuk mencocokkan URL meskipun ada perbedaan minor query params
  // Update: Menambahkan Formulir Ijin ke dalam logic ini sesuai permintaan
  const isTallForm = url.includes(FORM_LINKS.DISPENSASI_DINAS) || 
                     url.includes(FORM_LINKS.DISPENSASI_PRIBADI) || 
                     url.includes(FORM_LINKS.IJIN);
  
  // Gunakan height fix yang panjang (1500px) untuk Form Google agar scroll terjadi di page utama, bukan di iframe.
  // Jika tidak match (fallback), gunakan viewport relative height.
  const containerHeightClass = isTallForm 
    ? "h-[1500px]" 
    : "h-[85vh] md:h-[calc(100vh-7rem)]";

  return (
    <div className={`w-full ${containerHeightClass} flex flex-col bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden animate-fade-in relative transition-all duration-300`}>
      <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50 z-20 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3">
             <h3 className="text-base font-bold text-slate-800">{title}</h3>
             <a href={url} target="_blank" rel="noreferrer" className="text-xs flex items-center gap-1 text-brand-600 hover:underline bg-brand-50 px-2 py-1 rounded-full border border-brand-100" title="Buka di tab baru">
                <ExternalLink size={10} /> Tab Baru
             </a>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors"
          title="Tutup Form"
        >
          <X size={18} />
        </button>
      </div>
      
      <div className="flex-1 relative bg-white w-full h-full">
        {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-50/80 backdrop-blur-sm pointer-events-none">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="animate-spin text-brand-600" size={32} />
                    <span className="text-sm font-bold text-slate-500 animate-pulse">Memuat Formulir...</span>
                </div>
            </div>
        )}
        <iframe 
            src={url} 
            className="w-full h-full border-0 block" 
            onLoad={() => setIsLoading(false)}
            title="External Form"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            style={{ display: 'block' }} 
        />
      </div>
    </div>
  );
};