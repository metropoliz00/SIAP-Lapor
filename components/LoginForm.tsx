import React, { useState } from 'react';
import { User } from '../types';
import { Lock, User as UserIcon, LogIn, AlertCircle, ServerCrash, Eye, EyeOff } from 'lucide-react';

interface LoginFormProps {
  users: User[];
  onLogin: (user: User) => void;
  dbError?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({ users, onLogin, dbError }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate small delay for UX
    setTimeout(() => {
        if (users.length === 0) {
          setError('Data belum siap.');
          setIsLoading(false);
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
            setIsLoading(false);
          }
        } else {
          setError('Username tidak ditemukan.');
          setIsLoading(false);
        }
    }, 600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden font-sans">
      
      {/* Animated Background Blobs - Blue Theme */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob"></div>
          <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-sky-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-32 left-20 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Container - Glassmorphism */}
      <div className="relative z-10 w-full max-w-md p-6 m-4">
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/60 p-8 md:p-10 animate-fade-in-up">
          
          {/* Header Section */}
          <div className="text-center mb-10">
            <div className="flex justify-center mb-6">
              <div className="relative group cursor-pointer">
                  {/* Glowing Effect behind logo */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-400 to-sky-400 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                  <img 
                    src="https://siapsekolah.com/wp-content/uploads/2024/08/Kepala-Sekolah-1.png" 
                    alt="Logo Sekolah" 
                    className="relative h-24 w-24 object-cover rounded-full shadow-lg border-4 border-white transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3"
                  />
              </div>
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">
              SIAP <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-500">Lapor</span>
            </h1>
            <p className="text-slate-500 text-s font-bold uppercase tracking-widest mb-1">Sistem Ijin Agenda Pegawai</p>
             <div className="inline-block px-3 py-1 rounded-full bg-blue-50 border border-blue-100 mt-2">
                <p className="text-blue-600 text-[11px] font-extrabold tracking-wider uppercase">UPT SD Negeri Remen 2</p>
             </div>
          </div>

          {/* Error Messages */}
          {dbError && (
            <div className="mb-6 bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-700 px-4 py-3 rounded-2xl flex flex-col gap-1 text-xs shadow-sm animate-pulse">
              <div className="flex items-center gap-1.5 font-bold">
                <ServerCrash size={16} />
                <span>Gagal Koneksi</span>
              </div>
              <p className="opacity-90 leading-tight">{dbError}</p>
            </div>
          )}

          {error && !dbError && (
            <div className="mb-6 bg-orange-50/80 backdrop-blur-sm border border-orange-200 text-orange-700 px-4 py-3 rounded-2xl flex items-center gap-3 text-xs font-bold shadow-sm animate-fade-in">
              <AlertCircle size={18} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Username</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <UserIcon className="text-slate-400 group-focus-within:text-brand-500 transition-colors duration-300" size={20} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-[3px] focus:ring-brand-100 focus:border-brand-500 outline-none transition-all duration-300 text-sm font-semibold text-slate-700 placeholder:text-slate-300 shadow-inner group-hover:bg-white"
                  placeholder="Username"
                  required
                  disabled={!!dbError || isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="text-slate-400 group-focus-within:text-brand-500 transition-colors duration-300" size={20} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-[3px] focus:ring-brand-100 focus:border-brand-500 outline-none transition-all duration-300 text-sm font-semibold text-slate-700 placeholder:text-slate-300 shadow-inner group-hover:bg-white"
                  placeholder="Password"
                  required
                  disabled={!!dbError || isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-brand-600 transition-colors focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={!!dbError || isLoading}
              className={`w-full relative overflow-hidden group text-white font-bold py-4 rounded-2xl transition-all duration-300 shadow-lg shadow-brand-500/20 hover:shadow-brand-500/40 flex items-center justify-center gap-2 text-sm transform active:scale-[0.98] mt-2 tracking-wide
                ${dbError 
                  ? 'bg-slate-400 cursor-not-allowed shadow-none' 
                  : 'bg-gradient-to-r from-blue-600 via-brand-500 to-sky-500 hover:bg-gradient-to-br'
                }`}
            >
              <span className="relative z-10 flex items-center gap-2">
                 {isLoading ? (
                    <>Processing...</>
                 ) : (
                    <>
                        <LogIn size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
                        {dbError ? 'Sistem Offline' : 'Masuk Aplikasi'}
                    </>
                 )}
              </span>
              {/* Shine Effect */}
              {!dbError && <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 transition-all duration-1000 group-hover:left-[100%]"></div>}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-12 text-center">
             <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
               <span>&copy; 2026</span>
               <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
               <span>Dev. Dedy Meyga Saputra, S.Pd, M.Pd</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};