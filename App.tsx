import React, { useState, useEffect, useRef } from 'react';
import { ViewState, LeaveRequest, Status, User } from './types';
import { Dashboard } from './components/Dashboard';
import { LeaveForm } from './components/LeaveForm';
import { LoginForm } from './components/LoginForm';
import { ProfileForm } from './components/ProfileForm';
import { UserManagement } from './components/UserManagement';
import { FormFrame } from './components/FormFrame';
import { DatabaseView } from './components/DatabaseView';
import { 
  syncToSpreadsheet, 
  updateRequestToSheet,
  updateSheetStatus, 
  deleteLeaveRequest, 
  syncUsersToSpreadsheet, 
  getUsersFromSheet, 
  getRequestsFromSheet,
  generatePdf
} from './services/sheetService';
import { LayoutDashboard, PlusCircle, LogOut, Menu, X, CheckCircle2, Settings, Users, Bell, Loader2, RefreshCw, ChevronRight } from 'lucide-react';

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'info' | 'error';
}

const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>('LOGIN');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showToast, setShowToast] = useState<ToastState>({show: false, message: '', type: 'success'});
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dbError, setDbError] = useState<string>('');
  const [editingRequest, setEditingRequest] = useState<LeaveRequest | null>(null);
  
  const [activeFormUrl, setActiveFormUrl] = useState('');
  const [activeFormTitle, setActiveFormTitle] = useState('');

  const prevRequestsRef = useRef<LeaveRequest[]>(requests);

  const loadData = async () => {
    setIsLoadingData(true);
    setDbError('');
    try {
      const [fetchedUsers, fetchedRequests] = await Promise.all([
        getUsersFromSheet(),
        getRequestsFromSheet()
      ]);

      if (fetchedUsers && fetchedUsers.length > 0) {
        setUsers(fetchedUsers);
      } else {
        setDbError("Gagal memuat data pegawai.");
      }

      if (fetchedRequests && fetchedRequests.length > 0) {
        setRequests(fetchedRequests);
      }
    } catch (error) {
      setDbError("Kesalahan jaringan.");
      setShowToast({ show: true, message: 'Gagal terhubung ke database.', type: 'error' });
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setView('DASHBOARD');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('LOGIN');
    setIsSidebarOpen(false);
  };

  const handleUpdateProfile = async (updatedUser: User) => {
    const newUsers = users.map(u => u.nip === updatedUser.nip ? updatedUser : u);
    setUsers(newUsers);
    setCurrentUser(updatedUser);
    setView('DASHBOARD');
    const success = await syncUsersToSpreadsheet(newUsers);
    if (success) setShowToast({ show: true, message: 'Profil disimpan!', type: 'success' });
    else setShowToast({ show: true, message: 'Gagal simpan ke server.', type: 'error' });
  };

  const handleUpdateUserDatabase = (originalNip: string, updatedUser: User) => {
    const newUsers = users.map(u => u.nip === originalNip ? updatedUser : u);
    setUsers(newUsers);
    setShowToast({ show: true, message: 'Data lokal diupdate.', type: 'info' });
    if (currentUser && currentUser.nip === originalNip) setCurrentUser(updatedUser);
  };

  const handleAddUser = async (newUser: User) => {
    const newUsers = [...users, newUser];
    setUsers(newUsers);
    setShowToast({ show: true, message: 'Menyimpan ke server...', type: 'info' });
    
    const success = await syncUsersToSpreadsheet(newUsers);
    if (success) {
      setShowToast({ show: true, message: 'Pegawai berhasil ditambahkan!', type: 'success' });
    } else {
      setShowToast({ show: true, message: 'Gagal sinkronisasi server.', type: 'error' });
    }
  };

  const handleDeleteUser = async (nip: string) => {
    const newUsers = users.filter(u => u.nip !== nip);
    setUsers(newUsers);
    setShowToast({ show: true, message: 'Menghapus data di server...', type: 'info' });

    const success = await syncUsersToSpreadsheet(newUsers);
    if (success) {
      setShowToast({ show: true, message: 'Pegawai berhasil dihapus!', type: 'success' });
    } else {
      setShowToast({ show: true, message: 'Gagal hapus di server.', type: 'error' });
    }
  };

  const handleSyncUsers = async () => {
    const success = await syncUsersToSpreadsheet(users);
    if (success) setShowToast({ show: true, message: 'Sync berhasil!', type: 'success' });
    else setShowToast({ show: true, message: 'Gagal sinkronisasi.', type: 'error' });
  };

  const handleCreateOrUpdateRequest = async (request: LeaveRequest) => {
    const existingIndex = requests.findIndex(r => r.id === request.id);
    let updatedRequests = [...requests];
    
    if (existingIndex >= 0) {
      updatedRequests[existingIndex] = request;
      setRequests(updatedRequests);
      setShowToast({ show: true, message: 'Pengajuan diperbarui!', type: 'success' });
      const success = await updateRequestToSheet(request);
      if (!success) setShowToast({ show: true, message: 'Gagal update server.', type: 'error' });
    } else {
      updatedRequests = [request, ...requests];
      setRequests(updatedRequests);
      setShowToast({ show: true, message: 'Ijin terkirim!', type: 'success' });
      const success = await syncToSpreadsheet(request);
      if (!success) setShowToast({ show: true, message: 'Gagal sinkronisasi server.', type: 'error' });
    }

    setView('DASHBOARD');
    setEditingRequest(null);
  };

  const handleEditRequest = (req: LeaveRequest) => {
    setEditingRequest(req);
    setView('INPUT');
  };

  const handleApprove = async (id: string) => {
    setRequests(requests.map(req => req.id === id ? { ...req, status: Status.APPROVED } : req));
    // CHANGE: Menggunakan Status.APPROVED agar nilai yang dikirim adalah 'Disetujui' (bukan string 'APPROVED')
    const success = await updateSheetStatus(id, Status.APPROVED);
    if (success) setShowToast({ show: true, message: 'Disetujui.', type: 'success' });
    else setShowToast({ show: true, message: 'Gagal update server.', type: 'error' });
  };

  const handleReject = async (id: string) => {
    setRequests(requests.map(req => req.id === id ? { ...req, status: Status.REJECTED } : req));
    // CHANGE: Menggunakan Status.REJECTED agar nilai yang dikirim adalah 'Ditolak'
    const success = await updateSheetStatus(id, Status.REJECTED);
    if (success) setShowToast({ show: true, message: 'Ditolak.', type: 'success' });
    else setShowToast({ show: true, message: 'Gagal update server.', type: 'error' });
  };

  const handleDeleteRequest = async (id: string) => {
    // 1. Optimistic Update (Hapus di UI dulu agar cepat)
    const previousRequests = [...requests];
    setRequests(requests.filter(req => req.id !== id));
    setShowToast({ show: true, message: 'Memproses penghapusan...', type: 'info' });

    // 2. Request Hapus ke Server
    const success = await deleteLeaveRequest(id);
    
    if (success) {
      setShowToast({ show: true, message: 'Data berhasil dihapus dari database.', type: 'success' });
    } else {
      // 3. Kembalikan data jika server gagal
      setRequests(previousRequests);
      setShowToast({ show: true, message: 'Gagal menghapus data di server.', type: 'error' });
    }
  };

  const handleGeneratePdf = async (req: LeaveRequest) => {
    const url = await generatePdf(req);
    if (url) {
      setRequests(requests.map(r => r.id === req.id ? { ...r, docUrl: url } : r));
      setShowToast({ show: true, message: 'PDF Berhasil dibuat!', type: 'success' });
    } else {
      setShowToast({ show: true, message: 'Gagal membuat PDF. Cek Template/Folder ID.', type: 'error' });
    }
  };

  const handleOpenExternalForm = (url: string, title: string) => {
    setActiveFormUrl(url);
    setActiveFormTitle(title);
    setView('FORM_VIEW');
  };

  useEffect(() => {
    if (showToast.show) {
      const timer = setTimeout(() => setShowToast({ ...showToast, show: false }), 4000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  useEffect(() => {
    if (currentUser?.role === 'KEPALA_SEKOLAH') {
      const prevRequests = prevRequestsRef.current;
      if (requests.length > prevRequests.length) {
        const newRequests = requests.filter(req => !prevRequests.some(p => p.id === req.id));
        const incomingRequest = newRequests.find(req => req.nip !== currentUser.nip);
        if (incomingRequest) {
          setShowToast({ show: true, message: `🔔 Baru: ${incomingRequest.name}`, type: 'info' });
        }
      }
    }
    prevRequestsRef.current = requests;
  }, [requests, currentUser]);

  const NavItem = ({ targetView, icon: Icon, label }: { targetView: ViewState; icon: any; label: string }) => (
    <button
      onClick={() => { 
        setView(targetView); 
        setIsSidebarOpen(false); 
        if (targetView === 'INPUT') setEditingRequest(null);
      }}
      className={`group w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 mb-2 text-sm relative overflow-hidden ${
        view === targetView 
          ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold shadow-md shadow-sky-200' 
          : 'text-slate-500 hover:bg-white hover:text-sky-600 font-medium'
      }`}
    >
      <div className="flex items-center space-x-3 z-10">
        <Icon size={20} className={`transition-colors duration-300 ${view === targetView ? 'text-white' : 'text-slate-400 group-hover:text-sky-500'}`} />
        <span>{label}</span>
      </div>
      {view === targetView && <ChevronRight size={16} className="text-white animate-pulse" />}
    </button>
  );

  if (isLoadingData) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#f0f9ff] text-slate-800">
         <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute inset-0 opacity-100" style={{
                backgroundImage: "radial-gradient(at 0% 0%, hsla(210, 100%, 96%, 1) 0px, transparent 50%), radial-gradient(at 100% 0%, hsla(200, 100%, 93%, 1) 0px, transparent 50%), radial-gradient(at 100% 100%, hsla(215, 100%, 96%, 1) 0px, transparent 50%), radial-gradient(at 0% 100%, hsla(195, 100%, 94%, 1) 0px, transparent 50%)"
            }}></div>
            
            <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-200/40 rounded-full blur-[100px] opacity-60"></div>
            <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] bg-sky-200/40 rounded-full blur-[100px] opacity-60"></div>
         </div>

         <div className="relative z-10 flex flex-col items-center animate-fade-in-up">
            <div className="relative mb-8 group">
               <div className="absolute inset-0 bg-brand-400 rounded-full blur-xl opacity-20 animate-pulse"></div>
               <div className="relative bg-white p-2 rounded-full shadow-2xl border-2 border-white/50">
                  <img 
                    src="https://siapsekolah.com/wp-content/uploads/2024/08/Kepala-Sekolah-1.png" 
                    alt="Logo" 
                    className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover"
                  />
               </div>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2 text-slate-800">
              SIAP <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-sky-500">Lapor</span>
            </h1>
            <p className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">
              UPT SD Negeri Remen 2
            </p>
            <p className="text-[10px] md:text-xs font-medium text-slate-400 tracking-widest mb-10">
              Sistem Ijin Agenda Pegawai
            </p>

            <div className="flex flex-col items-center gap-4">
               <Loader2 size={36} className="text-brand-600 animate-spin drop-shadow-md" />
               <p className="text-[10px] font-bold text-slate-400 animate-pulse tracking-widest">Loading System...</p>
            </div>
         </div>
      </div>
    );
  }

  if (!currentUser || view === 'LOGIN') {
    return <LoginForm users={users} onLogin={handleLogin} dbError={dbError} />;
  }

  return (
    <div className="h-full flex font-sans relative bg-[#f8fafc]">
      {showToast.show && (
        <div className="fixed top-6 right-6 z-50 animate-fade-in-up">
          <div className={`px-5 py-4 rounded-2xl shadow-xl flex items-center gap-3 border backdrop-blur-md text-sm ${
              showToast.type === 'success' ? 'bg-white/90 border-green-200 text-green-800' : 
              showToast.type === 'error' ? 'bg-white/90 border-red-200 text-red-800' : 
              'bg-white/90 border-blue-200 text-blue-800'
          }`}>
            {showToast.type === 'success' ? <CheckCircle2 size={20} className="text-green-500" /> : 
             showToast.type === 'error' ? <X size={20} className="text-red-500" /> : <Bell size={20} className="text-blue-500" />}
            <span className="font-bold">{showToast.message}</span>
            <button onClick={() => setShowToast({ ...showToast, show: false })} className="ml-2 opacity-50 hover:opacity-100 hover:scale-110 transition-transform"><X size={16} /></button>
          </div>
        </div>
      )}

      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/40 z-20 lg:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />}

      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-72 bg-gradient-to-b from-white via-sky-50 to-sky-100 border-r border-sky-100 shadow-2xl lg:shadow-none transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-full flex flex-col">
          <div className="p-8 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                 <div className="absolute inset-0 bg-sky-400 rounded-full blur opacity-20"></div>
                 <img src="https://siapsekolah.com/wp-content/uploads/2024/08/Kepala-Sekolah-1.png" alt="Logo" className="relative w-10 h-10 object-cover rounded-full border-2 border-white shadow-sm" />
              </div>
              <div className="flex flex-col">
                <span className="block text-xl font-black text-slate-800 leading-none tracking-tight">SIAP <span className="text-sky-500">Lapor</span></span>
                <span className="text-[8px] text-slate-400 font-bold tracking-widest uppercase mt-0.5">UPT SD Negeri Remen 2</span>
              </div>
            </div>
            <button className="lg:hidden text-slate-400 p-1 hover:text-sky-600 bg-sky-50 rounded-lg" onClick={() => setIsSidebarOpen(false)}><X size={20} /></button>
          </div>
          
          <div className="flex-1 px-5 py-2 overflow-y-auto">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Menu Utama</div>
            <NavItem targetView="DASHBOARD" icon={LayoutDashboard} label="Dashboard" />
            <NavItem targetView="INPUT" icon={PlusCircle} label="Ajukan Ijin" />
            {currentUser.role === 'KEPALA_SEKOLAH' && (
              <>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-8 mb-3 px-2">Administrasi</div>
                <NavItem targetView="USER_MANAGEMENT" icon={Users} label="Data Pegawai" />
              </>
            )}
          </div>
          
          <div className="p-5 border-t border-sky-100 bg-gradient-to-t from-white to-sky-50/50">
             <div className="flex items-center justify-between mb-4 p-3 bg-white/60 rounded-2xl border border-sky-100 shadow-sm group hover:bg-white transition-all cursor-pointer" onClick={() => { setView('PROFILE'); setIsSidebarOpen(false); }}>
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-sky-200">{currentUser.name.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[7px] font-bold text-slate-700 truncate group-hover:text-sky-600 transition-colors">{currentUser.name}</p>
                    <p className="text-[9px] text-slate-400 font-mono truncate">{currentUser.nip}</p>
                  </div>
                </div>
                <div className="text-slate-300 group-hover:text-sky-500 transition-colors">
                    <Settings size={18} />
                </div>
             </div>
            <button onClick={handleLogout} className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-white border border-slate-200 text-red-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200 rounded-xl transition text-xs font-bold shadow-sm active:scale-95 group">
                <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
                <span>Keluar Aplikasi</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="lg:hidden bg-white/80 backdrop-blur-md border-b border-white/50 p-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div className="flex items-center space-x-3">
            <button onClick={() => setIsSidebarOpen(true)} className="text-slate-600 p-2 hover:bg-slate-100 rounded-xl"><Menu size={22} /></button>
            <div className="flex items-center gap-2">
              <img src="https://siapsekolah.com/wp-content/uploads/2024/08/Kepala-Sekolah-1.png" alt="Logo" className="w-8 h-8 object-cover rounded-full border border-white shadow-sm" />
              <span className="font-bold text-slate-800 text-sm">SIAP <span className="text-brand-600">Lapor</span></span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 scroll-smooth">
          <div className="max-w-7xl mx-auto animate-fade-in pb-4 min-h-full flex flex-col">
            {view !== 'FORM_VIEW' && view !== 'DATABASE' && (
               <div className="flex justify-end mb-4">
                <button onClick={loadData} disabled={isLoadingData} className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-slate-400 hover:text-brand-600 transition uppercase tracking-wide bg-white/50 px-3 py-1.5 rounded-full hover:bg-white hover:shadow-sm">
                    <RefreshCw size={12} className={isLoadingData ? 'animate-spin' : ''} /> {isLoadingData ? 'Memuat Data...' : 'Refresh Data'}
                </button>
              </div>
            )}

            <div className="flex-1">
              {view === 'DASHBOARD' ? (
                <Dashboard 
                  requests={requests} 
                  userRole={currentUser.role} 
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onDelete={handleDeleteRequest} 
                  onEdit={handleEditRequest}
                  onSyncUsers={handleSyncUsers}
                  onGeneratePdf={handleGeneratePdf}
                  onOpenExternalForm={handleOpenExternalForm}
                  onOpenDatabase={() => setView('DATABASE')}
                />
              ) : view === 'USER_MANAGEMENT' && currentUser.role === 'KEPALA_SEKOLAH' ? (
                <UserManagement 
                  users={users} 
                  onUpdateUser={handleUpdateUserDatabase} 
                  onAddUser={handleAddUser} 
                  onDeleteUser={handleDeleteUser}
                  onSyncUsers={handleSyncUsers} 
                />
              ) : view === 'PROFILE' ? (
                <ProfileForm user={currentUser} onSave={handleUpdateProfile} onCancel={() => setView('DASHBOARD')} />
              ) : view === 'FORM_VIEW' ? (
                <FormFrame url={activeFormUrl} title={activeFormTitle} onClose={() => setView('DASHBOARD')} />
              ) : view === 'DATABASE' ? (
                <DatabaseView requests={requests} users={users} onClose={() => setView('DASHBOARD')} />
              ) : (
                <LeaveForm 
                  currentUser={currentUser} 
                  onSubmit={handleCreateOrUpdateRequest} 
                  onCancel={() => { setView('DASHBOARD'); setEditingRequest(null); }} 
                  initialData={editingRequest}
                />
              )}
            </div>

            <footer className="mt-auto pt-10 pb-4 text-center">
              <p className="text-[8px] text-slate-400 font-semibold tracking-wide">@2026 | Dev. Dedy Meyga Saputra, S.Pd, M.Pd</p>
            </footer>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;