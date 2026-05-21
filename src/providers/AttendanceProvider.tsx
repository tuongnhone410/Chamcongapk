
'use client';

import React, { createContext, useMemo, useCallback, useState, useRef, useEffect } from 'react';
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
  writeBatch,
} from 'firebase/firestore';

export interface AttendanceContextType {
  sessions: WorkSession[];
  activeSession: WorkSession | undefined;
  settings: AppSettings;
  isLoaded: boolean;
  punchIn: () => void;
  punchOut: () => void;
  addManualSession: (data: { checkIn: string, checkOut: string, multiplier: number, note: string }) => void;
  batchAddSessions: (data: { 
    startDate: string, 
    endDate: string, 
    startTime: string, 
    endTime: string, 
    multiplier: number, 
    excludeSundays: boolean 
  }) => Promise<void>;
  multiAddSessions: (data: {
    dates: Date[],
    startTime: string,
    endTime: string,
    multiplier: number
  }) => Promise<void>;
  importFromCSV: (csvContent: string) => Promise<void>;
  updateSettings: (newSettings: AppSettings) => Promise<void>;
  deleteSession: (id: string) => void;
  updateSession: (updated: WorkSession) => void;
  clearAllHistory: () => Promise<void>;
  restoreHistory: () => Promise<void>;
  canUndo: boolean;
  undoCountdown: number;
  exportToCSV: () => void;
  calculateFullSalary: (periodSessions: WorkSession[]) => any;
  getAutoMultiplier: (date?: Date) => number;
  isHoliday: boolean;
}

export const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

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
  allowanceTechnical: 0,
  allowanceResponsibility: 0,
  allowancePosition: 0,
  allowancePerformance: 0,
  insuranceRate: 10.5,
  unionFee: 40000,
  incomeTax: 0,
  incomeTaxRate: 0,
  defaultMultiplier: 1.0,
  overtimeMultiplier: 1.5,
  sundayMultiplier: 2.0,
  holidayMultiplier: 3.0,
  breakTimeDeduction: 1.5,
};

const VIETNAMESE_HOLIDAYS = ['1-1', '30-4', '1-5', '2-9', '3-9'];

const isVietnameseHoliday = (date: Date) => {
  const d = date.getDate();
  const m = date.getMonth() + 1;
  return VIETNAMESE_HOLIDAYS.includes(`${d}-${m}`);
};

