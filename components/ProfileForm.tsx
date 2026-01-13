import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Save, User as UserIcon, Briefcase, Shield, Key } from 'lucide-react';

interface ProfileFormProps {
  user: User;
  onSave: (updatedUser: User) => void;
  onCancel: () => void;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({ user, onSave, onCancel }) => {
  const [name, setName] = useState(user.name);
  const [position, setPosition] = useState(user.position);

  useEffect(() => {
    setName(user.name);
    setPosition(user.position);
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...user, name, position });
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-brand-600 to-indigo-700 px-6 py-6 flex items-center gap-4 text-white">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-brand-600 text-2xl font-bold shadow-lg ring-2 ring-white/30">
            {user.name.charAt(0)}
          </div>
          <div>
             <h2 className="text-xl font-bold tracking-tight">{user.name}</h2>
             <p className="text-brand-100 text-xs font-medium opacity-90">{user.role === 'KEPALA_SEKOLAH' ? 'Kepala Sekolah' : 'Guru / Staff'}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
               <div className="flex items-center gap-1.5 mb-1 pb-1 border-b border-slate-100">
                  <UserIcon size={16} className="text-brand-500" />
                  <h3 className="text-sm font-bold text-slate-800">Data Diri</h3>
               </div>
               
               <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-500 text-sm font-medium"
                    required
                  />
               </div>

               <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Jabatan</label>
                  <div className="relative">
                     <Briefcase size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                     <input
                      type="text"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-500 text-sm"
                      required
                    />
                  </div>
               </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-1.5 mb-1 pb-1 border-b border-slate-100">
                  <Shield size={16} className="text-brand-500" />
                  <h3 className="text-sm font-bold text-slate-800">Akun</h3>
               </div>

               <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">NIP (Username)</label>
                  <div className="relative group">
                     <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">#</span>
                     <input
                      type="text"
                      value={user.nip}
                      disabled
                      className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 text-slate-500 rounded-lg cursor-not-allowed font-mono text-sm"
                    />
                  </div>
               </div>

               <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Role</label>
                   <div className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium flex items-center justify-between">
                      <span>{user.role}</span>
                      <Shield size={14} className="text-slate-400" />
                   </div>
               </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-4">
             <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-brand-600 text-white font-bold text-xs rounded-lg hover:bg-brand-700 transition shadow-sm flex items-center gap-1.5"
              >
                <Save size={14} />
                Simpan
              </button>
          </div>
        </form>
      </div>
    </div>
  );
};