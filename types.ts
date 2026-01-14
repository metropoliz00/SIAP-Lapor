

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

// Link Google Form
export const FORM_LINKS = {
  DISPENSASI_PRIBADI: 'https://docs.google.com/forms/d/e/1FAIpQLScMGl22gmgAXjBg_dMB30rXaTVGZLbpQiiWXyJdVtJ1RB__0g/viewform',
  DISPENSASI_DINAS: 'https://docs.google.com/forms/d/e/1FAIpQLSfsQHG4r8RASmnxieutoZINa9qRDWUwlNQPljj_CWnDOEF8PA/viewform',
  IJIN: 'https://docs.google.com/forms/d/e/1FAIpQLSeTMY4LVGQwAHIOmOy0eXqy3ESxMLly1vWRvnLdo9LoXz8sKA/viewform'
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
  docUrl?: string; // Kolom P (Merged Doc URL)
}

export type ViewState = 'LOGIN' | 'DASHBOARD' | 'INPUT' | 'PROFILE' | 'USER_MANAGEMENT';