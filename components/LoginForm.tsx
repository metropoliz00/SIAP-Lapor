import React, { useState } from 'react';
import { User } from '../types';
import { Lock, User as UserIcon, LogIn, AlertCircle, ServerCrash } from 'lucide-react';

interface LoginFormProps {
  users: User[];
  onLogin: (user: User) => void;
  dbError?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({ users, onLogin, dbError }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (users.length === 0) {
      setError('Data belum siap.');
      return;
    }

    const inputUsername = username.trim();
    const inputPass = password.trim();

    const user = users.find(u => 
      (u.username && u.username === inputUsername) || 
      (u.nip === inputUsername)
    );

    if (user) {
      const userPass = user.password || user.nip;
      if (inputPass === userPass) {
        onLogin(user);
      } else {
        setError('Password salah.');
      }
    } else {
      setError('Username tidak ditemukan.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-100">
      
      {/* Container Login dengan Animasi Masuk Smooth */}
      <div className="relative z-10 bg-white p-8 md:p-10 rounded-3xl shadow-xl w-full max-w-sm border border-slate-200 animate-fade-in-up">
        
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative animate-float">
                {/* Efek Glow Halus di belakang logo */}
                <div className="absolute inset-0 bg-brand-400 rounded-full blur-xl opacity-20"></div>
                <img 
                  src="https://siapsekolah.com/wp-content/uploads/2024/08/Kepala-Sekolah-1.png" 
                  alt="Logo Sekolah" 
                  className="relative h-28 w-28 object-cover rounded-full drop-shadow-md border-4 border-white"
                />
            </div>
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tighter mb-1">
            SIAP <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600">Lapor</span>
          </h1>
          <p className="text-slate-500 text-xs font-semibold tracking-wide">Sistem Ijin Agenda Pegawai</p>
        </div>

        {dbError && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex flex-col gap-1 text-xs shadow-sm animate-pulse">
            <div className="flex items-center gap-1.5 font-bold">
              <ServerCrash size={16} />
              <span>Gagal Koneksi</span>
            </div>
            <p className="opacity-90 leading-tight">{dbError}</p>
          </div>
        )}

        {error && !dbError && (
          <div className="mb-6 bg-orange-50 border border-orange-100 text-orange-700 px-4 py-3 rounded-xl flex items-center gap-3 text-xs font-bold shadow-sm animate-fade-in">
            <AlertCircle size={18} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Username</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <UserIcon className="text-slate-400 group-focus-within:text-brand-500 transition-colors duration-300" size={18} />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-brand-100 focus:border-brand-500 outline-none transition-all duration-300 text-sm font-semibold text-slate-700 placeholder:text-slate-400 shadow-sm"
                placeholder="Username"
                required
                disabled={!!dbError}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Password</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="text-slate-400 group-focus-within:text-brand-500 transition-colors duration-300" size={18} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-brand-100 focus:border-brand-500 outline-none transition-all duration-300 text-sm font-semibold text-slate-700 placeholder:text-slate-400 shadow-sm"
                placeholder="Password"
                required
                disabled={!!dbError}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!!dbError}
            className={`w-full text-white font-bold py-3.5 rounded-xl transition-all duration-300 shadow-lg hover:shadow-brand-500/40 flex items-center justify-center gap-2 text-sm transform active:scale-[0.97] mt-4 tracking-wide
              ${dbError 
                ? 'bg-slate-400 cursor-not-allowed shadow-none' 
                : 'bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500'
              }`}
          >
            <LogIn size={18} />
            {dbError ? 'Sistem Offline' : 'Masuk Aplikasi'}
          </button>
        </form>

        <div className="mt-10 text-center pt-6 border-t border-slate-100">
           <p className="text-[10px] text-slate-400 font-semibold tracking-wide">
             @2026 | Dev. Dedy Meyga Saputra, S.Pd, M.Pd
           </p>
        </div>
      </div>
    </div>
  );
};