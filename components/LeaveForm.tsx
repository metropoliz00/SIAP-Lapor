import React, { useState } from 'react';
import { LeaveType, LeaveRequest, Status, User } from '../types';
import { Send, Calendar, Clock } from 'lucide-react';

interface LeaveFormProps {
  currentUser: User;
  onSubmit: (request: LeaveRequest) => void;
  onCancel: () => void;
}

export const LeaveForm: React.FC<LeaveFormProps> = ({ currentUser, onSubmit, onCancel }) => {
  const [name] = useState(currentUser.name);
  const [nip] = useState(currentUser.nip);
  const [position] = useState(currentUser.position);
  const [department] = useState('UPT SD Negeri Remen 2');
  
  const [type, setType] = useState<LeaveType>(LeaveType.PERSONAL);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('07:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('14:00');
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !nip || !startDate || !reason) return;

    const newRequest: LeaveRequest = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      nip,
      position,
      department,
      type,
      startDate,
      endDate: endDate || startDate,
      startTime,
      endTime,
      reason,
      status: Status.PENDING,
      createdAt: new Date().toISOString()
    };

    onSubmit(newRequest);
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-slate-200 animate-fade-in">
      <header className="mb-4 border-b border-slate-100 pb-3">
        <h2 className="text-xl font-bold text-slate-800">Form Pengajuan</h2>
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
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Jenis Ijin</label>
                <select
                value={type}
                onChange={(e) => setType(e.target.value as LeaveType)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-500 outline-none text-sm bg-white"
                >
                {Object.values(LeaveType).map((t) => (
                    <option key={t} value={t}>{t}</option>
                ))}
                </select>
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
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Alasan</label>
          <textarea
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-500 outline-none text-sm text-slate-700"
            placeholder="Tuliskan alasan..."
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
            Kirim
          </button>
        </div>
      </form>
    </div>
  );
};