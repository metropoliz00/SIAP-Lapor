import React, { useState, useEffect, useRef } from 'react';
import { ViewState, LeaveRequest, Status, User } from './types';
import { Dashboard } from './components/Dashboard';
import { LeaveForm } from './components/LeaveForm';
import { LoginForm } from './components/LoginForm';
import { ProfileForm } from './components/ProfileForm';
import { UserManagement } from './components/UserManagement';
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
import { LayoutDashboard, PlusCircle, LogOut, Menu, X, CheckCircle2, Settings, Users, Bell, Loader2, RefreshCw } from 'lucide-react';

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
        console.warn("Database user kosong.");
        setDbError("Gagal memuat data pegawai.");
      }

      if (fetchedRequests && fetchedRequests.length > 0) {
        setRequests(fetchedRequests);
      }
    } catch (error) {
      console.error("Critical Error loading data:", error);
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

  const handleAddUser = (newUser: User) => {
    setUsers([...users, newUser]);
    setShowToast({ show: true, message: 'Pegawai ditambahkan.', type: 'info' });
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
    const success = await updateSheetStatus(id, 'APPROVED');
    if (success) setShowToast({ show: true, message: 'Disetujui.', type: 'success' });
    else setShowToast({ show: true, message: 'Gagal update server.', type: 'error' });
  };

  const handleReject = async (id: string) => {
    setRequests(requests.map(req => req.id === id ? { ...req, status: Status.REJECTED } : req));
    const success = await updateSheetStatus(id, 'REJECTED');
    if (success) setShowToast({ show: true, message: 'Ditolak.', type: 'success' });
    else setShowToast({ show: true, message: 'Gagal update server.', type: 'error' });
  };

  const handleDeleteRequest = async (id: string) => {
    setRequests(requests.filter(req => req.id !== id));
    const success = await deleteLeaveRequest(id);
    if (success) setShowToast({ show: true, message: 'Data dihapus.', type: 'success' });
    else setShowToast({ show: true, message: 'Gagal hapus di server.', type: 'info' });
  };

  const handleGeneratePdf = async (req: LeaveRequest) => {
    const url = await generatePdf(req);
    if (url) {
      // Update local state with the new URL
      setRequests(requests.map(r => r.id === req.id ? { ...r, docUrl: url } : r));
      setShowToast({ show: true, message: 'PDF Berhasil dibuat!', type: 'success' });
    } else {
      setShowToast({ show: true, message: 'Gagal membuat PDF. Cek Template/Folder ID.', type: 'error' });
    }
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
      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 mb-0.5 text-sm ${
        view === targetView ? 'bg-brand-50 text-brand-700 font-bold shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
      }`}
    >
      <Icon size={18} className={view === targetView ? 'text-brand-600' : 'text-slate-400'} />
      <span>{label}</span>
    </button>
  );

  if (isLoadingData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-transparent gap-3 relative">
        <Loader2 className="w-10 h-10 text-brand-600 animate-spin" />
        <p className="text-xs text-slate-500 font-medium animate-pulse">Loading...</p>
      </div>
    );
  }

  if (!currentUser || view === 'LOGIN') {
    return <LoginForm users={users} onLogin={handleLogin} dbError={dbError} />;
  }

  return (
    <div className="min-h-screen bg-transparent flex font-sans relative">
      {/* Toast */}
      {showToast.show && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in-up">
          <div className={`px-3 py-2 rounded-lg shadow-md flex items-center gap-2 border text-sm ${
              showToast.type === 'success' ? 'bg-white border-green-200 text-green-800' : 
              showToast.type === 'error' ? 'bg-white border-red-200 text-red-800' : 
              'bg-white border-blue-200 text-blue-800'
          }`}>
            {showToast.type === 'success' ? <CheckCircle2 size={16} /> : 
             showToast.type === 'error' ? <X size={16} /> : <Bell size={16} />}
            <span className="font-medium">{showToast.message}</span>
            <button onClick={() => setShowToast({ ...showToast, show: false })} className="ml-2 opacity-50 hover:opacity-100"><X size={14} /></button>
          </div>
        </div>
      )}

      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/50 z-20 lg:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white/95 backdrop-blur-sm border-r border-slate-200 shadow-xl lg:shadow-none transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-full flex flex-col">
          <div className="p-4 flex items-center justify-between border-b border-slate-50">
            <div className="flex items-center space-x-3">
              <img src="https://siapsekolah.com/wp-content/uploads/2024/08/Kepala-Sekolah-1.png" alt="Logo" className="w-10 h-10 object-cover rounded-full border border-slate-100" />
              <div>
                <span className="block text-base font-extrabold text-slate-800 leading-none">SIAP <span className="text-brand-600">Lapor</span></span>
                <span className="text-[9px] text-slate-400 font-bold tracking-wide">UPT SD Negeri Remen 2</span>
              </div>
            </div>
            <button className="lg:hidden text-slate-400 p-1" onClick={() => setIsSidebarOpen(false)}><X size={18} /></button>
          </div>
          <div className="flex-1 px-3 py-3 overflow-y-auto">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-3">Menu</div>
            <NavItem targetView="DASHBOARD" icon={LayoutDashboard} label="Dashboard" />
            <NavItem targetView="INPUT" icon={PlusCircle} label="Ajukan Ijin" />
            {currentUser.role === 'KEPALA_SEKOLAH' && (
              <>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-4 mb-2 px-3">Admin</div>
                <NavItem targetView="USER_MANAGEMENT" icon={Users} label="Data Pegawai" />
              </>
            )}
          </div>
          <div className="p-3 border-t border-slate-100 bg-slate-50/50">
             <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-brand-700 text-xs font-bold shadow-sm">{currentUser.name.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{currentUser.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono truncate">{currentUser.nip}</p>
                  </div>
                </div>
                <button onClick={() => { setView('PROFILE'); setIsSidebarOpen(false); }} className="p-1.5 text-slate-400 hover:text-brand-600 rounded-md transition" title="Profil"><Settings size={16} /></button>
             </div>
            <button onClick={handleLogout} className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-white border border-slate-200 text-red-600 hover:bg-red-50 rounded-lg transition text-xs font-bold shadow-sm"><LogOut size={14} /><span>Keluar</span></button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="lg:hidden bg-white/90 backdrop-blur-sm border-b border-slate-200 p-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div className="flex items-center space-x-2">
            <button onClick={() => setIsSidebarOpen(true)} className="text-slate-600 p-1"><Menu size={20} /></button>
            <div className="flex items-center gap-2">
              <img src="https://siapsekolah.com/wp-content/uploads/2024/08/Kepala-Sekolah-1.png" alt="Logo" className="w-8 h-8 object-cover rounded-full border border-slate-200" />
              <span className="font-bold text-slate-800 text-sm">SIAP <span className="text-brand-600">Lapor</span></span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 scroll-smooth">
          <div className="max-w-5xl mx-auto animate-fade-in pb-2 min-h-full flex flex-col">
            <div className="flex justify-end mb-2">
              <button onClick={loadData} disabled={isLoadingData} className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-brand-600 transition">
                <RefreshCw size={12} className={isLoadingData ? 'animate-spin' : ''} /> {isLoadingData ? '...' : 'REFRESH'}
              </button>
            </div>

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
                />
              ) : view === 'USER_MANAGEMENT' && currentUser.role === 'KEPALA_SEKOLAH' ? (
                <UserManagement users={users} onUpdateUser={handleUpdateUserDatabase} onAddUser={handleAddUser} onSyncUsers={handleSyncUsers} />
              ) : view === 'PROFILE' ? (
                <ProfileForm user={currentUser} onSave={handleUpdateProfile} onCancel={() => setView('DASHBOARD')} />
              ) : (
                <LeaveForm 
                  currentUser={currentUser} 
                  onSubmit={handleCreateOrUpdateRequest} 
                  onCancel={() => { setView('DASHBOARD'); setEditingRequest(null); }} 
                  initialData={editingRequest}
                />
              )}
            </div>

            <footer className="mt-auto pt-6 pb-2 border-t border-slate-200/50 text-center">
              <p className="text-[10px] text-slate-400 font-medium">@2026 | Dev Dedy Meyga Saputra, S.Pd, M.Pd <br className="md:hidden" /> <span className="hidden md:inline"> | </span> UPT SD Negeri Remen 2</p>
            </footer>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;