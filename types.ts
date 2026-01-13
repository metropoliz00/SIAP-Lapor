
export enum Status {
  PENDING = 'Menunggu',
  APPROVED = 'Disetujui',
  REJECTED = 'Ditolak'
}

export type UserRole = 'GURU' | 'KEPALA_SEKOLAH';

// Helper constants for UI selections
export const LeaveCategories = {
  DISPENSASI_DINAS: 'Dispensasi Dinas',
  DISPENSASI_PRIBADI: 'Dispensasi Pribadi',
  IJIN: 'Ijin',
  CUTI: 'Cuti'
};

export const CutiTypes = {
  TAHUNAN: 'Cuti Tahunan',
  MELAHIRKAN: 'Cuti Melahirkan',
  HAJI: 'Cuti Haji',
  SAKIT: 'Cuti Sakit',
  LAINNYA: 'Lainnya / Input Sendiri'
};

export interface User {
  name: string;
  nip: string;
  position: string;
  rank?: string; // Kolom D (Spreadsheet) - Pangkat/Golongan
  role: UserRole;
  username?: string; 
  password?: string; 
}

export interface LeaveRequest {
  id: string;
  name: string;
  nip: string;
  position: string;
  rank?: string; // Pangkat saat mengajukan
  department: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  type: string; 
  reason: string;
  status: Status;
  createdAt: string;
}

export type ViewState = 'LOGIN' | 'DASHBOARD' | 'INPUT' | 'PROFILE' | 'USER_MANAGEMENT';
