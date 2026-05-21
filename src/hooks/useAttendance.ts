
'use client';

import { useState, useEffect, useMemo } from 'react';
import { WorkSession, AppSettings } from '@/lib/types';
import { 
  useUser, 
  useFirestore, 
  useCollection, 
  useDoc 
} from '@/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  updateDoc,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';

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
  annualLeaveBalance: 11,
  allowanceToxic: 287000,
  allowanceBonus: 213000,
  allowanceProduct: 2500000, 
  insuranceRate: 10.5,
  unionFee: 40000,
  incomeTax: 0,
  incomeTaxRate: 0,
  defaultMultiplier: 1.0,
  overtimeMultiplier: 1.5,
  sundayMultiplier: 2.0,
  holidayMultiplier: 3.0,
};

const isVietnameseHoliday = (date: Date) => {
  const d = date.getDate();
  const m = date.getMonth() + 1;
  const fixedHolidays = ['1-1', '30-4', '1-5', '2-9', '3-9'];
  return fixedHolidays.includes(`${d}-${m}`);
};

export function useAttendance() {
  const { user } = useUser();
  const db = useFirestore();

  // Firestore Queries
  const sessionsRef = useMemo(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'sessions'), orderBy('checkIn', 'desc'));
  }, [db, user]);

  const settingsRef = useMemo(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid, 'settings', 'current');
  }, [db, user]);

  const { data: sessionsData, loading: sessionsLoading } = useCollection<WorkSession>(sessionsRef);
  const { data: settingsData, loading: settingsLoading } = useDoc<AppSettings>(settingsRef);

  const sessions = sessionsData || [];
  const settings = settingsData || defaultSettings;
  const isLoaded = !sessionsLoading && !settingsLoading;

  const calculateSessionSalary = (totalMinutes: number, multiplier: number) => {
    if (multiplier === 1.0) {
      const otMinutes = totalMinutes > 510 ? totalMinutes - 480 : 0;
      return (otMinutes / 60) * settings.hourlyRate * settings.overtimeMultiplier;
    } else {
      return (totalMinutes / 60) * settings.hourlyRate * multiplier;
    }
  };

  const getAutoMultiplier = (date: Date = new Date()) => {
    if (isVietnameseHoliday(date)) return settings.holidayMultiplier;
    if (date.getDay() === 0) return settings.sundayMultiplier;
    return 1.0;
  };

  const activeSession = sessions.find(s => !s.checkOut);

  const punchIn = () => {
    if (!db || !user || activeSession) return;
    const now = new Date();
    const multiplier = getAutoMultiplier(now);
    
    addDoc(collection(db, 'users', user.uid, 'sessions'), {
      checkIn: now.toISOString(),
      checkOut: null,
      totalMinutes: 0,
      salary: 0,
      multiplier,
      note: '',
      createdAt: now.toISOString()
    });
  };

  const punchOut = () => {
    if (!db || !user || !activeSession) return;
    const checkOut = new Date();
    const checkIn = new Date(activeSession.checkIn);
    const diffMinutes = Math.floor((checkOut.getTime() - checkIn.getTime()) / 60000);
    const salary = calculateSessionSalary(diffMinutes, activeSession.multiplier);

    updateDoc(doc(db, 'users', user.uid, 'sessions', activeSession.id), {
      checkOut: checkOut.toISOString(),
      totalMinutes: diffMinutes,
      salary
    });
  };

  const addManualSession = (data: { checkIn: string, checkOut: string, multiplier: number, note: string }) => {
    if (!db || !user) return;
    const checkIn = new Date(data.checkIn);
    const checkOut = new Date(data.checkOut);
    const diffMinutes = Math.floor((checkOut.getTime() - checkIn.getTime()) / 60000);
    const salary = calculateSessionSalary(diffMinutes, data.multiplier);
    
    addDoc(collection(db, 'users', user.uid, 'sessions'), {
      ...data,
      totalMinutes: diffMinutes,
      salary,
      createdAt: new Date().toISOString()
    });
  };

  const updateSettings = (newSettings: AppSettings) => {
    if (!db || !user) return;
    setDoc(doc(db, 'users', user.uid, 'settings', 'current'), newSettings, { merge: true });
  };

  const deleteSession = (id: string) => {
    if (!db || !user) return;
    deleteDoc(doc(db, 'users', user.uid, 'sessions', id));
  };

  const updateSession = (updated: WorkSession) => {
    if (!db || !user) return;
    const salary = calculateSessionSalary(updated.totalMinutes, updated.multiplier);
    updateDoc(doc(db, 'users', user.uid, 'sessions', updated.id), { ...updated, salary });
  };

  const calculateFullSalary = (periodSessions: WorkSession[]) => {
    const sessionSalary = periodSessions.reduce((acc, s) => acc + s.salary, 0);
    const lunchAllowance = periodSessions.reduce((acc, s) => {
      let dailyLunch = settings.allowanceLunchPerShift;
      if (s.totalMinutes >= 600) dailyLunch += settings.allowanceLunchOT;
      return acc + dailyLunch;
    }, 0);

    let attendanceBonus = settings.allowanceAttendanceBase;
    if (settings.unexcusedAbsences === 1) attendanceBonus -= 200000;
    else if (settings.unexcusedAbsences >= 2) attendanceBonus = 0;
    attendanceBonus = Math.max(0, attendanceBonus);

    const otherAllowances = (settings.allowanceHousing || 0) + 
                           (settings.allowanceFuel || 0) + 
                           (settings.allowancePhone || 0) + 
                           (settings.allowanceToxic || 0) +
                           (settings.allowanceBonus || 0) +
                           (settings.allowanceProduct || 0);
    
    const grossIncome = (settings.baseMonthlySalary || 0) + sessionSalary + otherAllowances + lunchAllowance + attendanceBonus;
    const insuranceAmount = ((settings.insuranceSalary || 0) * (settings.insuranceRate || 0)) / 100;
    const incomeTaxAmount = (grossIncome * (settings.incomeTaxRate || 0)) / 100;
    const netSalary = grossIncome - insuranceAmount - (settings.unionFee || 0) - incomeTaxAmount;

    return {
      sessionSalary,
      lunchAllowance,
      attendanceBonus,
      productSalary: settings.allowanceProduct || 0,
      otherAllowances: otherAllowances - (settings.allowanceProduct || 0),
      grossIncome,
      insuranceAmount,
      incomeTaxAmount,
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
    addManualSession,
    updateSettings,
    deleteSession,
    updateSession,
    exportToCSV,
    calculateFullSalary,
    getAutoMultiplier,
    isHoliday: isVietnameseHoliday(new Date())
  };
}
