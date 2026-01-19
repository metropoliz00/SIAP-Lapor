import { LeaveRequest, User, Status } from '../types';

// =========================================================================================
// KONFIGURASI KONEKSI SPREADSHEET
// =========================================================================================
// 1. Deploy Apps Script (lihat APPS_SCRIPT_GUIDE.md)
// 2. Copy 'Web App URL' dan paste di bawah ini:
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzwtynRRjRqr3UsQL01BcrvchF8slzetbwBMQF4mXS-JVMZj9jEZZ7Z8nAbB4Nf-4YD_A/exec'; 

// 3. Masukkan Link Spreadsheet (Mode View/Edit) untuk menu Review di dalam aplikasi
// Ganti URL di bawah ini dengan URL Google Sheet Anda.
export const SPREADSHEET_URL_VIEW = 'https://docs.google.com/spreadsheets/d/1Bsi96hXYUegqdlxQhQ92ncl5g01Eoy6pIlo5sisvEVA/edit?usp=sharing'; 

// =========================================================================================
// DATA MOCK / DUMMY
// =========================================================================================
const MOCK_USERS: User[] = [
  { name: 'Administrator', nip: 'admin', position: 'Operator', role: 'KEPALA_SEKOLAH', rank: '-', username: 'admin', password: '123' },
  { name: 'Budi Santoso', nip: '198001012005011001', position: 'Guru Kelas 6', role: 'GURU', rank: 'Pembina / IVa', username: 'budi', password: '123' }
];

const MOCK_REQUESTS: LeaveRequest[] = [
  {
    id: 'mock-1',
    name: 'Budi Santoso',
    nip: '198001012005011001',
    position: 'Guru Kelas 6',
    rank: 'Pembina / IVa',
    department: 'UPT SD Negeri Remen 2',
    type: 'Cuti Tahunan',
    reason: 'Kepentingan Keluarga',
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
    startTime: '07:00',
    endTime: '14:00',
    status: Status.APPROVED,
    createdAt: new Date().toISOString(),
    docUrl: ''
  }
];

const postToSheet = async (payload: any) => {
  // Jika URL kosong, gunakan Mock Data (Mode Demo)
  if (!GOOGLE_SCRIPT_URL) {
    console.log(`[Demo Mode] URL belum diset. Action: ${payload.action}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    return getMockResponse(payload);
  }

  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST', 
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    const result = await response.json();
    return result;
  } catch (error) {
    console.warn(`[Connection Failed] ${payload.action}. Error:`, error);
    
    // CRITICAL FIX: Jika gagal koneksi untuk aksi HAPUS/UPDATE/CREATE, jangan return Mock Success!
    // Return Error agar UI tahu bahwa operasi gagal.
    if (payload.action === 'delete' || payload.action === 'create' || payload.action === 'update_data' || payload.action === 'update_status') {
      console.error("Gagal melakukan perubahan data ke Database.");
      return { status: 'error', message: 'Gagal terhubung ke database. Cek koneksi internet.' };
    }

    // Hanya gunakan Mock Data saat gagal koneksi untuk READ data (get_users, get_requests)
    // agar aplikasi tetap bisa terbuka meski offline.
    await new Promise(resolve => setTimeout(resolve, 800));
    return getMockResponse(payload);
  }
};

const getMockResponse = (payload: any) => {
    if (payload.action === 'get_users') return { status: 'success', data: MOCK_USERS };
    if (payload.action === 'get_requests') return { status: 'success', data: MOCK_REQUESTS };
    if (payload.action === 'generate_pdf_drive') return { status: 'success', url: 'https://google.com', filename: 'Mock_Surat.pdf' };
    
    // Default success message for demo
    return { status: 'success', message: 'Demo Success' };
};

export const syncToSpreadsheet = async (request: LeaveRequest) => {
  return (await postToSheet({
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
  })).status === 'success';
};

export const updateRequestToSheet = async (request: LeaveRequest) => {
  return (await postToSheet({
    action: 'update_data',
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
  })).status === 'success';
};

export const updateSheetStatus = async (id: string, status: string) => {
  return (await postToSheet({ action: 'update_status', id, status })).status === 'success';
};

export const deleteLeaveRequest = async (id: string) => {
  const result = await postToSheet({ action: 'delete', id });
  console.log("Delete status:", result);
  return result.status === 'success';
};

export const syncUsersToSpreadsheet = async (users: User[]) => {
  return (await postToSheet({ action: 'sync_users', users })).status === 'success';
};

export const getUsersFromSheet = async (): Promise<User[]> => {
  const result = await postToSheet({ action: 'get_users' });
  return (result.status === 'success' && Array.isArray(result.data)) ? result.data : [];
};

export const getRequestsFromSheet = async (): Promise<LeaveRequest[]> => {
  const result = await postToSheet({ action: 'get_requests' });
  return (result.status === 'success' && Array.isArray(result.data)) ? result.data : [];
};

/**
 * GENERATE PDF
 * Mengirim request ke Apps Script untuk membuat PDF di Google Drive
 * dan menyimpan link-nya di Kolom P.
 */
export const generatePdf = async (request: LeaveRequest) => {
  const payload = {
    action: 'generate_pdf_drive',
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
    jamSelesai: request.endTime
  };
  
  const result = await postToSheet(payload);
  if (result.status === 'success') {
    return result.url; // Mengembalikan URL PDF
  }
  return null;
};