import { LeaveRequest, User, Status } from '../types';

// =========================================================================================
// KONFIGURASI KONEKSI SPREADSHEET
// =========================================================================================
// 1. Deploy Apps Script (lihat APPS_SCRIPT_GUIDE.md)
// 2. Copy 'Web App URL' dan paste di bawah ini:
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzK1yd4IqxAv2_5cJRZc42akFDVJ_PsMtjn7QwRoE74nw9uFYl5lynBSLpu7_J4BIgchg/exec'; 

// 3. (Opsional) Copy Link Spreadsheet Anda untuk tombol "Database" di Dashboard
export const SPREADSHEET_URL_VIEW = ''; 

// =========================================================================================
// DATA MOCK / DUMMY (Akan muncul jika URL di atas kosong atau koneksi gagal)
// =========================================================================================
const MOCK_USERS: User[] = [
  { name: 'Administrator', nip: 'admin', position: 'Operator', role: 'KEPALA_SEKOLAH', rank: '-', username: 'admin', password: '123' },
  { name: 'Budi Santoso', nip: '198001012005011001', position: 'Guru Kelas 6', role: 'GURU', rank: 'Pembina / IVa', username: 'budi', password: '123' },
  { name: 'Siti Aminah', nip: '198505052010012005', position: 'Guru Kelas 1', role: 'GURU', rank: 'Penata / IIIc', username: 'siti', password: '123' }
];

const MOCK_REQUESTS: LeaveRequest[] = [
  {
    id: 'mock-1',
    name: 'Siti Aminah',
    nip: '198505052010012005',
    position: 'Guru Kelas 1',
    rank: 'Penata / IIIc',
    department: 'UPT SD Negeri Remen 2',
    type: 'Cuti Tahunan',
    reason: 'Kepentingan Keluarga',
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
    startTime: '07:00',
    endTime: '14:00',
    status: Status.APPROVED,
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
     id: 'mock-2',
    name: 'Budi Santoso',
    nip: '198001012005011001',
    position: 'Guru Kelas 6',
    rank: 'Pembina / IVa',
    department: 'UPT SD Negeri Remen 2',
    type: 'Dispensasi Dinas',
    reason: 'Rapat KKG',
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
    startTime: '08:00',
    endTime: '12:00',
    status: Status.PENDING,
    createdAt: new Date().toISOString()
  }
];

/**
 * Helper function utama untuk request ke Google Apps Script.
 */
const postToSheet = async (payload: any) => {
  // Jika URL belum diisi, langsung gunakan Mock Data
  if (!GOOGLE_SCRIPT_URL) {
    console.log(`[Demo Mode] URL belum diset. Menggunakan data dummy untuk aksi: ${payload.action}`);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulasi loading
    return getMockResponse(payload);
  }

  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST', 
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', 
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.warn(`[Connection Failed] Gagal koneksi ke server (${payload.action}). Menggunakan data lokal.`);
    // Fallback ke Mock Data jika fetch gagal (misal offline)
    await new Promise(resolve => setTimeout(resolve, 800));
    return getMockResponse(payload);
  }
};

// Helper untuk mengembalikan Mock Data berdasarkan action
const getMockResponse = (payload: any) => {
    if (payload.action === 'get_users') {
        return { status: 'success', data: MOCK_USERS };
    }
    if (payload.action === 'get_requests') {
        return { status: 'success', data: MOCK_REQUESTS };
    }
    if (payload.action === 'download_pdf') {
       return { status: 'error', message: 'Fitur PDF butuh koneksi server' };
    }
    return { status: 'success', message: 'Demo mode: Action simulated successfully' };
};

/**
 * ACTION: CREATE
 * Mengirim data ijin baru ke Spreadsheet (Sheet: Data_Ijin).
 */
export const syncToSpreadsheet = async (request: LeaveRequest) => {
  const payload = {
    action: 'create',
    id: request.id,
    nama: request.name,
    nip: request.nip,
    jabatan: request.position,
    pangkat: request.rank,
    unit: request.department,
    tipe: request.type,
    alasan: request.reason,
    mulai: request.startDate,
    jamMulai: request.startTime,
    selesai: request.endDate,
    jamSelesai: request.endTime,
    status: request.status,
    tanggalPengajuan: request.createdAt,
    
  };

  const result = await postToSheet(payload);
  return result.status === 'success';
};

/**
 * ACTION: UPDATE_STATUS
 * Mengupdate status ijin (Approve/Reject)
 */
export const updateSheetStatus = async (id: string, status: string) => {
  const payload = {
    action: 'update_status',
    id: id,
    status: status
  };

  const result = await postToSheet(payload);
  return result.status === 'success';
};

/**
 * ACTION: DELETE
 * Menghapus data ijin dari Spreadsheet
 */
export const deleteLeaveRequest = async (id: string) => {
  const payload = {
    action: 'delete', 
    id: id
  };

  const result = await postToSheet(payload);
  return result.status === 'success';
};

/**
 * ACTION: DOWNLOAD_PDF
 * Meminta server membuat PDF berdasarkan template Doc
 */
export const downloadPdf = async (request: LeaveRequest) => {
  const payload = {
    action: 'download_pdf',
    nama: request.name,
    nip: request.nip,
    jabatan: request.position,
    pangkat: request.rank, // Include Pangkat for PDF
    unit: request.department,
    tipe: request.type,
    alasan: request.reason,
    mulai: request.startDate,
    selesai: request.endDate,
    jamMulai: request.startTime,
    jamSelesai: request.endTime
  };

  const result = await postToSheet(payload);
  return result; 
};

/**
 * ACTION: SYNC_USERS
 * Mengirim seluruh data Guru/User ke Spreadsheet.
 * Backend akan memecah data ini ke Sheet 'Data_Pegawai' dan 'Login'.
 */
export const syncUsersToSpreadsheet = async (users: User[]) => {
  const payload = {
    action: 'sync_users',
    users: users
  };

  const result = await postToSheet(payload);
  return result.status === 'success';
};

/**
 * ACTION: GET_USERS
 * Mengambil Data Users yang sudah digabung dari Sheet 'Data_Pegawai' dan 'Login'.
 */
export const getUsersFromSheet = async (): Promise<User[]> => {
  const result = await postToSheet({ action: 'get_users' });

  if (result.status === 'success' && Array.isArray(result.data)) {
    return result.data;
  }
  return [];
};

/**
 * ACTION: GET_REQUESTS
 * Mengambil Data Ijin dari Sheet 'Data_Ijin'.
 */
export const getRequestsFromSheet = async (): Promise<LeaveRequest[]> => {
  const result = await postToSheet({ action: 'get_requests' });

  if (result.status === 'success' && Array.isArray(result.data)) {
    return result.data;
  }
  return [];
};