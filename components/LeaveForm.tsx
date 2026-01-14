import React, { useState, useEffect } from 'react';
import { LeaveRequest, Status, User, LeaveCategories, CutiTypes, ReasonOptions } from '../types';
import { Send, Calendar, CheckCircle2 } from 'lucide-react';

interface LeaveFormProps {
  currentUser: User;
  onSubmit: (request: LeaveRequest) => void;
  onCancel: () => void;
  initialData?: LeaveRequest | null;
}

export const LeaveForm: React.FC<LeaveFormProps> = ({ currentUser, onSubmit, onCancel, initialData }) => {
  const [name] = useState(currentUser.name);
  const [nip] = useState(currentUser.nip);
  const [position] = useState(currentUser.position);
  const [rank] = useState(currentUser.rank || '-');
  const [department] = useState('UPT SD Negeri Remen 2');
  
  // State for complex leave type selection
  const [mainCategory, setMainCategory] = useState<string>(LeaveCategories.DISPENSASI_DINAS);
  const [selectedCutiType, setSelectedCutiType] = useState<string>(CutiTypes.TAHUNAN);
  const [customCutiInput, setCustomCutiInput] = useState<string>('');

  // State for Reasons
  const [selectedReasonOption, setSelectedReasonOption] = useState<string>(''); // Untuk dropdown
  const [customReasonText, setCustomReasonText] = useState<string>(''); // Untuk text area (Lainnya atau manual)

  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('07:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('14:00');
  
  // Bug fix: Preserve existing ID and DocURL
  const [existingId, setExistingId] = useState<string | null>(null);
  const [existingCreatedAt, setExistingCreatedAt] = useState<string | null>(null);
  const [existingDocUrl, setExistingDocUrl] = useState<string | undefined>(undefined);

  // Load initial data for editing
  useEffect(() => {
    if (initialData) {
      setExistingId(initialData.id);
      setExistingCreatedAt(initialData.createdAt);
      setExistingDocUrl(initialData.docUrl); // Preserve Link
      
      setStartDate(initialData.startDate.split('T')[0]); // Ensure date format
      setEndDate(initialData.endDate.split('T')[0]);
      setStartTime(initialData.startTime);
      setEndTime(initialData.endTime);
      
      // Parse Type
      const type = initialData.type;
      const categories = Object.values(LeaveCategories);
      
      let detectedCategory = LeaveCategories.DISPENSASI_DINAS; // Default fallback

      if (type.startsWith("Cuti:")) {
        detectedCategory = LeaveCategories.CUTI;
        setSelectedCutiType(CutiTypes.LAINNYA);
        setCustomCutiInput(type.replace("Cuti: ", ""));
      } else if (Object.values(CutiTypes).includes(type)) {
        detectedCategory = LeaveCategories.CUTI;
        setSelectedCutiType(type);
      } else if (categories.includes(type)) {
        detectedCategory = type;
      }
      
      setMainCategory(detectedCategory);

      // Parse Reason logic
      const savedReason = initialData.reason;
      
      if (detectedCategory === LeaveCategories.DISPENSASI_PRIBADI) {
        const options = ReasonOptions.DISPENSASI_PRIBADI;
        if (options.includes(savedReason) && savedReason !== 'Alasan lainnya') {
            setSelectedReasonOption(savedReason);
        } else {
            setSelectedReasonOption('Alasan lainnya');
            setCustomReasonText(savedReason);
        }
      } else if (detectedCategory === LeaveCategories.DISPENSASI_DINAS) {
        const options = ReasonOptions.DISPENSASI_DINAS;
        if (options.includes(savedReason) && savedReason !== 'Alasan kedinasan lainnya') {
             setSelectedReasonOption(savedReason);
        } else {
             setSelectedReasonOption('Alasan kedinasan lainnya');
             setCustomReasonText(savedReason);
        }
      } else {
        // Untuk Cuti dan Ijin biasa, langsung masukkan ke custom text
        setCustomReasonText(savedReason);
      }

    }
  }, [initialData]);

  // Reset reason when category changes (if not editing or user changed manually)
  useEffect(() => {
    if (!initialData) {
       setSelectedReasonOption('');
       setCustomReasonText('');
    }
  }, [mainCategory]);

  // Auto-set endDate to startDate when startDate changes if endDate is empty or new
  useEffect(() => {
    if (startDate && (!endDate || !initialData)) {
      setEndDate(startDate);
    }
  }, [startDate, endDate, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !nip || !startDate) return;

    // Determine final Type string
    let finalType = mainCategory;
    if (mainCategory === LeaveCategories.CUTI) {
      if (selectedCutiType === CutiTypes.LAINNYA) {
        if (!customCutiInput.trim()) {
          alert("Silahkan isi jenis cuti!");
          return;
        }
        finalType = `Cuti: ${customCutiInput}`;
      } else {
        finalType = selectedCutiType;
      }
    }

    // Determine final Reason string
    let finalReason = '';
    
    // Logic untuk Dispensasi Pribadi
    if (mainCategory === LeaveCategories.DISPENSASI_PRIBADI) {
        if (!selectedReasonOption) {
            alert("Pilih alasan dispensasi!");
            return;
        }
        if (selectedReasonOption === 'Alasan lainnya') {
            if (!customReasonText.trim()) {
                alert("Tuliskan detail alasan lainnya!");
                return;
            }
            finalReason = customReasonText;
        } else {
            finalReason = selectedReasonOption;
        }
    } 
    // Logic untuk Dispensasi Dinas
    else if (mainCategory === LeaveCategories.DISPENSASI_DINAS) {
        if (!selectedReasonOption) {
            alert("Pilih alasan dispensasi dinas!");
            return;
        }
        if (selectedReasonOption === 'Alasan kedinasan lainnya') {
            if (!customReasonText.trim()) {
                alert("Tuliskan detail alasan dinas lainnya!");
                return;
            }
            finalReason = customReasonText;
        } else {
            finalReason = selectedReasonOption;
        }
    }
    // Logic untuk Ijin / Cuti (Manual Text)
    else {
        if (!customReasonText.trim()) {
            alert("Isi alasan!");
            return;
        }
        finalReason = customReasonText;
    }

    const newRequest: LeaveRequest = {
      id: existingId || Math.random().toString(36).substr(2, 9),
      name,
      nip,
      position,
      rank, // Include rank in request
      department,
      type: finalType,
      startDate,
      endDate: endDate || startDate,
      startTime,
      endTime,
      reason: finalReason,
      status: Status.PENDING, // Reset status to PENDING on edit to re-trigger approval
      createdAt: existingCreatedAt || new Date().toISOString(),
      docUrl: existingDocUrl // Keep the doc url if it exists
    };

    onSubmit(newRequest);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-5 md:p-8 rounded-2xl shadow-sm border border-slate-200 animate-fade-in">
      <header className="mb-6 border-b border-slate-100 pb-4">
        <h2 className="text-xl md:text-2xl font-bold text-slate-800">{initialData ? 'Edit Pengajuan' : 'Form Pengajuan'}</h2>
        <p className="text-sm text-slate-500 mt-1">Lengkapi data di bawah ini dengan benar.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identitas Diri (Updated to 2 rows grid for better readability) */}
        <div className="bg-slate-50/50 p-4 md:p-5 rounded-xl border border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Nama</label>
              <div className="text-sm md:text-base font-semibold text-slate-800">{name}</div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">NIP</label>
              <div className="text-sm md:text-base font-mono text-slate-600">{nip}</div>
            </div>
            <div>
               <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Jabatan</label>
               <div className="text-sm text-slate-700">{position}</div>
            </div>
            <div>
               <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Pangkat</label>
               <div className="text-sm text-slate-700 font-medium">{rank}</div>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Logic Selection Jenis Ijin */}
            <div className="lg:col-span-2 space-y-3 p-4 border border-brand-100 bg-brand-50/30 rounded-xl">
                <label className="block text-sm font-bold text-slate-800">Kategori Ijin</label>
                
                {/* Main Category Selection (Radio Style Cards) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.values(LeaveCategories).map((cat) => (
                    <label key={cat} 
                      className={`cursor-pointer border rounded-lg p-3 min-h-[3rem] flex items-center justify-center text-xs md:text-sm font-medium transition-all text-center h-full active:scale-95 select-none
                      ${mainCategory === cat 
                        ? 'bg-brand-600 text-white border-brand-600 shadow-md ring-2 ring-brand-200 ring-offset-1' 
                        : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300 hover:bg-slate-50'}`}
                    >
                      <input 
                        type="radio" 
                        name="mainCategory" 
                        value={cat} 
                        checked={mainCategory === cat}
                        onChange={(e) => {
                            setMainCategory(e.target.value);
                            // Reset related states
                            setSelectedReasonOption('');
                            setCustomReasonText('');
                        }}
                        className="hidden"
                      />
                      {cat}
                    </label>
                  ))}
                </div>

                {/* Sub Options for CUTI */}
                {mainCategory === LeaveCategories.CUTI && (
                  <div className="animate-fade-in mt-3 bg-white p-4 rounded-lg border border-slate-200">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Jenis Cuti</label>
                    <div className="grid grid-cols-1 gap-3">
                      <select
                        value={selectedCutiType}
                        onChange={(e) => setSelectedCutiType(e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm bg-white"
                      >
                        {Object.values(CutiTypes).map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>

                      {/* Input manual jika pilih LAINNYA */}
                      {selectedCutiType === CutiTypes.LAINNYA && (
                        <div className="mt-1 animate-fade-in">
                          <input
                            type="text"
                            value={customCutiInput}
                            onChange={(e) => setCustomCutiInput(e.target.value)}
                            placeholder="Tuliskan jenis cuti..."
                            className="w-full px-4 py-2.5 border border-brand-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                            required
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
            </div>

            {/* Waktu Mulai */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white">
              <label className="block text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Calendar className="text-brand-500" size={18} /> Tanggal Mulai
              </label>
              <div className="grid grid-cols-5 gap-3">
                <div className="col-span-3">
                   <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none text-sm"
                  />
                </div>
                <div className="col-span-2">
                   <input
                        type="time"
                        required
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none text-sm text-center"
                      />
                </div>
              </div>
            </div>

            {/* Waktu Selesai */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white">
              <label className="block text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Calendar className="text-slate-400" size={18} /> Tanggal Selesai
              </label>
              <div className="grid grid-cols-5 gap-3">
                <div className="col-span-3">
                   <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none text-sm"
                  />
                </div>
                <div className="col-span-2">
                      <input
                        type="time"
                        required
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none text-sm text-center"
                      />
                </div>
              </div>
            </div>
        </div>

        {/* ALASAN SECTION (Dynamic) */}
        <div className="animate-fade-in pt-2">
          <label className="block text-sm font-bold text-slate-800 mb-2">Alasan Detail</label>

          {/* Logic Dropdown untuk Dispensasi Pribadi */}
          {mainCategory === LeaveCategories.DISPENSASI_PRIBADI && (
             <div className="mb-3">
               <select
                 value={selectedReasonOption}
                 onChange={(e) => setSelectedReasonOption(e.target.value)}
                 className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm bg-white shadow-sm"
               >
                 <option value="">-- Pilih Alasan --</option>
                 {ReasonOptions.DISPENSASI_PRIBADI.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                 ))}
               </select>
             </div>
          )}

          {/* Logic Dropdown untuk Dispensasi Dinas */}
          {mainCategory === LeaveCategories.DISPENSASI_DINAS && (
             <div className="mb-3">
               <select
                 value={selectedReasonOption}
                 onChange={(e) => setSelectedReasonOption(e.target.value)}
                 className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm bg-white shadow-sm"
               >
                 <option value="">-- Pilih Alasan Dinas --</option>
                 {ReasonOptions.DISPENSASI_DINAS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                 ))}
               </select>
             </div>
          )}

          {/* Manual Text Area: Muncul jika kategori lain, atau jika pilih opsi 'Lainnya' dari dropdown */}
          {(
             mainCategory === LeaveCategories.IJIN || 
             mainCategory === LeaveCategories.CUTI || 
             (mainCategory === LeaveCategories.DISPENSASI_PRIBADI && selectedReasonOption === 'Alasan lainnya') ||
             (mainCategory === LeaveCategories.DISPENSASI_DINAS && selectedReasonOption === 'Alasan kedinasan lainnya')
           ) && (
              <textarea
                required
                value={customReasonText}
                onChange={(e) => setCustomReasonText(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm text-slate-700 animate-fade-in shadow-sm placeholder:text-slate-400"
                placeholder={mainCategory.includes('Dispensasi') ? "Tuliskan detail alasan..." : "Tuliskan keterangan ijin/cuti..."}
              />
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-slate-100 mt-2">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-6 py-3 border border-slate-300 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-50 transition active:scale-95"
          >
            Batal
          </button>
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 bg-brand-600 text-white font-bold text-sm rounded-xl hover:bg-brand-700 transition shadow-lg shadow-brand-200 flex items-center justify-center gap-2 active:scale-95"
          >
            <Send size={18} />
            {initialData ? 'Update Pengajuan' : 'Kirim Pengajuan'}
          </button>
        </div>
      </form>
    </div>
  );
};