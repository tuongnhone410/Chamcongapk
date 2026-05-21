
"use client";

import { useAttendance } from '@/hooks/useAttendance';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { History, Trash2, Edit3, Clock, Calendar, StickyNote, Download, Zap } from 'lucide-react';
import { useState } from 'react';
import { WorkSession } from '@/lib/types';

export default function HistoryPage() {
  const { sessions, isLoaded, deleteSession, updateSession, settings, exportToCSV } = useAttendance();
  const [editingSession, setEditingSession] = useState<WorkSession | null>(null);

  if (!isLoaded) return null;

  const completedSessions = sessions.filter(s => s.checkOut).sort((a, b) => 
    new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime()
  );

  const formatHours = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const formatCurrency = (val: number) => {
    return `${Math.round(val).toLocaleString('vi-VN')}${settings.currency}`;
  };

  const handleUpdate = () => {
    if (editingSession) {
      const checkIn = new Date(editingSession.checkIn);
      const checkOut = new Date(editingSession.checkOut || '');
      const diffMs = checkOut.getTime() - checkIn.getTime();
      const diffMinutes = Math.floor(diffMs / 1000 / 60);
      
      updateSession({
        ...editingSession,
        totalMinutes: diffMinutes,
      });
      setEditingSession(null);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-headline">Nhật Ký Chấm Công</h1>
          <p className="text-muted-foreground text-sm">Xem và chỉnh sửa các phiên làm việc</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 text-xs"
          onClick={exportToCSV}
          disabled={completedSessions.length === 0}
        >
          <Download className="w-3.5 h-3.5" />
          Xuất CSV
        </Button>
      </header>

      {completedSessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="p-6 rounded-full bg-muted/50">
            <History className="w-12 h-12 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Chưa có lịch sử</h3>
            <p className="text-muted-foreground text-sm">Các phiên làm việc đã hoàn thành sẽ xuất hiện ở đây.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {completedSessions.map((session) => {
            const otMinutes = session.multiplier === 1.0 ? Math.max(0, session.totalMinutes - 480) : session.totalMinutes;
            
            return (
              <Card key={session.id} className="border-none shadow-sm overflow-hidden group">
                <CardContent className="p-0">
                  <div className="p-4 flex items-center justify-between border-b bg-muted/10">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="font-bold text-sm">
                        {new Date(session.checkIn).toLocaleDateString('vi-VN', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                        onClick={() => deleteSession(session.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Dialog open={editingSession?.id === session.id} onOpenChange={(open) => !open && setEditingSession(null)}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                            onClick={() => setEditingSession(session)}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Chỉnh Sửa Phiên</DialogTitle>
                          </DialogHeader>
                          {editingSession && (
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>Thời gian vào</Label>
                                <Input 
                                  type="datetime-local" 
                                  value={editingSession.checkIn.slice(0, 16)}
                                  onChange={(e) => setEditingSession({...editingSession, checkIn: new Date(e.target.value).toISOString()})}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Thời gian ra</Label>
                                <Input 
                                  type="datetime-local" 
                                  value={editingSession.checkOut?.slice(0, 16) || ''}
                                  onChange={(e) => setEditingSession({...editingSession, checkOut: new Date(e.target.value).toISOString()})}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Ghi chú</Label>
                                <Input 
                                  placeholder="Thêm ghi chú..." 
                                  value={editingSession.note}
                                  onChange={(e) => setEditingSession({...editingSession, note: e.target.value})}
                                />
                              </div>
                            </div>
                          )}
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setEditingSession(null)}>Hủy</Button>
                            <Button onClick={handleUpdate}>Lưu thay đổi</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                  <div className="p-4 grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Thời gian</p>
                      <p className="text-xs font-medium">
                        {new Date(session.checkIn).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        <span className="mx-1">→</span>
                        {new Date(session.checkOut!).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Tăng ca (OT)</p>
                      <div className="flex items-center space-x-1 text-xs font-medium text-orange-600">
                        <Zap className="w-3 h-3" />
                        <span>{formatHours(otMinutes)}</span>
                      </div>
                      <p className="text-[9px] text-muted-foreground">Tổng: {formatHours(session.totalMinutes)}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Lương OT</p>
                      <p className="text-sm font-black text-primary">{formatCurrency(session.salary)}</p>
                    </div>
                  </div>
                  {session.note && (
                    <div className="px-4 pb-4 flex items-start space-x-2">
                      <StickyNote className="w-3 h-3 text-muted-foreground mt-0.5" />
                      <p className="text-xs text-muted-foreground italic">{session.note}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
