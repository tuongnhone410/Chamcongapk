
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
  addManualSession: (data: { checkIn: string, checkOut: string, multiplier: number, note: string }) => Promise<void>;
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
  currency: 'đ',
  darkMode: false,
  payday: 5,
  monthlyTarget: 0,
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
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();

  const [canUndo, setCanUndo] = useState(false);
  const [undoCountdown, setUndoCountdown] = useState(0);
  const [deletedSessionsCache, setDeletedSessionsCache] = useState<WorkSession[]>([]);
  const [localActiveStart, setLocalActiveStart] = useState<string | null>(null);
  
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Khóa lưu trữ riêng biệt theo User ID để tránh chồng lấn dữ liệu giữa các tài khoản
  const storageKey = useMemo(() => user ? `timesnap_active_start_${user.uid}` : null, [user?.uid]);

  useEffect(() => {
    if (typeof window !== 'undefined' && storageKey) {
      const saved = localStorage.getItem(storageKey);
      setLocalActiveStart(saved);
    } else {
      setLocalActiveStart(null);
    }
  }, [storageKey]);

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
  
  // Trạng thái sẵn sàng chỉ khi đã xác thực user và tải xong dữ liệu của chính user đó
  const isLoaded = useMemo(() => {
    return !!user && !sessionsLoading && !settingsLoading && !userLoading;
  }, [user, sessionsLoading, settingsLoading, userLoading]);

  const calculateSessionSalary = useCallback((totalMinutes: number, multiplier: number) => {
    const breakMinutes = (settings.breakTimeDeduction || 0) * 60;
    const effectiveMinutes = totalMinutes > breakMinutes ? totalMinutes - breakMinutes : totalMinutes;
    if (multiplier === 1.0) {
      const otMinutes = effectiveMinutes > 510 ? effectiveMinutes - 480 : 0;
      return (otMinutes / 60) * settings.hourlyRate * settings.overtimeMultiplier;
    } else {
      return (effectiveMinutes / 60) * settings.hourlyRate * multiplier;
    }
  }, [settings]);

  const getAutoMultiplier = useCallback((date: Date = new Date()) => {
    if (isVietnameseHoliday(date)) return settings.holidayMultiplier;
    if (date.getDay() === 0) return settings.sundayMultiplier;
    return 1.0;
  }, [settings]);

  const activeSession = useMemo(() => {
    if (!user) return undefined;

    // 1. Kiểm tra phiên mở trên Firestore (Dữ liệu chuẩn nhất)
    const fromDb = sessions.find(s => !s.checkOut);
    if (fromDb) {
      if (typeof window !== 'undefined' && storageKey) {
        localStorage.setItem(storageKey, fromDb.checkIn);
      }
      return fromDb;
    }

    // 2. Dự phòng bằng localStorage cá nhân (Dùng khi mạng yếu hoặc vừa vào lại app)
    if (localActiveStart) {
      const alreadyClosedOnServer = sessions.some(s => s.checkIn === localActiveStart && s.checkOut);
      
      if (alreadyClosedOnServer && !sessionsLoading) {
        if (typeof window !== 'undefined' && storageKey) {
          localStorage.removeItem(storageKey);
        }
        setTimeout(() => setLocalActiveStart(null), 0);
        return undefined;
      }

      return {
        id: 'local-temp',
        checkIn: localActiveStart,
        checkOut: null,
        totalMinutes: 0,
        salary: 0,
        multiplier: getAutoMultiplier(new Date(localActiveStart)),
        note: '',
        createdAt: localActiveStart
      } as WorkSession;
    }

    return undefined;
  }, [sessions, localActiveStart, storageKey, sessionsLoading, getAutoMultiplier, user]);

  const punchIn = useCallback(() => {
    if (!db || !user || activeSession) return;
    const now = new Date();
    const isoStr = now.toISOString();
    
    if (typeof window !== 'undefined' && storageKey) {
      localStorage.setItem(storageKey, isoStr);
    }
    setLocalActiveStart(isoStr);

    addDoc(collection(db, 'users', user.uid, 'sessions'), {
      checkIn: isoStr,
      checkOut: null,
      totalMinutes: 0,
      salary: 0,
      multiplier: getAutoMultiplier(now),
      note: '',
      createdAt: isoStr
    });
  }, [db, user, activeSession, storageKey, getAutoMultiplier]);

  const punchOut = useCallback(() => {
    if (!db || !user || !activeSession) return;
    
    if (typeof window !== 'undefined' && storageKey) {
      localStorage.removeItem(storageKey);
    }
    setLocalActiveStart(null);

    const checkOut = new Date();
    const checkIn = new Date(activeSession.checkIn);
    const diffMinutes = Math.floor((checkOut.getTime() - checkIn.getTime()) / 60000);
    
    const targetSessionId = activeSession.id === 'local-temp' 
      ? sessions.find(s => !s.checkOut)?.id 
      : activeSession.id;

    if (targetSessionId) {
      updateDoc(doc(db, 'users', user.uid, 'sessions', targetSessionId), {
        checkOut: checkOut.toISOString(),
        totalMinutes: diffMinutes,
        salary: calculateSessionSalary(diffMinutes, activeSession.multiplier)
      });
    }
  }, [db, user, activeSession, sessions, storageKey, calculateSessionSalary]);

  const addManualSession = useCallback(async (data: { checkIn: string, checkOut: string, multiplier: number, note: string }) => {
    if (!db || !user) return;
    const checkIn = new Date(data.checkIn);
    const checkOut = new Date(data.checkOut);
    const diffMinutes = Math.floor((checkOut.getTime() - checkIn.getTime()) / 60000);
    
    await addDoc(collection(db, 'users', user.uid, 'sessions'), {
      checkIn: checkIn.toISOString(),
      checkOut: checkOut.toISOString(),
      multiplier: data.multiplier,
      totalMinutes: diffMinutes,
      salary: calculateSessionSalary(diffMinutes, data.multiplier),
      note: data.note || '',
      createdAt: new Date().toISOString()
    });
  }, [db, user, calculateSessionSalary]);

  const multiAddSessions = useCallback(async (data: { dates: Date[], startTime: string, endTime: string, multiplier: number }) => {
    if (!db || !user) return;
    const batch = writeBatch(db);
    data.dates.forEach(date => {
      const dateStr = date.toISOString().split('T')[0];
      const checkIn = new Date(`${dateStr}T${data.startTime}`);
      const checkOut = new Date(`${dateStr}T${data.endTime}`);
      const diffMinutes = Math.floor((checkOut.getTime() - checkIn.getTime()) / 60000);
      const mult = data.multiplier === -1 ? getAutoMultiplier(date) : data.multiplier;
      const newDocRef = doc(collection(db, 'users', user.uid, 'sessions'));
      batch.set(newDocRef, {
        checkIn: checkIn.toISOString(),
        checkOut: checkOut.toISOString(),
        multiplier: mult,
        totalMinutes: diffMinutes,
        salary: calculateSessionSalary(diffMinutes, mult),
        note: '',
        createdAt: new Date().toISOString()
      });
    });
    await batch.commit();
  }, [db, user, calculateSessionSalary, getAutoMultiplier]);

  const batchAddSessions = useCallback(async (data: { startDate: string, endDate: string, startTime: string, endTime: string, multiplier: number, excludeSundays: boolean }) => {
    if (!db || !user) return;
    const batch = writeBatch(db);
    let current = new Date(data.startDate);
    const end = new Date(data.endDate);
    while (current <= end) {
      if (!(data.excludeSundays && current.getDay() === 0)) {
        const dateStr = current.toISOString().split('T')[0];
        const hasSession = sessions.some(s => s.checkIn.startsWith(dateStr));
        if (!hasSession) {
          const checkIn = new Date(`${dateStr}T${data.startTime}`);
          const checkOut = new Date(`${dateStr}T${data.endTime}`);
          const diff = Math.floor((checkOut.getTime() - checkIn.getTime()) / 60000);
          const mult = data.multiplier === -1 ? getAutoMultiplier(current) : data.multiplier;
          const newDocRef = doc(collection(db, 'users', user.uid, 'sessions'));
          batch.set(newDocRef, {
            checkIn: checkIn.toISOString(),
            checkOut: checkOut.toISOString(),
            multiplier: mult,
            totalMinutes: diff,
            salary: calculateSessionSalary(diff, mult),
            note: '',
            createdAt: new Date().toISOString()
          });
        }
      }
      current.setDate(current.getDate() + 1);
    }
    await batch.commit();
  }, [db, user, sessions, calculateSessionSalary, getAutoMultiplier]);

  const importFromCSV = useCallback(async (csvContent: string) => {
    if (!db || !user) return;
    const lines = csvContent.split('\n').filter(l => l.trim());
    if (lines.length <= 1) return;
    
    const batch = writeBatch(db);
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length < 6) continue;
      
      const newDocRef = doc(collection(db, 'users', user.uid, 'sessions'));
      batch.set(newDocRef, {
        checkIn: parts[1],
        checkOut: parts[2] || null,
        multiplier: parseFloat(parts[3]),
        totalMinutes: parseInt(parts[4]),
        salary: parseFloat(parts[5]),
        note: parts[6] || '',
        createdAt: new Date().toISOString()
      });
    }
    await batch.commit();
  }, [db, user]);

  const clearAllHistory = useCallback(async () => {
    if (!db || !user || sessions.length === 0) return;
    setDeletedSessionsCache([...sessions]);
    setCanUndo(true);
    setUndoCountdown(10);
    const batch = writeBatch(db);
    sessions.forEach(s => batch.delete(doc(db, 'users', user.uid, 'sessions', s.id)));
    await batch.commit();
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    countdownIntervalRef.current = setInterval(() => setUndoCountdown(p => p - 1), 1000);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => { setCanUndo(false); setDeletedSessionsCache([]); if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current); }, 10000);
  }, [db, user, sessions]);

  const restoreHistory = useCallback(async () => {
    if (!db || !user || !canUndo) return;
    const batch = writeBatch(db);
    deletedSessionsCache.forEach(s => {
      const { id, ...data } = s;
      batch.set(doc(db, 'users', user.uid, 'sessions', id), data);
    });
    await batch.commit();
    setCanUndo(false);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
  }, [db, user, canUndo, deletedSessionsCache]);

  const updateSettings = useCallback(async (newSettings: AppSettings) => {
    if (!db || !user) return;
    await setDoc(doc(db, 'users', user.uid, 'settings', 'current'), newSettings, { merge: true });
  }, [db, user]);

  const deleteSession = useCallback(async (id: string) => {
    if (!db || !user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'sessions', id));
  }, [db, user]);

  const updateSession = useCallback(async (updated: WorkSession) => {
    if (!db || !user) return;
    await updateDoc(doc(db, 'users', user.uid, 'sessions', updated.id), { 
      ...updated, 
      salary: calculateSessionSalary(updated.totalMinutes, updated.multiplier) 
    });
  }, [db, user, calculateSessionSalary]);

  const calculateFullSalary = useCallback((periodSessions: WorkSession[]) => {
    const sessionSalary = periodSessions.reduce((acc, s) => acc + s.salary, 0);
    const breakMinutes = (settings.breakTimeDeduction || 0) * 60;
    const totalOTMinutes = periodSessions.reduce((acc, s) => {
      const effective = s.totalMinutes > breakMinutes ? s.totalMinutes - breakMinutes : s.totalMinutes;
      return acc + (s.multiplier === 1.0 ? (effective > 510 ? effective - 480 : 0) : effective);
    }, 0);
    const lunchAllowance = periodSessions.reduce((acc, s) => acc + (settings.allowanceLunchPerShift || 0) + (s.totalMinutes >= 600 ? (settings.allowanceLunchOT || 0) : 0), 0);
    let attendanceBonus = settings.allowanceAttendanceBase || 0;
    if (settings.unexcusedAbsences === 1) attendanceBonus -= 200000;
    else if (settings.unexcusedAbsences >= 2) attendanceBonus = 0;
    const baseSubjectToAbsence = (settings.allowanceTechnical || 0) + (settings.allowanceResponsibility || 0) + (settings.allowancePosition || 0) + (settings.allowancePerformance || 0);
    const deduction = (baseSubjectToAbsence / 30) * (settings.unexcusedAbsences || 0);
    const other = (settings.allowanceHousing || 0) + (settings.allowanceFuel || 0) + (settings.allowancePhone || 0) + (settings.allowanceToxic || 0) + (settings.allowanceBonus || 0) + (settings.allowanceProduct || 0) + baseSubjectToAbsence - deduction;
    const gross = (settings.baseMonthlySalary || 0) + sessionSalary + other + lunchAllowance + attendanceBonus;
    const insurance = ((settings.insuranceSalary || 0) * (settings.insuranceRate || 0)) / 100;
    const tax = (gross * (settings.incomeTaxRate || 0)) / 100;
    const net = gross - insurance - (settings.unionFee || 0) - tax;
    return { sessionSalary, totalOTMinutes, lunchAllowance, attendanceBonus, grossIncome: gross, insuranceAmount: insurance, incomeTaxAmount: tax, netSalary: net };
  }, [settings]);

  const exportToCSV = useCallback(() => {
    const headers = ["ID", "Vao lam", "Ra lam", "He so", "Phut", "Luong", "Ghi chu"];
    const rows = sessions.map(s => [s.id, s.checkIn, s.checkOut || '', s.multiplier, s.totalMinutes, s.salary, s.note || '']);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "timesnap_report.csv";
    link.click();
  }, [sessions]);

  const isHoliday = useMemo(() => isVietnameseHoliday(new Date()), []);

  const contextValue = useMemo(() => ({
    sessions, activeSession, settings, isLoaded, punchIn, punchOut, addManualSession, batchAddSessions, multiAddSessions, importFromCSV, updateSettings, deleteSession, updateSession, clearAllHistory, restoreHistory, canUndo, undoCountdown, exportToCSV, calculateFullSalary, getAutoMultiplier, isHoliday
  }), [sessions, activeSession, settings, isLoaded, punchIn, punchOut, addManualSession, batchAddSessions, multiAddSessions, importFromCSV, updateSettings, deleteSession, updateSession, clearAllHistory, restoreHistory, canUndo, undoCountdown, exportToCSV, calculateFullSalary, getAutoMultiplier, isHoliday]);

  return <AttendanceContext.Provider value={contextValue}>{children}</AttendanceContext.Provider>;
}
