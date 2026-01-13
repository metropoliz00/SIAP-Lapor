import React, { useState, useEffect } from 'react';
import { LeaveRequest, Status, User, LeaveCategories, CutiTypes } from '../types';
import { Send, Calendar, Clock, ChevronDown } from 'lucide-react';

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

  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('07:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('14:00');
  const [reason, setReason] = useState('');
  const [existingId, setExistingId] = useState<string | null>(null);
  const [existingCreatedAt, setExistingCreatedAt] = useState<string | null>(null);

  // Load initial data for editing
  useEffect(() => {
    if (initialData) {
      setExistingId(initialData.id);
      setExistingCreatedAt(initialData.createdAt);
      setStartDate(initialData.startDate.split('T')[0]); // Ensure date format
      setEndDate(initialData.endDate.split('T')[0]);
      setStartTime(initialData.startTime);
      setEndTime(initialData.endTime);
      setReason(initialData.reason);

      // Parse Type
      const type = initialData.type;
      const categories = Object.values(LeaveCategories);
      
      if (type.startsWith("Cuti:")) {
        setMainCategory(LeaveCategories.CUTI);
        setSelectedCutiType(CutiTypes.LAINNYA);
        setCustomCutiInput(type.replace("Cuti: ", ""));
      } else if (Object.values(CutiTypes).includes(type)) {
        setMainCategory(LeaveCategories.CUTI);
        setSelectedCutiType(type);
      } else if (categories.includes(type)) {
        setMainCategory(type);
      } else {
         // Fallback default
         setMainCategory(LeaveCategories.DISPENSASI_DINAS);
      }
    }
  }, [initialData]);

  // Auto-set endDate to startDate when startDate changes if endDate is empty or new
  useEffect(() => {
    if (startDate && (!endDate || !initialData)) {
      setEndDate(startDate);
    }
  }, [startDate, endDate, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !nip || !startDate || !reason) return;

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
      reason,
      status: Status.PENDING, // Reset status to PENDING on edit
      createdAt: existingCreatedAt || new Date().toISOString()
    };

    onSubmit(newRequest);
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-slate-200 animate-fade-in">
      <header className="mb-4 border-b border-slate-100 pb-3">
        <h2 className="text-xl font-bold text-slate-800">{initialData ? 'Edit Pengajuan' : 'Form Pengajuan'}</h2>
        <p className="text-xs text-slate-500">Lengkapi data untuk mengajukan ijin.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Identitas Diri (Compact) */}
        <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Nama</label>
              <div className="text-sm font-semibold text-slate-800">{name}</div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">NIP</label>
              <div className="text-sm font-mono text-slate-600">{nip}</div>
            </div>
            <div>
               <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Jabatan</label>
               <div className="text-xs text-slate-700">{position}</div>
            </div>
            <div>
               <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Pangkat/Golongan</label>
               <div className="text-xs text-slate-700 font-medium">{rank}</div>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Logic Selection Jenis Ijin */}
            <div className="md:col-span-2 space-y-3 p-3 border border-brand-100 bg-brand-50/30 rounded-lg">
                <label className="block text-xs font-bold text-slate-700">Kategori Ijin</label>
                
                {/* Main Category Selection (Radio Style Cards) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.values(LeaveCategories).map((cat) => (
                    <label key={cat} 
                      className={`cursor-pointer border rounded-lg p-2 flex items-center justify-center text-xs font-medium transition-all text-center h-full
                      ${mainCategory === cat 
                        ? 'bg-brand-600 text-white border-brand-600 shadow-sm' 
                        : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'}`}
                    >
                      <input 
                        type="radio" 
                        name="mainCategory" 
                        value={cat} 
                        checked={mainCategory === cat}
                        onChange={(e) => setMainCategory(e.target.value)}
                        className="hidden"
                      />
                      {cat}
                    </label>
                  ))}
                </div>

                {/* Sub Options for CUTI */}
                {mainCategory === LeaveCategories.CUTI && (
                  <div className="animate-fade-in mt-2 bg-white p-3 rounded border border-slate-200">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Jenis Cuti</label>
                    <div className="grid grid-cols-1 gap-2">
                      <select
                        value={selectedCutiType}
                        onChange={(e) => setSelectedCutiType(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-500 outline-none text-sm bg-white"
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
                            className="w-full px-3 py-2 border border-brand-300 rounded-lg focus:ring-1 focus:ring-brand-500 outline-none text-sm"
                            required
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
            </div>

            {/* Waktu Mulai */}
            <div className="border border-slate-200 rounded-lg p-3 bg-white">
              <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <Calendar className="text-brand-500" size={14} /> Mulai
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                   <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded focus:border-brand-500 outline-none text-xs"
                  />
                </div>
                <div>
                   <input
                        type="time"
                        required
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full px-1 py-1.5 border border-slate-200 rounded focus:border-brand-500 outline-none text-xs text-center"
                      />
                </div>
              </div>
            </div>

            {/* Waktu Selesai */}
            <div className="border border-slate-200 rounded-lg p-3 bg-white">
              <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <Calendar className="text-slate-400" size={14} /> Selesai
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                   <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded focus:border-brand-500 outline-none text-xs"
                  />
                </div>
                <div>
                      <input
                        type="time"
                        required
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full px-1 py-1.5 border border-slate-200 rounded focus:border-brand-500 outline-none text-xs text-center"
                      />
                </div>
              </div>
            </div>
        </div>

        {/* Alasan */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Alasan Detail</label>
          <textarea
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-500 outline-none text-sm text-slate-700"
            placeholder="Tuliskan keterangan tambahan..."
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 transition"
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-lg hover:bg-brand-700 transition flex items-center gap-2"
          >
            <Send size={14} />
            {initialData ? 'Update Pengajuan' : 'Kirim Pengajuan'}
          </button>
        </div>
      </form>
    </div>
  );
};