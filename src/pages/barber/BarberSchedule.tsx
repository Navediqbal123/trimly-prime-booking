import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface DaySchedule {
  enabled: boolean;
  start: string;
  end: string;
  breakStart: string;
  breakEnd: string;
}

const defaultSchedule: Record<string, DaySchedule> = Object.fromEntries(
  DAYS.map(day => [
    day,
    {
      enabled: day !== 'Sunday',
      start: '09:00',
      end: '19:00',
      breakStart: '13:00',
      breakEnd: '14:00',
    },
  ])
);

export default function BarberSchedule() {
  const [schedule, setSchedule] = useState<Record<string, DaySchedule>>(() => {
    try {
      const saved = localStorage.getItem('trimly_barber_schedule');
      return saved ? JSON.parse(saved) : defaultSchedule;
    } catch {
      return defaultSchedule;
    }
  });
  const [saving, setSaving] = useState(false);

  const updateDay = (day: string, field: keyof DaySchedule, value: string | boolean) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    // Save locally — no backend endpoint yet
    localStorage.setItem('trimly_barber_schedule', JSON.stringify(schedule));
    toast.success('Schedule saved successfully');
    setSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold mb-2">
          My <span className="gradient-text">Schedule</span>
        </h1>
        <p className="text-muted-foreground">Set your working hours and availability</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Weekly Availability
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {DAYS.map(day => {
            const dayData = schedule[day];
            return (
              <div
                key={day}
                className={`p-4 rounded-xl border transition-colors ${
                  dayData.enabled ? 'border-border bg-card' : 'border-border/50 bg-muted/30 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={dayData.enabled}
                      onCheckedChange={(checked) => updateDay(day, 'enabled', checked)}
                    />
                    <Label className="font-semibold text-base">{day}</Label>
                  </div>
                  {!dayData.enabled && (
                    <span className="text-sm text-muted-foreground">Day off</span>
                  )}
                </div>

                {dayData.enabled && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Open</Label>
                      <Input
                        type="time"
                        value={dayData.start}
                        onChange={(e) => updateDay(day, 'start', e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Close</Label>
                      <Input
                        type="time"
                        value={dayData.end}
                        onChange={(e) => updateDay(day, 'end', e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Break Start</Label>
                      <Input
                        type="time"
                        value={dayData.breakStart}
                        onChange={(e) => updateDay(day, 'breakStart', e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Break End</Label>
                      <Input
                        type="time"
                        value={dayData.breakEnd}
                        onChange={(e) => updateDay(day, 'breakEnd', e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>

      {/* Fixed Save Button - Bottom Right */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button onClick={handleSave} disabled={saving} size="lg" className="shadow-lg">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save Schedule
        </Button>
      </div>
    </motion.div>
  );
}
