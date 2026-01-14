import React, { useState } from 'react';
import { LeaveRequest, User, Status } from '../types';
import { ArrowLeft, Search, FileSpreadsheet, Users, FileText, Download, Filter } from 'lucide-react';

interface DatabaseViewProps {
  requests: LeaveRequest[];
  users: User[];
  onClose: () => void;
}

export const DatabaseView: React.FC<DatabaseViewProps> = ({ requests, users, onClose }) => {
  const [activeTab, setActiveTab] = useState<'REQUESTS' | 'USERS'>('REQUESTS');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Filter Requests
  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      req.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.nip.includes(searchTerm) ||
      req.type.toLowerCase().includes(searchTerm);
    
    const matchesStatus = statusFilter === 'ALL' || req.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Filter Users
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.nip.includes(searchTerm) ||
    user.position.toLowerCase().includes(searchTerm)
  );

  const formatDate = (dateString: string) => {
    try {
        return new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) { return dateString; }
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="p-4 md:p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <ArrowLeft size={20} />
          </button>
          <div>
             <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <FileSpreadsheet className="text-brand-600" /> Database Sekolah
             </h2>
             <p className="text-xs text-slate-500">Rekap data ijin dan data pegawai</p>
          </div>
        </div>
      </div>

      {/* Toolbar & Tabs */}
      <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-white sticky top-0 z-10">
        {/* Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-lg w-full md:w-auto">
            <button 
              onClick={() => setActiveTab('REQUESTS')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all ${activeTab === 'REQUESTS' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <FileText size={14} /> Data Ijin
            </button>
            <button 
              onClick={() => setActiveTab('USERS')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all ${activeTab === 'USERS' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Users size={14} /> Data Pegawai
            </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="text" 
                  placeholder="Cari data..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-brand-500"
                />
            </div>
            {activeTab === 'REQUESTS' && (
                <div className="relative">
                    <select 
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-brand-500 bg-white appearance-none cursor-pointer font-medium text-slate-600"
                    >
                        <option value="ALL">Semua Status</option>
                        <option value={Status.APPROVED}>Disetujui</option>
                        <option value={Status.PENDING}>Menunggu</option>
                        <option value={Status.REJECTED}>Ditolak</option>
                    </select>
                    <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
                </div>
            )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto bg-slate-50 p-4">
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        {activeTab === 'REQUESTS' ? (
                            <tr>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Tanggal</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Nama Pegawai</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Jenis Ijin</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Alasan</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Durasi</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center">Status</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center">Dokumen</th>
                            </tr>
                        ) : (
                            <tr>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Nama Lengkap</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">NIP</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Jabatan</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Pangkat/Gol</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center">Role</th>
                            </tr>
                        )}
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                         {activeTab === 'REQUESTS' ? (
                             filteredRequests.length > 0 ? filteredRequests.map((req) => (
                                 <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                                     <td className="px-4 py-3 text-xs text-slate-600">{formatDate(req.createdAt)}</td>
                                     <td className="px-4 py-3">
                                         <div className="flex flex-col">
                                             <span className="text-xs font-bold text-slate-700">{req.name}</span>
                                             <span className="text-[10px] text-slate-400 font-mono">{req.nip}</span>
                                         </div>
                                     </td>
                                     <td className="px-4 py-3 text-xs text-slate-700 font-medium">{req.type}</td>
                                     <td className="px-4 py-3 text-xs text-slate-600 max-w-xs truncate" title={req.reason}>{req.reason}</td>
                                     <td className="px-4 py-3 text-xs text-slate-600">
                                         {formatDate(req.startDate)} - {formatDate(req.endDate)}
                                     </td>
                                     <td className="px-4 py-3 text-center">
                                         <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                             req.status === Status.APPROVED ? 'bg-green-50 text-green-700 border-green-200' :
                                             req.status === Status.REJECTED ? 'bg-red-50 text-red-700 border-red-200' :
                                             'bg-yellow-50 text-yellow-700 border-yellow-200'
                                         }`}>
                                             {req.status}
                                         </span>
                                     </td>
                                     <td className="px-4 py-3 text-center">
                                         {req.docUrl ? (
                                             <a href={req.docUrl} target="_blank" rel="noreferrer" className="text-brand-600 hover:text-brand-800">
                                                 <Download size={16} className="mx-auto" />
                                             </a>
                                         ) : (
                                             <span className="text-slate-300">-</span>
                                         )}
                                     </td>
                                 </tr>
                             )) : (
                                 <tr><td colSpan={7} className="px-4 py-8 text-center text-xs text-slate-400">Data tidak ditemukan</td></tr>
                             )
                         ) : (
                             filteredUsers.length > 0 ? filteredUsers.map((u) => (
                                 <tr key={u.nip} className="hover:bg-slate-50 transition-colors">
                                     <td className="px-4 py-3 text-xs font-bold text-slate-700">{u.name}</td>
                                     <td className="px-4 py-3 text-xs font-mono text-slate-500">{u.nip}</td>
                                     <td className="px-4 py-3 text-xs text-slate-600">{u.position}</td>
                                     <td className="px-4 py-3 text-xs text-slate-600">{u.rank || '-'}</td>
                                     <td className="px-4 py-3 text-center">
                                         <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                             u.role === 'KEPALA_SEKOLAH' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                                         }`}>
                                             {u.role === 'KEPALA_SEKOLAH' ? 'KS' : 'Guru'}
                                         </span>
                                     </td>
                                 </tr>
                             )) : (
                                 <tr><td colSpan={5} className="px-4 py-8 text-center text-xs text-slate-400">Data tidak ditemukan</td></tr>
                             )
                         )}
                    </tbody>
                </table>
            </div>
        </div>
        <p className="text-[10px] text-slate-400 mt-2 text-right">Menampilkan {activeTab === 'REQUESTS' ? filteredRequests.length : filteredUsers.length} baris data.</p>
      </div>
    </div>
  );
};