export function AttendanceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const db = useFirestore();

  const [canUndo, setCanUndo] = useState(false);
  const [undoCountdown, setUndoCountdown] = useState(0);
  const [deletedSessionsCache, setDeletedSessionsCache] = useState<WorkSession[]>([]);
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Memoize refs to stabilize Firebase queries
  const sessionsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'sessions'), orderBy('checkIn', 'desc'));
  }, [db, user?.uid]);

  const settingsDocRef = useMemo(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid, 'settings', 'current');
  }, [db, user?.uid]);

  const { data: sessionsData, loading: sessionsLoading } = useCollection<WorkSession>(sessionsQuery);
  const { data: settingsData, loading: settingsLoading } = useDoc<AppSettings>(settingsDocRef);

  const sessions = useMemo(() => sessionsData || [], [sessionsData]);
  const settings = useMemo(() => ({ ...defaultSettings, ...settingsData }), [settingsData]);
  const isLoaded = useMemo(() => !sessionsLoading && !settingsLoading, [sessionsLoading, settingsLoading]);

  const calculateSessionSalary = useCallback((totalMinutes: number, multiplier: number) => {
    const breakMinutes = (settings.breakTimeDeduction || 0) * 60;
    const effectiveMinutes = totalMinutes > breakMinutes ? totalMinutes - breakMinutes : totalMinutes;

    if (multiplier === 1.0) {
      const otMinutes = effectiveMinutes > 510 ? effectiveMinutes - 480 : 0;
      return (otMinutes / 60) * settings.hourlyRate * settings.overtimeMultiplier;
    } else {
      return (effectiveMinutes / 60) * settings.hourlyRate * multiplier;
    }
  }, [settings.hourlyRate, settings.overtimeMultiplier, settings.breakTimeDeduction]);

  const getAutoMultiplier = useCallback((date: Date = new Date()) => {
    if (isVietnameseHoliday(date)) return settings.holidayMultiplier;
    if (date.getDay() === 0) return settings.sundayMultiplier;
    return 1.0;
  }, [settings.holidayMultiplier, settings.sundayMultiplier]);

  const activeSession = useMemo(() => sessions.find(s => !s.checkOut), [sessions]);

  const punchIn = useCallback(() => {
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
  }, [db, user, activeSession, getAutoMultiplier]);

  const punchOut = useCallback(() => {
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
  }, [db, user, activeSession, calculateSessionSalary]);

  const addManualSession = useCallback((data: { checkIn: string, checkOut: string, multiplier: number, note: string }) => {
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
  }, [db, user, calculateSessionSalary]);

  const importFromCSV = useCallback(async (csvContent: string) => {
    if (!db || !user) return;
    const lines = csvContent.split('\n');
    if (lines.length < 2) return;

    const batch = writeBatch(db);
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = lines[i].split(',');
      const checkInStr = values[1]?.replace(/"/g, '');
      const checkOutStr = values[2]?.replace(/"/g, '');
      const multiplier = parseFloat(values[3]);
      const note = values[6]?.replace(/"/g, '') || '';

      if (checkInStr && checkOutStr) {
        const parseDate = (str: string) => {
          try {
            const [datePart, timePart] = str.split(' ');
            const [d, m, y] = datePart.split('/').map(Number);
            const [h, min, s] = timePart.split(':').map(Number);
            return new Date(y, m - 1, d, h, min, s).toISOString();
          } catch {
            return new Date(str).toISOString();
          }
        };

        const checkIn = parseDate(checkInStr);
        const checkOut = parseDate(checkOutStr);
        const diffMinutes = Math.floor((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 60000);
        const salary = calculateSessionSalary(diffMinutes, multiplier);

        const newDocRef = doc(collection(db, 'users', user.uid, 'sessions'));
        batch.set(newDocRef, {
          checkIn,
          checkOut,
          multiplier,
          totalMinutes: diffMinutes,
          salary,
          note,
          createdAt: new Date().toISOString()
        });
      }
    }
    await batch.commit();
  }, [db, user, calculateSessionSalary]);

  const multiAddSessions = useCallback(async (data: {
    dates: Date[],
    startTime: string,
    endTime: string,
    multiplier: number
  }) => {
    if (!db || !user) return;
    const batch = writeBatch(db);
    for (const date of data.dates) {
      const dateStr = date.toISOString().split('T')[0];
      const checkIn = new Date(`${dateStr}T${data.startTime}`);
      const checkOut = new Date(`${dateStr}T${data.endTime}`);
      const diffMinutes = Math.floor((checkOut.getTime() - checkIn.getTime()) / 60000);
      const finalMultiplier = data.multiplier === -1 ? getAutoMultiplier(date) : data.multiplier;
      const salary = calculateSessionSalary(diffMinutes, finalMultiplier);
      const newDocRef = doc(collection(db, 'users', user.uid, 'sessions'));
      batch.set(newDocRef, {
        checkIn: checkIn.toISOString(),
        checkOut: checkOut.toISOString(),
        multiplier: finalMultiplier,
        totalMinutes: diffMinutes,
        salary,
        note: '',
        createdAt: new Date().toISOString()
      });
    }
    await batch.commit();
  }, [db, user, calculateSessionSalary, getAutoMultiplier]);

  const batchAddSessions = useCallback(async (data: { 
    startDate: string, 
    endDate: string, 
    startTime: string, 
    endTime: string, 
    multiplier: number, 
    excludeSundays: boolean 
  }) => {
    if (!db || !user) return;
    const batch = writeBatch(db);
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    let current = new Date(start);
    while (current <= end) {
      if (data.excludeSundays && current.getDay() === 0 && data.multiplier === -1) {
        current.setDate(current.getDate() + 1);
        continue;
      }
      const dateStr = current.toISOString().split('T')[0];
      const hasSession = sessions.some(s => s.checkIn.startsWith(dateStr));
      if (!hasSession) {
        const checkIn = new Date(`${dateStr}T${data.startTime}`);
        const checkOut = new Date(`${dateStr}T${data.endTime}`);
        const actualDiff = Math.floor((checkOut.getTime() - checkIn.getTime()) / 60000);
        const finalMultiplier = data.multiplier === -1 ? getAutoMultiplier(current) : data.multiplier;
        const salary = calculateSessionSalary(actualDiff, finalMultiplier);
        const newDocRef = doc(collection(db, 'users', user.uid, 'sessions'));
        batch.set(newDocRef, {
          checkIn: checkIn.toISOString(),
          checkOut: checkOut.toISOString(),
          multiplier: finalMultiplier,
          totalMinutes: actualDiff,
          salary,
          note: '',
          createdAt: new Date().toISOString()
        });
      }
      current.setDate(current.getDate() + 1);
    }
    await batch.commit();
  }, [db, user, sessions, calculateSessionSalary, getAutoMultiplier]);

  const clearAllHistory = useCallback(async () => {
    if (!db || !user || sessions.length === 0) return;
    setDeletedSessionsCache([...sessions]);
    setCanUndo(true);
    setUndoCountdown(10);
    const batch = writeBatch(db);
    sessions.forEach(s => {
      const sRef = doc(db, 'users', user.uid, 'sessions', s.id);
      batch.delete(sRef);
    });
    await batch.commit();
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    countdownIntervalRef.current = setInterval(() => {
      setUndoCountdown(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    undoTimerRef.current = setTimeout(() => {
      setCanUndo(false);
      setDeletedSessionsCache([]);
    }, 10000);
  }, [db, user, sessions]);

  const restoreHistory = useCallback(async () => {
    if (!db || !user || !canUndo || deletedSessionsCache.length === 0) return;
    const batch = writeBatch(db);
    deletedSessionsCache.forEach(s => {
      const sRef = doc(db, 'users', user.uid, 'sessions', s.id);
      const { id, ...data } = s;
      batch.set(sRef, data);
    });
    await batch.commit();
    setCanUndo(false);
    setDeletedSessionsCache([]);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
  }, [db, user, canUndo, deletedSessionsCache]);

  const updateSettings = useCallback(async (newSettings: AppSettings) => {
    if (!db || !user) return;
    await setDoc(doc(db, 'users', user.uid, 'settings', 'current'), newSettings, { merge: true });
  }, [db, user]);

  const deleteSession = useCallback((id: string) => {
    if (!db || !user) return;
    deleteDoc(doc(db, 'users', user.uid, 'sessions', id));
  }, [db, user]);

  const updateSession = useCallback((updated: WorkSession) => {
    if (!db || !user) return;
    const salary = calculateSessionSalary(updated.totalMinutes, updated.multiplier);
    updateDoc(doc(db, 'users', user.uid, 'sessions', updated.id), { ...updated, salary });
  }, [db, user, calculateSessionSalary]);

  const calculateFullSalary = useCallback((periodSessions: WorkSession[]) => {
    const sessionSalary = periodSessions.reduce((acc, s) => acc + s.salary, 0);
    const breakMinutes = (settings.breakTimeDeduction || 0) * 60;
    
    const totalOTMinutes = periodSessions.reduce((acc, s) => {
      const effectiveMinutes = s.totalMinutes > breakMinutes ? s.totalMinutes - breakMinutes : s.totalMinutes;
      if (s.multiplier === 1.0) {
        return acc + (effectiveMinutes > 510 ? effectiveMinutes - 480 : 0);
      }
      return acc;
    }, 0);

    const lunchAllowance = periodSessions.reduce((acc, s) => {
      let dailyLunch = settings.allowanceLunchPerShift || 0;
      if (s.totalMinutes >= 600) dailyLunch += (settings.allowanceLunchOT || 0);
      return acc + dailyLunch;
    }, 0);

    let attendanceBonus = settings.allowanceAttendanceBase || 0;
    if (settings.unexcusedAbsences === 1) attendanceBonus -= 200000;
    else if (settings.unexcusedAbsences >= 2) attendanceBonus = 0;

    const baseSubjectToAbsence = (settings.allowanceTechnical || 0) + 
                                  (settings.allowanceResponsibility || 0) + 
                                  (settings.allowancePosition || 0) + 
                                  (settings.allowancePerformance || 0);
    const deductionForAbsence = (baseSubjectToAbsence / 30) * (settings.unexcusedAbsences || 0);
    
    const otherAllowances = (settings.allowanceHousing || 0) + 
                           (settings.allowanceFuel || 0) + 
                           (settings.allowancePhone || 0) + 
                           (settings.allowanceToxic || 0) +
                           (settings.allowanceBonus || 0) +
                           (settings.allowanceProduct || 0) +
                           baseSubjectToAbsence - deductionForAbsence;
    
    const grossIncome = (settings.baseMonthlySalary || 0) + sessionSalary + otherAllowances + lunchAllowance + attendanceBonus;
    const insuranceAmount = ((settings.insuranceSalary || 0) * (settings.insuranceRate || 0)) / 100;
    const incomeTaxAmount = (grossIncome * (settings.incomeTaxRate || 0)) / 100;
    const netSalary = grossIncome - insuranceAmount - (settings.unionFee || 0) - incomeTaxAmount;

    return {
      sessionSalary,
      totalOTMinutes,
      lunchAllowance,
      attendanceBonus,
      grossIncome,
      insuranceAmount,
      incomeTaxAmount,
      netSalary
    };
  }, [settings]);

  const exportToCSV = useCallback(() => {
    const headers = ["ID", "Vào làm", "Ra làm", "Hệ số", "Phút", "Lương", "Ghi chú"];
    const rows = sessions.map(s => [
      s.id,
      new Date(s.checkIn).toLocaleString('vi-VN'),
      s.checkOut ? new Date(s.checkOut).toLocaleString('vi-VN') : '',
      s.multiplier,
      s.totalMinutes,
      s.salary,
      `"${s.note || ''}"`
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
  }, [sessions]);

  const isHoliday = useMemo(() => isVietnameseHoliday(new Date()), []);

  const contextValue = useMemo(() => ({
    sessions,
    activeSession,
    settings,
    isLoaded,
    punchIn,
    punchOut,
    addManualSession,
    batchAddSessions,
    multiAddSessions,
    importFromCSV,
    updateSettings,
    deleteSession,
    updateSession,
    clearAllHistory,
    restoreHistory,
    canUndo,
    undoCountdown,
    exportToCSV,
    calculateFullSalary,
    getAutoMultiplier,
    isHoliday
  }), [
    sessions, activeSession, settings, isLoaded, punchIn, punchOut, 
    addManualSession, batchAddSessions, multiAddSessions, importFromCSV, updateSettings, deleteSession, updateSession, 
    clearAllHistory, restoreHistory, canUndo, undoCountdown,
    exportToCSV, calculateFullSalary, getAutoMultiplier, isHoliday
  ]);

  return (
    <AttendanceContext.Provider value={contextValue}>
      {children}
    </AttendanceContext.Provider>
  );
}
