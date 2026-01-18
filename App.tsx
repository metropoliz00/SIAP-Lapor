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
        <Icon size={20} className={`transition-colors duration-300 ${view === targetView ? 'text-white' : 'text-slate-400 group-hover: