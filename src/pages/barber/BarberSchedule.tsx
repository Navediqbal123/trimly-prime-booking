import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

interface DaySchedule {
  enabled: boolean;
  start: string;
  end: string;
  breakStart: string;
  breakEnd: string;
}

const defaultSchedule: Record<string, DaySchedule> = Object.fromEntries(
  DAYS.map((day) => [
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
  const { user } = useAuth();

  const [barberId, setBarberId] = useState<string | null>(null);

  const [schedule, setSchedule] = useState<Record<string, DaySchedule>>(() => {
    try {
      const saved = localStorage.getItem('trimly_barber_schedule');
      return saved ? JSON.parse(saved) : defaultSchedule;
    } catch {
      return defaultSchedule;
    }
  });

  const [saving, setSaving] = useState(false);

  // Get approved barber ID
  useEffect(() => {
    const loadBarberId = async () => {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from('barbers')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .single();

      if (error || !data) {
        toast.error('Barber profile not found');
        return;
      }

      setBarberId(data.id);
    };

    loadBarberId();
  }, [user?.id]);

  // Load schedule from database
  useEffect(() => {
    const loadSchedule = async () => {
      if (!barberId) return;

      const { data, error } = await supabase
        .from('weekly_availability')
        .select('*')
        .eq('barber_id', barberId);

      if (error) {
        toast.error('Failed to load schedule');
        return;
      }

      if (!data || data.length === 0) return;

      const loadedSchedule = { ...defaultSchedule };

      data.forEach((item) => {
        loadedSchedule[item.day_of_week] = {
          enabled: item.enabled,
          start: item.start_time?.slice(0, 5) || '09:00',
          end: item.end_time?.slice(0, 5) || '19:00',
          breakStart: item.break_start?.slice(0, 5) || '13:00',
          breakEnd: item.break_end?.slice(0, 5) || '14:00',
        };
      });

      setSchedule(loadedSchedule);
    };

    loadSchedule();
  }, [barberId]);

  const updateDay = (
    day: string,
    field: keyof DaySchedule,
    value: string | boolean
  ) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    if (!barberId) {
      toast.error('Barber profile not found');
      return;
    }

    setSaving(true);

    try {
      const rows = DAYS.map((day) => {
        const dayData = schedule[day];

        return {
          barber_id: barberId,
          day_of_week: day,
          enabled: dayData.enabled,
          start_time: dayData.start,
          end_time: dayData.end,
          break_start: dayData.breakStart || null,
          break_end: dayData.breakEnd || null,
        };
      });

      const { error } = await supabase
        .from('weekly_availability')
        .upsert(rows, {
          onConflict: 'barber_id,day_of_week',
        });

      if (error) {
        console.error('Failed to save schedule:', error);
        toast.error('Failed to save schedule');
        return;
      }

      // Keep local copy for fast UI loading
      localStorage.setItem(
        'trimly_barber_schedule',
        JSON.stringify(schedule)
      );

      toast.success('Schedule saved successfully');
    } catch (error) {
      console.error('Failed to save schedule:', error);
      toast.error('Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="page-black space-y-6"
    >
      <div>
        <h1 className="text-3xl font-display font-bold mb-2">
          My <span className="gradient-text">Schedule</span>
        </h1>
        <p className="text-muted-foreground">
          Set your working hours and availability
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Weekly Availability
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {DAYS.map((day) => {
            const dayData = schedule[day];

            return (
              <div
                key={day}
                className={`p-4 rounded-xl border transition-colors ${
                  dayData.enabled
                    ? 'border-border bg-card'
                    : 'border-border/50 bg-muted/30 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={dayData.enabled}
                      onCheckedChange={(checked) =>
                        updateDay(day, 'enabled', checked)
                      }
                    />

                    <Label className="font-semibold text-base">
                      {day}
                    </Label>
                  </div>

                  {!dayData.enabled && (
                    <span className="text-sm text-muted-foreground">
                      Day off
                    </span>
                  )}
                </div>

                {dayData.enabled && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Open
                      </Label>

                      <Input
                        type="time"
                        value={dayData.start}
                        onChange={(e) =>
                          updateDay(day, 'start', e.target.value)
                        }
                        className="text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Close
                      </Label>

                      <Input
                        type="time"
                        value={dayData.end}
                        onChange={(e) =>
                          updateDay(day, 'end', e.target.value)
                        }
                        className="text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Break Start
                      </Label>

                      <Input
                        type="time"
                        value={dayData.breakStart}
                        onChange={(e) =>
                          updateDay(day, 'breakStart', e.target.value)
                        }
                        className="text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Break End
                      </Label>

                      <Input
                        type="time"
                        value={dayData.breakEnd}
                        onChange={(e) =>
                          updateDay(day, 'breakEnd', e.target.value)
                        }
                        className="text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Fixed Save Button - Bottom Right */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={handleSave}
          disabled={saving || !barberId}
          size="lg"
          className="shadow-lg"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Schedule
        </Button>
      </div>
    </motion.div>
  );
}