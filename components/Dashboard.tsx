import React, { useMemo, useState } from 'react';
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
  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between hover:shadow-md transition-shadow group">
    <div>
      <p className="text-[10px] md:text-xs font-bold text-slate-500 mb-0.5 uppercase tracking-wide">{label}</p>
      <p className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight leading-none group-hover:scale-105 transition-transform origin-left">{value}</p>
    </div>
    <div className={`p-2.5 ${bgClass} ${colorClass} rounded-lg`}><Icon size={20} className="md:w-6 md:h-6" /></div>
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ requests, userRole, onApprove, onReject, onDelete, onEdit, onSyncUsers, onOpenExternalForm, onOpenDatabase }) => {
  const [showAll, setShowAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const total = requests.length;
  const approved = requests.filter(r => r.status === Status.APPROVED).length;
  const pending = requests.filter(r => r.status === Status.PENDING).length;
  const rejected = requests.filter(r => r.status === Status.REJECTED).length;

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
    <div className="space-y-5">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">{userRole === 'KEPALA_SEKOLAH' ? 'Kelola persetujuan dan pantau kinerja.' : 'Pantau status pengajuan Anda.'}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {userRole === 'KEPALA_SEKOLAH' && (
            <button 
              onClick={handleOpenReview}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition shadow-sm font-bold text-[10px] md:text-xs"
            >
              <FileSpreadsheet size={14} /><span>Review Data</span>
            </button>
          )}
          <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm whitespace-nowrap font-medium">
            <Calendar size={14} className="text-slate-300" /><span>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard icon={FileText} label="Total" value={total} colorClass="text-blue-600" bgClass="bg-blue-50" />
        <StatCard icon={CheckCircle} label="Disetujui" value={approved} colorClass="text-green-600" bgClass="bg-green-50" />
        <StatCard icon={Clock} label="Menunggu" value={pending} colorClass="text-yellow-600" bgClass="bg-yellow-50" />
        <StatCard icon={XCircle} label="Ditolak" value={rejected} colorClass="text-red-600" bgClass="bg-red-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden h-fit">
          <div className="px-4 py-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 gap-3">
            <h3 className="text-sm font-bold text-slate-700">
               {searchTerm ? 'Hasil Pencarian' : `Daftar Pengajuan (${showAll ? total : Math.min(3, total)})`}
            </h3>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="Cari..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 w-full sm:w-48 transition-all" 
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
                <tr className="bg-white border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  <th className="px-4 py-3">Pegawai</th>
                  <th className="px-4 py-3">Detail Ijin</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {displayedRequests.length === 0 ? (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-xs text-slate-400 font-medium">
                     {searchTerm ? 'Data tidak ditemukan.' : 'Belum ada data pengajuan.'}
                  </td></tr>
                ) : (
                  displayedRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/60 transition-colors group">
                      <td className="px-4 py-3 align-top w-[35%]">
                        <div className="flex flex-col">
                          <span className="font-bold text-xs md:text-sm text-slate-800 truncate">{req.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono mb-1">{req.nip}</span>
                           <div className="flex flex-wrap gap-1">
                             <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 whitespace-nowrap">{req.rank || '-'}</span>
                             <span className="text-[9px] text-brand-600 font-medium bg-brand-50 px-1.5 py-0.5 rounded border border-brand-100 whitespace-nowrap">{req.position}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded-full border border-slate-200 shadow-sm">{req.type}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                <Calendar size={10} /><span className="font-medium">{formatDate(req.startDate)}</span>
                          </div>
                          <p className="text-xs text-slate-600 leading-snug italic line-clamp-2">"{req.reason}"</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top text-center w-[20%]">
                        <div className="flex flex-col items-center gap-2 w-full">
                          {req.status === Status.PENDING ? (
                            userRole === 'KEPALA_SEKOLAH' ? (
                              <div className="flex items-center justify-center gap-1 w-full">
                                <button onClick={() => onApprove(req.id)} className="p-1.5 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition" title="Setujui"><Check size={16} /></button>
                                <button onClick={() => onReject(req.id)} className="p-1.5 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition" title="Tolak"><X size={16} /></button>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-1 w-full">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-50 text-yellow-700 border border-yellow-200 shadow-sm">Menunggu</span>
                                {onEdit && <button onClick={() => onEdit(req)} className="text-[10px] font-bold text-slate-400 hover:text-brand-600 flex items-center gap-1" title="Edit"><Edit size={10} /> Edit</button>}
                              </div>
                            )
                          ) : (
                            <div className="w-full flex flex-col gap-2">
                              <span className={`inline-flex items-center justify-center w-full px-2 py-0.5 rounded-full text-[10px] font-bold border shadow-sm ${req.status === Status.APPROVED ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{req.status}</span>
                              
                              {req.status === Status.APPROVED && (
                                <button 
                                  onClick={() => handleOpenForm(req)}
                                  className="w-full flex items-center justify-center gap-1 px-2 py-1.5 bg-indigo-600 text-white text-[10px] font-bold rounded shadow-sm hover:bg-indigo-700 transition-all active:scale-95"
                                >
                                  {req.type.includes('Cuti') || req.type === LeaveCategories.CUTI ? (
                                    <><ExternalLink size={10} /><span>Drive</span></>
                                  ) : (
                                    <><PenSquare size={10} /><span>Form</span></>
                                  )}
                                </button>
                              )}
                            </div>
                          )}
                          {(onDelete && (userRole === 'KEPALA_SEKOLAH' || req.status !== Status.APPROVED)) && (
                            <button onClick={() => handleDeleteClick(req.id, req.name)} className="text-slate-300 hover:text-red-500 p-1 rounded hover:bg-red-50 transition mt-1"><Trash2 size={14} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {!searchTerm && requests.length > 3 && (
            <div className="p-2 border-t border-slate-100 bg-slate-50/30 flex justify-center">
               <button 
                  onClick={() => setShowAll(!showAll)}
                  className="flex items-center gap-1 px-4 py-1.5 text-[10px] font-bold text-brand-600 hover:text-brand-700 hover:bg-brand-50 rounded-full transition-all"
               >
                  <span>{showAll ? 'Tutup' : 'Selengkapnya'}</span>
                  {showAll ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
               </button>
            </div>
          )}
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-700">Statistik</h3>
            <TrendingUp size={16} className="text-slate-400" />
          </div>
          <div className="h-60 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={typeData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={50} 
                  outerRadius={75} 
                  fill="#8884d8" 
                  paddingAngle={5} 
                  dataKey="value"
                >
                  {typeData.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '11px', padding: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend 
                  verticalAlign="bottom" 
                  height={50} 
                  align="center"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{fontSize: '10px', width: '100%', paddingTop: '10px', fontWeight: 500}} 
                />
              </PieChart>
            </ResponsiveContainer>
            {typeData.length === 0 && (
               <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 font-medium">Belum ada data</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};