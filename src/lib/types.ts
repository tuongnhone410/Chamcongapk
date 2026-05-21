
export interface WorkSession {
  id: string;
  checkIn: string; // ISO string
  checkOut: string | null; // ISO string
  totalMinutes: number;
  salary: number;
  note: string;
  createdAt: string;
}

export interface AppSettings {
  hourlyRate: number;
  currency: string;
  darkMode: boolean;
  payday: number; // Ngày chốt lương (1-31)
}
