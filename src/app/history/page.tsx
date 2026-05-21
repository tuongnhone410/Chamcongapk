
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
import { History, Trash2, Edit3, Clock, Calendar, StickyNote } from 'lucide-react';
import { useState } from 'react';
import { WorkSession } from '@/lib/types';

export default function HistoryPage() {
  const { sessions, isLoaded, deleteSession, updateSession, settings } = useAttendance();
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
    return `${settings.currency}${val.toFixed(2)}`;
  };

  const handleUpdate = () => {
    if (editingSession) {
      const checkIn = new Date(editingSession.checkIn);
      const checkOut = new Date(editingSession.checkOut || '');
      const diffMs = checkOut.getTime() - checkIn.getTime();
      const diffMinutes = Math.floor(diffMs / 1000 / 60);
      const salary = (diffMinutes / 60) * settings.hourlyRate;
      
      updateSession({
        ...editingSession,
        totalMinutes: diffMinutes,
        salary: salary
      });
      setEditingSession(null);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold font-headline">Attendance Log</h1>
        <p className="text-muted-foreground text-sm">Review and edit your past work sessions</p>
      </header>

      {completedSessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="p-6 rounded-full bg-muted/50">
            <History className="w-12 h-12 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-bold">No history yet</h3>
            <p className="text-muted-foreground text-sm">Your completed work sessions will appear here.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {completedSessions.map((session) => (
            <Card key={session.id} className="border-none shadow-sm overflow-hidden group">
              <CardContent className="p-0">
                <div className="p-4 flex items-center justify-between border-b bg-muted/10">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="font-bold text-sm">
                      {new Date(session.checkIn).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
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
                          <DialogTitle>Edit Session</DialogTitle>
                        </DialogHeader>
                        {editingSession && (
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Check In Time</Label>
                              <Input 
                                type="datetime-local" 
                                value={editingSession.checkIn.slice(0, 16)}
                                onChange={(e) => setEditingSession({...editingSession, checkIn: new Date(e.target.value).toISOString()})}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Check Out Time</Label>
                              <Input 
                                type="datetime-local" 
                                value={editingSession.checkOut?.slice(0, 16) || ''}
                                onChange={(e) => setEditingSession({...editingSession, checkOut: new Date(e.target.value).toISOString()})}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Note</Label>
                              <Input 
                                placeholder="Add a note..." 
                                value={editingSession.note}
                                onChange={(e) => setEditingSession({...editingSession, note: e.target.value})}
                              />
                            </div>
                          </div>
                        )}
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setEditingSession(null)}>Cancel</Button>
                          <Button onClick={handleUpdate}>Save Changes</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                <div className="p-4 grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Shift</p>
                    <p className="text-xs font-medium">
                      {new Date(session.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      <span className="mx-1">→</span>
                      {new Date(session.checkOut!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Duration</p>
                    <div className="flex items-center space-x-1 text-xs font-medium">
                      <Clock className="w-3 h-3 text-primary" />
                      <span>{formatHours(session.totalMinutes)}</span>
                    </div>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Pay</p>
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
          ))}
        </div>
      )}
    </div>
  );
}
