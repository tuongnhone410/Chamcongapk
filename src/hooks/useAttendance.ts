
"use client";

import { useState, useEffect } from 'react';
import { WorkSession, AppSettings } from '@/lib/types';

const STORAGE_KEY_SESSIONS = 'timesnap_sessions';
const STORAGE_KEY_SETTINGS = 'timesnap_settings';

const defaultSettings: AppSettings = {
  baseMonthlySalary: 5730000,
  insuranceSalary: 6017000,
  hourlyRate: 27548,
  currency: '₫',
  darkMode: false,
  payday: 5,
  monthlyTarget: 10000000,
  allowanceHousing: 300000,
  allowanceFuel: 0,
  allowanceLunchPerShift: 30000,
  allowanceLunchOT: 15000,
  allowancePhone: 0,
  allowanceAttendanceBase: 600000,
  unexcusedAbsences: 0,
  annualLeaveBalance: 11, // Giả sử đã dùng 1 ngày trong tháng này (còn 11 ngày cho năm)
  allowanceToxic: 287000,
  allowanceBonus: 213000,
  insuranceRate: 10.5,
  unionFee: 40000,
  incomeTax: 0,
  defaultMultiplier: 1.0,
  sundayMultiplier: 2.0,
  holidayMultiplier: 3.0,
};

export function useAttendance() {
  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const storedSessions = localStorage.getItem(STORAGE_KEY_SESSIONS);
    const storedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);

    if (storedSessions) {
      try {
        setSessions(JSON.parse(storedSessions));
      } catch (e) {
        console.error("Failed to parse sessions", e);
      }
    }
    
    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
    
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  const saveSessions = (newSessions: WorkSession[]) => {
    setSessions(newSessions);
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(newSessions));
  };

  const updateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(newSettings));
  };

  const activeSession = sessions.find(s => !s.checkOut);

  const punchIn = (multiplier: number = 1.0) => {
    if (activeSession) return;
    const now = new Date().toISOString();
    const newSession: WorkSession = {
      id: Math.random().toString(36).substr(2, 9),
      checkIn: now,
      checkOut: null,
      totalMinutes: 0,
      salary: 0,
      multiplier,
      note: '',
      createdAt: now,
    };
    saveSessions([newSession, ...sessions]);
  };

  const punchOut = () => {
    if (!activeSession) return;
    const checkOut = new Date();
    const checkIn = new Date(activeSession.checkIn);
    const diffMinutes = Math.floor((checkOut.getTime() - checkIn.getTime()) / 60000);
    const salary = (diffMinutes / 60) * settings.hourlyRate * activeSession.multiplier;

    const updatedSessions = sessions.map(s => 
      s.id === activeSession.id 
        ? { ...s, checkOut: checkOut.toISOString(), totalMinutes: diffMinutes, salary } 
        : s
    );
    saveSessions(updatedSessions);
  };

  const deleteSession = (id: string) => {
    saveSessions(sessions.filter(s => s.id !== id));
  };

  const updateSession = (updated: WorkSession) => {
    saveSessions(sessions.map(s => s.id === updated.id ? updated : s));
  };

  const calculateFullSalary = (periodSessions: WorkSession[]) => {
    const sessionSalary = periodSessions.reduce((acc, s) => acc + s.salary, 0);
    
    const lunchAllowance = periodSessions.reduce((acc, s) => {
      let dailyLunch = settings.allowanceLunchPerShift;
      if (s.totalMinutes >= 600) { 
        dailyLunch += settings.allowanceLunchOT;
      }
      return acc + dailyLunch;
    }, 0);

    let attendanceBonus = settings.allowanceAttendanceBase;
    // Chỉ trừ chuyên cần nếu là "Nghỉ không phép" (unexcusedAbsences)
    // Phép năm không tính vào đây.
    if (settings.unexcusedAbsences === 1) {
      attendanceBonus -= 200000;
    } else if (settings.unexcusedAbsences >= 2) {
      attendanceBonus = 0;
    }
    attendanceBonus = Math.max(0, attendanceBonus);

    const otherAllowances = (settings.allowanceHousing || 0) + 
                           (settings.allowanceFuel || 0) + 
                           (settings.allowancePhone || 0) + 
                           (settings.allowanceToxic || 0) +
                           (settings.allowanceBonus || 0);
    
    const totalAllowances = otherAllowances + lunchAllowance + attendanceBonus;
    
    const grossIncome = (settings.baseMonthlySalary || 0) + sessionSalary + totalAllowances;
    
    // Bảo hiểm tính trên Lương đóng bảo hiểm (SI Wage)
    const insSalary = settings.insuranceSalary || settings.baseMonthlySalary || 0;
    const insuranceAmount = (insSalary * (settings.insuranceRate || 0)) / 100;
    
    const netSalary = grossIncome - insuranceAmount - (settings.unionFee || 0) - (settings.incomeTax || 0);

    return {
      sessionSalary,
      lunchAllowance,
      attendanceBonus,
      otherAllowances,
      totalAllowances,
      grossIncome,
      insuranceAmount,
      netSalary
    };
  };

  const exportToCSV = () => {
    const headers = ["ID", "Vào làm", "Ra làm", "Hệ số", "Phút", "Lương", "Ghi chú"];
    const rows = sessions.map(s => [
      s.id,
      new Date(s.checkIn).toLocaleString('vi-VN'),
      s.checkOut ? new Date(s.checkOut).toLocaleString('vi-VN') : '',
      s.multiplier,
      s.totalMinutes,
      s.salary,
      s.note
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `timesnap_report_${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    sessions,
    activeSession,
    settings,
    isLoaded,
    punchIn,
    punchOut,
    updateSettings,
    deleteSession,
    updateSession,
    exportToCSV,
    calculateFullSalary
  };
}
