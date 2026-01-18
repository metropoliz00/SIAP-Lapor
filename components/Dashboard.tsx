import React, { useMemo, useState, useEffect } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell,
  Tooltip, 
  ResponsiveContainer, 
  Legend
} from 'recharts';
import { LeaveRequest, Status, UserRole, FORM_LINKS, LeaveCategories } from '../types';
import { CheckCircle, Clock, XCircle, FileText, TrendingUp, Calendar, Search, Check, X, Edit, Trash2, ExternalLink, PenSquare, ChevronDown, ChevronUp, FileSpreadsheet } from 'lucide-react';
import { SPREADSHEET_URL_VIEW } from '../services/sheetService';

interface DashboardProps {
  requests: LeaveRequest[];
  userRole: UserRole;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onDelete?: (id: string) => void; 
  onEdit?: (request: LeaveRequest) => void;
  onSyncUsers?: () => Promise<void>;
  onGeneratePdf?: (request: LeaveRequest) => Promise<void>;
  onOpenExternalForm?: (url: string, title: string) => void;
  onOpenDatabase?: () => void;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const StatCard = ({ icon: Icon, label, value, colorClass, bgClass }: any) => (
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300 group cursor-default">
    <div>
      <p className="text-[10px] md:text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-black text-slate-800 tracking-tight leading-none group-hover:scale-105 transition-transform origin-left">{value}</p>
    </div>
    <div className={`p-3.5 ${bgClass} ${colorClass} rounded-xl shadow-inner group-hover:rotate-6 transition-transform duration-300`}>
        <Icon size={22} className="md:w-6 md:h-6" />
    </div>
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ requests, userRole, onApprove, onReject, onDelete, onEdit, onSyncUsers, onOpenExternalForm, onOpenDatabase }) => {
  const [showAll, setShowAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const total = requests.length;
  const approved = requests.filter(r => r.status === Status.APPROVED).length;
  const pending = requests.filter(r => r.status === Status.PENDING).length;
  const rejected = requests.filter(r => r.status === Status.REJECTED).length;

  // Real-time clock effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const typeData = useMemo(() => {
    const counts: Record<string, number> = {};
    requests.forEach(req => {
      const typeName = req.type || 'Lainnya';
      counts[typeName] = (counts[typeName] || 0) + 1;
    });
    return Object.keys(counts).map((key) => ({ name: key, value: counts[key] })).sort((a, b) => b.value - a.value);
  }, [requests]);

  const displayedRequests = useMemo(() => {
    let data = [...requests].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (searchTerm.trim()) {
      const lowerTerm = searchTerm.toLowerCase();
      data = data.filter(req => 
        req.name.toLowerCase().includes(lowerTerm) ||
        req.nip.includes(lowerTerm) ||
        req.type.toLowerCase().includes(lowerTerm) ||
        req.reason.toLowerCase().includes(lowerTerm)
      );
    }
    if (!showAll && !searchTerm.trim()) {
      return data.slice(0, 3);
    }
    return data;
  }, [requests, searchTerm, showAll]);

  const handleDeleteClick = (id: string, name: string) => {
    if (onDelete && window.confirm(`Hapus data ijin "${name}"?`)) onDelete(id);
  };

  const handleOpenForm = (req: LeaveRequest) => {
    let url = FORM_LINKS.IJIN; 
    let title = "Formulir Ijin";

    if (req.type === LeaveCategories.DISPENSASI_DINAS) {
      url = FORM_LINKS.DISPENSASI_DINAS;
      title = "Form Dispensasi Dinas";
    } else if (req.type === LeaveCategories.DISPENSASI_PRIBADI) {
      url = FORM_LINKS.DISPENSASI_PRIBADI;
      title = "Form Dispensasi Pribadi";
    } else if (req.type === LeaveCategories.IJIN) {
      url = FORM_LINKS.IJIN;
      title = "Formulir Ijin";
    } else if (req.type === LeaveCategories.MENINGGALKAN_TUGAS) {
      url = FORM_LINKS.MENINGGALKAN_TUGAS || FORM_LINKS.IJIN;
      title = "Formulir Ijin Meninggalkan Tugas";
    } else if (req.type.includes('Cuti') || req.type === LeaveCategories.CUTI) {
      url = FORM_LINKS.CUTI;
      title = "Folder Cuti";
      window.open(url, '_blank');
      return; 
    }
    
    if (onOpenExternalForm) {
      onOpenExternalForm(url, title);
    }
  };

  const handleOpenReview = () => {
    if (onOpenDatabase) {
      onOpenDatabase();
    } else if (SPREADSHEET_URL_VIEW) {
      window.open(SPREADSHEET_URL_VIEW, '_blank');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fade-in">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">{userRole === 'KEPALA_SEKOLAH' ? 'Kelola persetujuan dan pantau kinerja.' : 'Pantau status pengajuan Anda.'}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {userRole === 'KEPALA_SEKOLAH' && (
            <button 
              onClick={handleOpenReview}
              className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-50 hover:shadow-md transition-all font-bold text-xs"
            >
              <FileSpreadsheet size={16} /><span>Review Data</span>
            </button>
          )}
          <div className="flex flex-col items-end gap-1.5">
             <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-500 pr-2">
                <Clock size={14} className="text-brand-500" />
                <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">{currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB</span>
             </div>
             <div className="flex items-center gap-2 text-xs text-slate-600 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm whitespace-nowrap font-semibold">
               <Calendar size={14} className="text-brand-500" />
               <span>{currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
             </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 animate-fade-in-up">
        <StatCard icon={FileText} label="Total Pengajuan" value={total} colorClass="text-blue-600" bgClass="bg-blue-50" />
        <StatCard icon={CheckCircle} label="Disetujui" value={approved} colorClass="text-green-600" bgClass="bg-green-50" />
        <StatCard icon={Clock} label="Menunggu" value={pending} colorClass="text-yellow-600" bgClass="bg-yellow-50" />
        <StatCard icon={XCircle} label="Ditolak" value={rejected} colorClass="text-red-600" bgClass="bg-red-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden h-fit animate-fade-in transition-all hover:shadow-md">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50/50 gap-3 backdrop-blur-sm">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
               <div className="w-1 h-4 bg-brand-500 rounded-full"></div>
               {searchTerm ? 'Hasil Pencarian' : `Daftar Pengajuan Terbaru`}
            </h3>
            <div className="relative w-full sm:w-auto group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={14} />
              <input 
                type="text" 
                placeholder="Cari..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 w-full sm:w-56 transition-all bg-white shadow-sm" 
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-white border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">
                  <th className="px-5 py-4">Pegawai</th>
                  <th className="px-5 py-4">Detail Ijin</th>
                  <th className="px-5 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {displayedRequests.length === 0 ? (
                  <tr><td colSpan={3} className="px-5 py-10 text-center text-xs text-slate-400 font-medium">
                     {searchTerm ? 'Data tidak ditemukan.' : 'Belum ada data pengajuan.'}
                  </td></tr>
                ) : (
                  displayedRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-brand-50/30 transition-colors group duration-200">
                      <td className="px-5 py-4 align-top w-[35%]">
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-slate-800 truncate mb-0.5">{req.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono mb-2">{req.nip}</span>
                           <div className="flex flex-wrap gap-1.5">
                             <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 whitespace-nowrap">{req.rank || '-'}</span>
                             <span className="text-[9px] text-brand-700 font-semibold bg-brand-50 px-2 py-0.5 rounded border border-brand-100 whitespace-nowrap">{req.position}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-extrabold text-slate-600 bg-white px-2.5 py-1 rounded-full border border-slate-200 shadow-sm">{req.type}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-600">
                                <Calendar size={12} className="text-brand-400" /><span className="font-semibold">{formatDate(req.startDate)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                                <Clock size={12} className="text-orange-400" /><span className="font-medium bg-orange-50 px-1.5 rounded text-orange-700">{req.startTime} - {req.endTime}</span>
                          </div>
                          <p className="text