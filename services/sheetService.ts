import { LeaveRequest, User } from '../types';

// =========================================================================================
// PERHATIAN: JIKA APLIKASI TIDAK KONEK, GANTI URL DI BAWAH INI DENGAN URL DEPLOYMENT BARU
// CARA:
// 1. Buka Apps Script > Deploy > New Deployment > Select Type: Web App
// 2. Execute as: Me, Who has access: Anyone
// 3. Klik Deploy > Copy URL yang berakhiran '/exec'
// 4. Paste di bawah ini:
// =========================================================================================
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx8d4G8WwGlgJv9opdXhiJGQ7VB4mV08auRw2q97YRDMsNvTj08fI6bqr0YfJxbRwyM4w/exec'; 

/**
 * Helper function utama untuk request ke Google Apps Script.
 * Menggunakan method: 'POST' untuk memicu trigger doPost(e) di sisi server.
 * Header 'Content-Type': 'text/plain' digunakan untuk mencegah CORS preflight request.
 */
const postToSheet = async (payload: any) => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST', 
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', 
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error(`Error pada action ${payload.action}:`, error);
    // Mengembalikan object dengan status error agar UI bisa menangani
    return { status: 'error', message: String(error) };
  }
};

/**
 * ACTION: CREATE
 * Mengirim data ijin baru ke Spreadsheet
 */
export const syncToSpreadsheet = async (request: LeaveRequest) => {
  const payload = {
    action: 'create',
    id: request.id,
    nama: request.name,
    nip: request.nip,
    jabatan: request.position,
    tipe: request.type,
    alasan: request.reason,
    mulai: request.startDate,
    jamMulai: request.startTime,
    selesai: request.endDate,
    jamSelesai: request.endTime,
    status: request.status
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
 * ACTION: DELETE (BARU)
 * Menghapus data ijin dari Spreadsheet
 * Catatan: Pastikan Anda menambahkan logika 'delete' di Apps Script Anda jika ingin fitur ini bekerja permanen di database.
 */
export const deleteLeaveRequest = async (id: string) => {
  const payload = {
    action: 'delete', // Pastikan Apps Script menangani action ini jika belum
    id: id
  };

  const result = await postToSheet(payload);
  return result.status === 'success';
};

/**
 * ACTION: DOWNLOAD_PDF (BARU)
 * Meminta server membuat PDF berdasarkan template Doc
 */
export const downloadPdf = async (request: LeaveRequest) => {
  const payload = {
    action: 'download_pdf',
    nama: request.name,
    nip: request.nip,
    jabatan: request.position,
    tipe: request.type,
    alasan: request.reason,
    mulai: request.startDate,
    selesai: request.endDate
  };

  const result = await postToSheet(payload);
  return result; // Mengembalikan { status: 'success', data: 'base64...', filename: '...' }
};

/**
 * ACTION: SYNC_USERS
 * Mengirim seluruh data Guru/User ke Spreadsheet (Backup)
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
 * ACTION: GET_USERS (READ via POST)
 * Mengambil Data Users dari Spreadsheet
 */
export const getUsersFromSheet = async (): Promise<User[]> => {
  const result = await postToSheet({ action: 'get_users' });

  if (result.status === 'success' && Array.isArray(result.data)) {
    return result.data;
  }
  return [];
};

/**
 * ACTION: GET_REQUESTS (READ via POST)
 * Mengambil Data Ijin dari Spreadsheet
 */
export const getRequestsFromSheet = async (): Promise<LeaveRequest[]> => {
  const result = await postToSheet({ action: 'get_requests' });

  if (result.status === 'success' && Array.isArray(result.data)) {
    return result.data;
  }
  return [];
};