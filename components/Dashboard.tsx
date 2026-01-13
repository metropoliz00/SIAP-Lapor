import React, { useState, useMemo } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell,
  Tooltip, 
  ResponsiveContainer, 
  Legend
} from 'recharts';
import { LeaveRequest, Status, UserRole } from '../types';
import { CheckCircle, Clock, XCircle, FileText, TrendingUp, Calendar, Search, Check, X, Edit, UploadCloud, Trash2, ExternalLink, FileDown, Loader2 } from 'lucide-react';
import { downloadDoc, SPREADSHEET_URL_VIEW } from '../services/sheetService';

interface DashboardProps {
  requests: LeaveRequest[];
  userRole: UserRole;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onDelete?: (id: string) => void; 
  onEdit?: (request: LeaveRequest) => void;
  onSyncUsers?: () => Promise<void>;
}

// Generate colors dynamically
const COLORS = [
  '#3b82f6', // brand-500
  '#10b981', // green-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
];

export const Dashboard: React.FC<DashboardProps> = ({ requests, userRole, onApprove, onReject, onDelete, onEdit, onSyncUsers }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Calculate Stats
  const total = requests.length;
  const approved = requests.filter(r => r.status === Status.APPROVED).length;
  const pending = requests.filter(r => r.status === Status.PENDING).length;
  const rejected = requests.filter(r => r.status === Status.REJECTED).length;

  // Prepare Data for Charts
  const typeData = useMemo(() => {
    const counts: Record<string, number> = {};
    requests.forEach(req => {
      const typeName = req.type || 'Lainnya';
      counts[typeName] = (counts[typeName] || 0) + 1;
    });

    return Object.keys(counts).map((key) => ({
      name: key,
      value: counts[key]
    })).sort((a, b) => b.value - a.value);
  }, [requests]);

  const handleSyncClick = async () => {
    if (onSyncUsers) {
      setIsSyncing(true);
      await onSyncUsers();
      setTimeout(() => setIsSyncing(false), 2000);
    }
  };

  const handleDeleteClick = (id: string, name: string) => {
    if (onDelete && window.confirm(`Apakah anda yakin ingin menghapus data ijin atas nama "${name}"?`)) {
      onDelete(id);
    }
  };

  const handleDownloadClick = async (req: LeaveRequest) => {
    setDownloadingId(req.id);
    try {
      const response = await downloadDoc(req);
      
      if (response.status === 'success' && response.data) {
        // KONVERSI BASE64 KE BLOB (DOCX)
        try {
          // 1. Bersihkan string base64 dari spasi/newline
          const cleanBase64 = response.data.replace(/[\r\n]+/g, '');
          
          // 2. Decode Base64
          const byteCharacters = atob(cleanBase64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          
          // 3. Buat Blob DOCX
          // MIME Type untuk .docx
          const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
          
          // 4. Buat URL Object
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          // Gunakan ekstensi .docx
          link.download = response.filename || `Surat_Ijin_${req.name}.docx`;
          
          document.body.appendChild(link);
          link.click();
          
          // 5. Cleanup
          setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
          }, 100);

        } catch (convertError) {
          console.error("Error converting DOCX:", convertError);
          alert("Gagal memproses file dokumen dari server.");
        }
      } else {
        console.error("Server Error Response:", response);
        
        let errorMsg = response.message || response.error || "Terjadi kesalahan tidak diketahui.";
        
        // Handle jika pesan error berupa Object
        if (typeof errorMsg === 'object') {
            try {
                errorMsg = JSON.stringify(errorMsg);
            } catch(e) {
                errorMsg = "Detail error tidak dapat dibaca (Object).";
            }
        }
        
        // Handle jika pesan error adalah string "[object Object]"
        if (String(errorMsg) === '[object Object]') {
             errorMsg = "Terjadi kesalahan internal pada script server (Invalid Error Format). Periksa Apps Script.";
        }

        alert(`Gagal mengunduh dokumen:\n${errorMsg}\n\nPastikan ID Template Google Doc benar.`);
      }
    } catch (e) {
      console.error("Network Error:", e);
      alert('Terjadi kesalahan jaringan saat mengunduh dokumen.');
    } finally {
      setDownloadingId(null);
    }
  };

  const StatCard = ({ icon: Icon, label, value, colorClass, bgClass }: any) => (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-3 hover:shadow-md transition-shadow">
      <div className={`p-2.5 ${bgClass} ${colorClass} rounded-lg`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 mb-0.5 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-slate-800 tracking-tight leading-none">{value}</p>
      </div>
    </div>
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            Dashboard
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {userRole === 'KEPALA_SEKOLAH' 
              ? 'Kelola persetujuan ijin pegawai.' 
              : 'Pantau status pengajuan ijin Anda.'}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          {userRole === 'KEPALA_SEKOLAH' && SPREADSHEET_URL_VIEW && (
            <a 
              href={SPREADSHEET_URL_VIEW}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition shadow-sm font-medium text-xs"
            >
              <ExternalLink size={14} />
              <span>Database</span>
            </a>
          )}

          {userRole === 'KEPALA_SEKOLAH' && onSyncUsers && (
            <button 
              onClick={handleSyncClick}
              disabled={isSyncing}
              className={`flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition shadow-sm font-medium text-xs ${isSyncing ? 'opacity-70 cursor-wait' : ''}`}
            >
              <UploadCloud size={14} className={isSyncing ? 'animate-bounce' : ''} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Pegawai'}</span>
            </button>
          )}

          <div className="flex items-center gap-2 text-xs text-slate-500 bg-white px-3 py-1.5 rounded-md border border-slate-200 shadow-sm whitespace-nowrap">
            <Calendar size={14} />
            <span>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FileText} label="Total" value={total} colorClass="text-blue-600" bgClass="bg-blue-50" />
        <StatCard icon={CheckCircle} label="Disetujui" value={approved} colorClass="text-green-600" bgClass="bg-green-50" />
        <StatCard icon={Clock} label="Menunggu" value={pending} colorClass="text-yellow-600" bgClass="bg-yellow-50" />
        <StatCard icon={XCircle} label="Ditolak" value={rejected} colorClass="text-red-600" bgClass="bg-red-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Table Section */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-700">Daftar Pengajuan</h3>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-400" size={14} />
              <input type="text" placeholder="Cari..." className="pl-8 pr-3 py-1 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 w-32 focus:w-48 transition-all" />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  <th className="px-4 py-3">Pegawai</th>
                  <th className="px-4 py-3">Detail Ijin</th>
                  <th className="px-4 py-3 text-center">Status & Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-xs text-slate-400">
                      Belum ada data.
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-4 py-3 align-top w-[25%]">
                        <div className="flex flex-col">
                          <span className="font-bold text-xs text-slate-700 truncate">{req.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{req.nip}</span>
                           <div className="flex items-center gap-1 mt-0.5">
                             <span className="text-[10px] text-slate-500 bg-slate-100 px-1 rounded border border-slate-200">{req.rank || '-'}</span>
                          </div>
                          <span className="text-[10px] text-brand-600">{req.position}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded border border-brand-100">
                              {req.type}
                            </span>
                             <div className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                <Calendar size={10} />
                                <span className="font-medium">{formatDate(req.startDate)}</span>
                                <span className="text-slate-300 mx-0.5">|</span>
                                <span className="font-mono">{req.startTime} - {req.endTime}</span>
                             </div>
                          </div>
                          <p className="text-xs text-slate-600 leading-snug italic">
                            "{req.reason}"
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top text-center w-[20%]">
                        <div className="flex flex-col items-center gap-2 w-full">
                          
                          {/* LOGIC STATUS & ACTION */}
                          
                          {req.status === Status.PENDING ? (
                            /* JIKA STATUS MENUNGGU (PENDING) */
                            userRole === 'KEPALA_SEKOLAH' ? (
                              /* Tampilan untuk Kepala Sekolah (Actionable) */
                              <div className="flex items-center justify-center gap-1">
                                <button 
                                  onClick={() => onApprove(req.id)}
                                  className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200 transition"
                                  title="Setujui"
                                >
                                  <Check size={14} />
                                </button>
                                <button 
                                  onClick={() => onReject(req.id)}
                                  className="p-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                                  title="Tolak"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              /* Tampilan untuk Guru (Status + Edit) */
                              <div className="flex items-center gap-1">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-50 text-yellow-700 border border-yellow-100">
                                  Menunggu
                                </span>
                                {/* Tombol Edit Aktif */}
                                {onEdit && (
                                  <button 
                                    onClick={() => onEdit(req)} 
                                    className="text-slate-400 hover:text-brand-600 transition-colors"
                                    title="Edit Pengajuan"
                                  >
                                    <Edit size={12} />
                                  </button>
                                )}
                              </div>
                            )
                          ) : (
                            /* JIKA STATUS FINAL (APPROVED / REJECTED) */
                            <div className="w-full flex flex-col gap-2">
                              <span className={`inline-flex items-center justify-center w-full px-2 py-0.5 rounded text-[10px] font-bold border
                                ${req.status === Status.APPROVED ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                {req.status}
                              </span>
                              
                              {/* LOGIC UTAMA: JIKA DISETUJUI, MUNCUL MENU CETAK */}
                              {req.status === Status.APPROVED && (
                                <button 
                                  onClick={() => handleDownloadClick(req)}
                                  disabled={downloadingId === req.id}
                                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-bold rounded shadow-sm hover:bg-indigo-700 transition-all hover:shadow-md animate-fade-in"
                                  title="Unduh Surat Ijin (Word)"
                                >
                                  {downloadingId === req.id ? (
                                    <Loader2 size={12} className="animate-spin text-indigo-200" />
                                  ) : (
                                    <FileDown size={12} />
                                  )}
                                  <span>{downloadingId === req.id ? 'Loading...' : 'Unduh Doc'}</span>
                                </button>
                              )}
                            </div>
                          )}

                          {/* Tombol Hapus (Muncul untuk Admin atau jika status Menunggu/Ditolak untuk user) */}
                          {(onDelete && (userRole === 'KEPALA_SEKOLAH' || req.status !== Status.APPROVED)) && (
                            <button 
                              onClick={() => handleDeleteClick(req.id, req.name)}
                              className="text-slate-300 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100 mt-1"
                              title="Hapus Data"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 h-min">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-700">Statistik</h3>
            <TrendingUp size={16} className="text-slate-400" />
          </div>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '6px', fontSize: '12px', padding: '4px 8px' }} 
                />
                <Legend verticalAlign="bottom" height={24} iconType="circle" wrapperStyle={{fontSize: '10px'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};