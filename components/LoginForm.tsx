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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-transparent">
      {/* Decorative Elements matching the geometric theme */}
      <div className="absolute inset-0 pointer-events-none">
         <div className="absolute top-10 left-10 w-32 h-32 border border-brand-200/50 rounded-full blur-xl"></div>
         <div className="absolute bottom-10 right-10 w-64 h-64 border border-blue-200/50 rounded-full blur-2xl"></div>
      </div>

      <div className="relative z-10 bg-white/80 backdrop-blur-md p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-sm border border-white/60 animate-fade-in-up">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="relative">
                <div className="absolute inset-0 bg-brand-400 rounded-full blur-lg opacity-20"></div>
                <img 
                  src="https://siapsekolah.com/wp-content/uploads/2024/08/Kepala-Sekolah-1.png" 
                  alt="Logo Sekolah" 
                  className="relative h-24 w-24 object-cover rounded-full drop-shadow-sm hover:scale-105 transition-transform duration-300 border-4 border-white shadow-md"
                />
            </div>
          </div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">
            SIAP <span className="text-brand-600">Lapor</span>
          </h1>
          <p className="text-slate-500 mt-1 text-xs font-medium">Sistem Ijin Agenda Pegawai</p>
        </div>

        {dbError && (
          <div className="mb-4 bg-red-50/90 border border-red-200 text-red-700 px-3 py-2 rounded-lg flex flex-col gap-1 text-xs shadow-sm animate-pulse">
            <div className="flex items-center gap-1.5 font-bold">
              <ServerCrash size={14} />
              <span>Gagal Koneksi</span>
            </div>
            <p className="opacity-90 leading-tight">{dbError}</p>
          </div>
        )}

        {error && !dbError && (
          <div className="mb-4 bg-orange-50/90 border border-orange-100 text-orange-700 px-3 py-2 rounded-lg flex items-center gap-2 text-xs font-medium shadow-sm animate-fade-in">
            <AlertCircle size={14} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Username</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon className="text-slate-400 group-focus-within:text-brand-500 transition-colors" size={16} />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all text-sm font-medium text-slate-700 placeholder:text-slate-400"
                placeholder="Username"
                required
                disabled={!!dbError}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Password</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="text-slate-400 group-focus-within:text-brand-500 transition-colors" size={16} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all text-sm font-medium text-slate-700 placeholder:text-slate-400"
                placeholder="Password"
                required
                disabled={!!dbError}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!!dbError}
            className={`w-full text-white font-bold py-2.5 rounded-lg transition-all duration-200 shadow-lg flex items-center justify-center gap-2 text-sm transform active:scale-[0.98] mt-2
              ${dbError 
                ? 'bg-slate-400 cursor-not-allowed shadow-none' 
                : 'bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 shadow-brand-500/30'
              }`}
          >
            <LogIn size={16} />
            {dbError ? 'Offline' : 'Masuk'}
          </button>
        </form>

        <div className="mt-8 text-center pt-4 border-t border-slate-200/50">
           <p className="text-[10px] text-slate-500 font-medium">
             @2026 | Dev Dedy Meyga Saputra, S.Pd, M.Pd
           </p>
        </div>
      </div>
    </div>
  );
};