

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

// Pilihan Alasan
export const ReasonOptions = {
  DISPENSASI_PRIBADI: [
    'Mesin finger print tidak berfungsi/data jari tidak terbaca',
    'Lupa finger print',
    'Keperluan keluarga',
    'Alasan lainnya'
  ],
  DISPENSASI_DINAS: [
    'Mengikuti Upacara PHBN/Upacara lainnya',
    'Mengikuti Pengajian/Peringatan Hari Besar Keagamaan',
    'Koordinasi dengan OPD terkait lainnya',
    'Menghadiri rapat dinas',
    'Mengikuti pengarahan/briefing dari Pimpinan',
    'Alasan kedinasan lainnya'
  ]
};

// Link Google Form & Drive
export const FORM_LINKS = {
  DISPENSASI_PRIBADI: 'https://docs.google.com/forms/d/e/1FAIpQLScMGl22gmgAXjBg_dMB30rXaTVGZLbpQiiWXyJdVtJ1RB__0g/viewform',
  DISPENSASI_DINAS: 'https://docs.google.com/forms/d/e/1FAIpQLSfsQHG4r8RASmnxieutoZINa9qRDWUwlNQPljj_CWnDOEF8PA/viewform',
  IJIN: 'https://docs.google.com/forms/d/e/1FAIpQLSeTMY4LVGQwAHIOmOy0eXqy3ESxMLly1vWRvnLdo9LoXz8sKA/viewform',
  CUTI: 'https://drive.google.com/drive/folders/1_sSTcWwbD6fEdKPo_6raLIjLm-oaIyvd?usp=sharing'
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