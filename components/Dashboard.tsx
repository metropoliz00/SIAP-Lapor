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
  <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center space-x-4 hover:shadow-md transition-shadow">
    <div className={`p-3 md:p-4 ${bgClass} ${colorClass} rounded-xl`}><Icon size={24} className="md:w-7 md:h-7" /></div>
    <div>
      <p className="text-xs md:text-sm font-bold text-slate-500 mb-0.5 uppercase tracking-wide">{label}</p>
      <p className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight leading-none">{value}</p>
    </div>
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
    return new Date(dateString).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">Dashboard</h2>
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard icon={FileText} label="Total" value={total} colorClass="text-blue-600" bgClass="bg-blue-50" />
        <StatCard icon={CheckCircle} label="Disetujui" value={approved} colorClass="text-green-600" bgClass="bg-green-50" />
        <StatCard icon={Clock} label="Menunggu" value={pending} colorClass="text-yellow-600" bgClass="bg-yellow-50" />
        <StatCard icon={XCircle} label="Ditolak" value={rejected} colorClass="text-red-600" bgClass="bg-red-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden h-fit">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50/50 gap-3">
            <h3 className="text-base font-bold text-slate-700">
               {searchTerm ? 'Hasil Pencarian' : `Daftar Pengajuan (${showAll ? total : Math.min(3, total)})`}
            </h3>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Cari Nama, NIP..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 w-full sm:w-56 transition-all" 
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                  <th className="px-5 py-4">Pegawai</th>
                  <th className="px-5 py-4">Detail Ijin</th>
                  <th className="px-5 py-4 text-center">Status & Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedRequests.length === 0 ? (
                  <tr><td colSpan={3} className="px-5 py-10 text-center text-sm text-slate-400 font-medium">
                     {searchTerm ? 'Tidak ada data yang cocok dengan pencarian.' : 'Belum ada data pengajuan.'}
                  </td></tr>
                ) : (
                  displayedRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-5 py-4 align-top w-[30%]">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-sm text-slate-800 truncate">{req.name}</span>
                          <span className="text-xs text-slate-500 font-mono">{req.nip}</span>
                           <div className="flex items-center gap-1 mt-1">
                             <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{req.rank || '-'}</span>
                          </div>
                          <span className="text-[10px] text-brand-600 font-medium">{req.position}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <div className="flex flex-col gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2 py-1 rounded-md border border-brand-100">{req.type}</span>
                             <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                                <Calendar size={12} /><span className="font-semibold">{formatDate(req.startDate)}</span>
                             </div>
                          </div>
                          <p className="text-sm text-slate-600 leading-snug italic bg-slate-50/50 p-2 rounded border border-slate-100 border-l-2 border-l-brand-300">"{req.reason}"</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 align-top text-center w-[20%]">
                        <div className="flex flex-col items-center gap-2 w-full">
                          {req.status === Status.PENDING ? (
                            userRole === 'KEPALA_SEKOLAH' ? (
                              <div className="flex items-center justify-center gap-2 w-full">
                                <button onClick={() => onApprove(req.id)} className="flex-1 p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition" title="Setujui"><Check size={18} className="mx-auto" /></button>
                                <button onClick={() => onReject(req.id)} className="flex-1 p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition" title="Tolak"><X size={18} className="mx-auto" /></button>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-2 w-full">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-yellow-50 text-yellow-700 border border-yellow-200 shadow-sm w-full justify-center">Menunggu</span>
                                {onEdit && <button onClick={() => onEdit(req)} className="text-xs font-bold text-slate-400 hover:text-brand-600 flex items-center gap-1 py-1" title="Edit"><Edit size={12} /> Edit</button>}
                              </div>
                            )
                          ) : (
                            <div className="w-full flex flex-col gap-2">
                              <span className={`inline-flex items-center justify-center w-full px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${req.status === Status.APPROVED ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{req.status}</span>
                              
                              {req.status === Status.APPROVED && (
                                <button 
                                  onClick={() => handleOpenForm(req)}
                                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-indigo-700 transition-all animate-fade-in active:scale-95"
                                >
                                  {req.type.includes('Cuti') || req.type === LeaveCategories.CUTI ? (
                                    <><ExternalLink size={14} /><span>Buka Drive</span></>
                                  ) : (
                                    <><PenSquare size={14} /><span>Isi Form</span></>
                                  )}
                                </button>
                              )}
                            </div>
                          )}
                          {(onDelete && (userRole === 'KEPALA_SEKOLAH' || req.status !== Status.APPROVED)) && (
                            <button onClick={() => handleDeleteClick(req.id, req.name)} className="text-slate-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition mt-1"><Trash2 size={16} /></button>
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
            <div className="p-3 border-t border-slate-100 bg-slate-50/30 flex justify-center">
               <button 
                  onClick={() => setShowAll(!showAll)}
                  className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-brand-600 hover:text-brand-700 hover:bg-brand-50 rounded-full transition-all border border-transparent hover:border-brand-100"
               >
                  <span>{showAll ? 'Tutup Daftar' : 'Lihat Semua Pengajuan'}</span>
                  {showAll ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
               </button>
            </div>
          )}
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-700">Statistik Jenis Ijin</h3>
            <TrendingUp size={20} className="text-slate-400" />
          </div>
          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={typeData} 
                  cx="50%" 
                  cy="45%" 
                  innerRadius={55} 
                  outerRadius={85} 
                  fill="#8884d8" 
                  paddingAngle={5} 
                  dataKey="value"
                >
                  {typeData.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '13px', padding: '10px 14px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend 
                  verticalAlign="bottom" 
                  height={70} 
                  align="center"
                  iconType="circle"
                  iconSize={10}
                  wrapperStyle={{fontSize: '12px', width: '100%', paddingTop: '16px', fontWeight: 500}} 
                />
              </PieChart>
            </ResponsiveContainer>
            {typeData.length === 0 && (
               <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400 font-medium">Belum ada data</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};