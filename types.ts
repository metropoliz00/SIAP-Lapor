
export enum LeaveType {
  SICK = 'Sakit',
  PERSONAL = 'Urusan Pribadi',
  OFFICIAL = 'Tugas Dinas',
  OTHER = 'Lainnya'
}

export enum Status {
  PENDING = 'Menunggu',
  APPROVED = 'Disetujui',
  REJECTED = 'Ditolak'
}

export type UserRole = 'GURU' | 'KEPALA_SEKOLAH';

export interface User {
  name: string;
  nip: string;
  position: string;
  role: UserRole;
  username?: string; // Kolom D (Spreadsheet)
  password?: string; // Kolom E (Spreadsheet)
}

export interface LeaveRequest {
  id: string;
  name: string;
  nip: string;
  position: string;
  department: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  type: LeaveType;
  reason: string;
  status: Status;
  createdAt: string;
}

export type ViewState = 'LOGIN' | 'DASHBOARD' | 'INPUT' | 'PROFILE' | 'USER_MANAGEMENT';