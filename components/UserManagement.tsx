import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { Edit, Save, X, Search, Plus, UploadCloud, Key, Check, Trash2 } from 'lucide-react';

interface UserManagementProps {
  users: User[];
  onUpdateUser: (originalNip: string, updatedUser: User) => void;
  onAddUser: (newUser: User) => void;
  onDeleteUser: (nip: string) => void;
  onSyncUsers: () => void;
  forceOpenAddModal?: boolean; // New prop
  onModalClosed?: () => void; // New prop
}

export const UserManagement: React.FC<UserManagementProps> = ({ users, onUpdateUser, onAddUser, onDeleteUser, onSyncUsers, forceOpenAddModal, onModalClosed }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [formData, setFormData] = useState<User | null>(null);
  const [inlineEditingNip, setInlineEditingNip] = useState<string | null>(null);
  const [inlineFormData, setInlineFormData] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Trigger add modal if forceOpenAddModal is true
  useEffect(() => {
    if (forceOpenAddModal && !isAddingUser) {
      handleAddClick();
    }
  }, [forceOpenAddModal]);

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.nip.includes(searchTerm)
  );

  const handleModalEditClick = (user: User) => {
    setEditingUser(user);
    setFormData({ 
      ...user,
      username: user.username || user.nip,
      password: user.password || user.nip,
      rank: user.rank || ''
    });
  };

  const handleAddClick = () => {
    setFormData({
      name: '',
      nip: '',
      position: 'Guru Kelas',
      rank: '',
      role: 'GURU',
      username: '',
      password: ''
    });
    setIsAddingUser(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, user: User) => {
    e.stopPropagation();
    if (window.confirm(`⚠️ KONFIRMASI HAPUS\n\nApakah Anda yakin ingin menghapus pegawai:\n"${user.name}" (${user.nip})?\n\nData akan dihapus dari server.`)) {
      onDeleteUser(user.nip);
    }
  };

  const closeModals = () => {
    setEditingUser(null);
    setIsAddingUser(false);
    setFormData(null);
    if (onModalClosed) onModalClosed();
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      if (isAddingUser) {
        if(users.some(u => u.nip === formData.nip)) {
          alert("NIP sudah terdaftar!");
          return;
        }
        onAddUser(formData);
        setIsAddingUser(false);
      } else if (editingUser) {
        onUpdateUser(editingUser.nip, formData);
        setEditingUser(null);
      }
      setFormData(null);
      if (onModalClosed) onModalClosed();
    }
  };

  const handleInlineEditClick = (user: User) => {
    setInlineEditingNip(user.nip);
    setInlineFormData({ 
      ...user, 
      username: user.username || user.nip,
      rank: user.rank || ''
    });
  };

  const handleInlineCancel = () => {
    setInlineEditingNip(null);
    setInlineFormData(null);
  };

  const handleInlineSave = () => {
    if (inlineFormData && inlineEditingNip) {
      if (inlineFormData.nip !== inlineEditingNip && users.some(u => u.nip === inlineFormData.nip)) {
        alert("NIP baru sudah digunakan!");
        return;
      }
      onUpdateUser(inlineEditingNip, inlineFormData);
      setInlineEditingNip(null);
      setInlineFormData(null);
    }
  };

  const handleInlineChange = (field: keyof User, value: string) => {
    if (inlineFormData) {
      setInlineFormData({ ...inlineFormData, [field]: value });
    }
  };

  const handleSyncClick = async () => {
    setIsSyncing(true);
    await onSyncUsers();
    setTimeout(() => setIsSyncing(false), 2000);
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Data Pegawai</h2>
          <p className="text-xs text-slate-500">Kelola data guru dan akun.</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={handleSyncClick}
            disabled={isSyncing}
            className={`flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition shadow-sm font-bold text-xs ${isSyncing ? 'opacity-70 cursor-wait' : ''}`}
          >
            <UploadCloud size={14} className={isSyncing ? 'animate-bounce' : ''} />
            {isSyncing ? 'Syncing...' : 'Backup Excel'}
          </button>
          
          <button 
            onClick={handleAddClick}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white rounded-md hover:bg-brand-700 transition shadow-sm font-bold text-xs"
          >
            <Plus size={14} />
            Tambah
          </button>
        </div>
      </header>

      {/* Search Bar */}
      <div className="relative">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-400" size={14} />
          <input 
            type="text" 
            placeholder="Cari Nama / NIP..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 w-full md:w-56 shadow-sm" 
          />
      </div>

      {/* User Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                <th className="px-4 py-3">Nama Pegawai</th>
                <th className="px-4 py-3">NIP</th>
                <th className="px-4 py-3">Jabatan</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Pangkat</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                   <td colSpan={6} className="text-center py-6 text-xs text-slate-500 italic">Data tidak ditemukan</td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isEditing = inlineEditingNip === user.nip;
                  return (
                    <tr key={user.nip} className={`transition-colors text-xs ${isEditing ? 'bg-brand-50/30' : 'hover:bg-slate-50/50'}`}>
                      {/* Nama (A) */}
                      <td className="px-4 py-2.5 align-middle">
                        {isEditing && inlineFormData ? (
                          <input type="text" value={inlineFormData.name} onChange={(e) => handleInlineChange('name', e.target.value)}
                            className="w-full px-2 py-1 border border-brand-300 rounded focus:ring-1 focus:ring-brand-500 text-xs" />
                        ) : (<span className="font-semibold text-slate-700">{user.name}</span>)}
                      </td>
                      {/* NIP (B) */}
                      <td className="px-4 py-2.5 align-middle">
                        {isEditing && inlineFormData ? (
                          <input type="text" value={inlineFormData.nip} onChange={(e) => handleInlineChange('nip', e.target.value)}
                            className="w-full px-2 py-1 border border-brand-300 rounded focus:ring-1 focus:ring-brand-500 font-mono text-xs" />
                        ) : (<span className="font-mono text-slate-500">{user.nip}</span>)}
                      </td>
                      {/* Jabatan (C) */}
                      <td className="px-4 py-2.5 align-middle">
                         {isEditing && inlineFormData ? (
                          <input type="text" value={inlineFormData.position} onChange={(e) => handleInlineChange('position', e.target.value)}
                             className="w-full px-2 py-1 border border-brand-300 rounded text-xs" />
                         ) : ( <span className="text-slate-600">{user.position}</span> )}
                      </td>
                      {/* Role (D) */}
                      <td className="px-4 py-2.5 align-middle">
                        {isEditing && inlineFormData ? (
                          <select value={inlineFormData.role} onChange={(e) => handleInlineChange('role', e.target.value as UserRole)}
                             className="w-full px-2 py-1 border border-brand-300 rounded text-xs bg-white">
                             <option value="GURU">Guru</option>
                             <option value="KEPALA_SEKOLAH">Kepala Sekolah</option>
                          </select>
                        ) : (
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border
                            ${user.role === 'KEPALA_SEKOLAH' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                            {user.role === 'KEPALA_SEKOLAH' ? 'KS' : 'Guru'}
                          </span>
                        )}
                      </td>
                      {/* Pangkat (E) */}
                      <td className="px-4 py-2.5 align-middle">
                         {isEditing && inlineFormData ? (
                          <input type="text" value={inlineFormData.rank || ''} onChange={(e) => handleInlineChange('rank', e.target.value)}
                             className="w-full px-2 py-1 border border-brand-300 rounded text-xs" placeholder="-" />
                         ) : ( <span className="text-slate-600">{user.rank || '-'}</span> )}
                      </td>
                      {/* Aksi */}
                      <td className="px-4 py-2.5 align-middle text-center">
                         {isEditing ? (
                           <div className="flex items-center justify-center gap-1">
                             <button onClick={handleInlineSave} className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200"><Check size={14} /></button>
                             <button onClick={handleInlineCancel} className="p-1 bg-slate-100 text-slate-500 rounded hover:bg-slate-200"><X size={14} /></button>
                           </div>
                         ) : (
                           <div className="flex items-center justify-center gap-1">
                              <button onClick={() => handleInlineEditClick(user)} className="p-1 text-blue-500 hover:bg-blue-50 rounded" title="Edit"><Edit size={14} /></button>
                              <button onClick={() => handleModalEditClick(user)} className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded" title="Password"><Key size={14} /></button>
                              <button onClick={(e) => handleDeleteClick(e, user)} className="p-1 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Hapus"><Trash2 size={14} /></button>
                           </div>
                         )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(editingUser || isAddingUser) && formData && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">
                {isAddingUser ? 'Tambah Pegawai' : 'Edit Akun'}
              </h3>
              <button onClick={closeModals} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              {isAddingUser && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Nama</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-brand-500 text-sm" required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">NIP</label>
                      <input type="text" value={formData.nip} onChange={(e) => setFormData({...formData, nip: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-brand-500 text-sm font-mono" required />
                    </div>
                    <div>
                       <label className="block text-xs font-bold text-slate-600 mb-1">Role</label>
                       <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
                          className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-brand-500 text-sm bg-white">
                          <option value="GURU">GURU</option>
                          <option value="KEPALA_SEKOLAH">KS</option>
                        </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Jabatan</label>
                    <input type="text" value={formData.position} onChange={(e) => setFormData({...formData, position: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-brand-500 text-sm" required />
                  </div>
                   <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Pangkat / Golongan</label>
                    <input type="text" value={formData.rank || ''} onChange={(e) => setFormData({...formData, rank: e.target.value})}
                      placeholder="Contoh: Penata Muda / III a"
                      className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-brand-500 text-sm" />
                  </div>
                </>
              )}

              <div className={!isAddingUser ? "" : "border-t border-slate-100 pt-3 mt-3"}>
                <h4 className="text-xs font-bold text-brand-600 mb-3 flex items-center gap-1"><Key size={12} /> Password & Username</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Username</label>
                    <input type="text" value={formData.username || ''} onChange={(e) => setFormData({...formData, username: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-brand-500 text-xs font-mono" placeholder={formData.nip || "Username"} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Password</label>
                    <input type="text" value={formData.password || ''} onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-brand-500 text-xs font-mono" placeholder={formData.nip || "Password"} />
                     <p className="text-[9px] text-slate-400 mt-1">Default: Sama dengan NIP</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button type="button" onClick={closeModals}
                  className="flex-1 px-3 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded hover:bg-slate-50">Batal</button>
                <button type="submit" className="flex-1 px-3 py-2 bg-brand-600 text-white font-bold text-xs rounded hover:bg-brand-700 shadow-sm flex items-center justify-center gap-1">
                  <Save size={14} /> Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}