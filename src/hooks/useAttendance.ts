
"use client";

import { useState, useEffect } from 'react';
import { WorkSession, AppSettings } from '@/lib/types';

const STORAGE_KEY_SESSIONS = 'timesnap_sessions';
const STORAGE_KEY_SETTINGS = 'timesnap_settings';

const defaultSettings: AppSettings = {
  hourlyRate: 50000,
  currency: '₫',
  darkMode: false,
  payday: 1,
  monthlyTarget: 10000000, // Mặc định 10 triệu
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
        setSettings({
          ...defaultSettings,
          ...parsed
        });
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

  const punchIn = () => {
    if (activeSession) return;

    const now = new Date().toISOString();
    const newSession: WorkSession = {
      id: Math.random().toString(36).substr(2, 9),
      checkIn: now,
      checkOut: null,
      totalMinutes: 0,
      salary: 0,
      note: '',
      createdAt: now,
    };

    saveSessions([newSession, ...sessions]);
  };

  const punchOut = () => {
    if (!activeSession) return;

    const checkOut = new Date();
    const checkIn = new Date(activeSession.checkIn);
    const diffMs = checkOut.getTime() - checkIn.getTime();
    const diffMinutes = Math.floor(diffMs / 1000 / 60);
    const hours = diffMinutes / 60;
    const salary = hours * settings.hourlyRate;

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

  const exportToCSV = () => {
    const headers = ["ID", "Vào làm", "Ra làm", "Phút", "Lương", "Ghi chú"];
    const rows = sessions.map(s => [
      s.id,
      new Date(s.checkIn).toLocaleString('vi-VN'),
      s.checkOut ? new Date(s.checkOut).toLocaleString('vi-VN') : '',
      s.totalMinutes,
      s.salary,
      s.note
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

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
  };
}
