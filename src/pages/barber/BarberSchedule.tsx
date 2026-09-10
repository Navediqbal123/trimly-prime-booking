import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Save, Loader2, ChevronRight } from 'lucide-react';
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
        toast.error(error.message || 'Failed to save schedule');
        return;
      }

      localStorage.setItem(
        'trimly_barber_schedule',
        JSON.stringify(schedule)
      );

      toast.success('Schedule saved successfully');
    } catch (error) {
      console.error('Failed to save schedule:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to save schedule'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-full pb-28"
    >
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50 border border-orange-200/70 flex items-center justify-center shadow-sm">
            <Clock className="w-5 h-5 text-orange-500" />
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-slate-900">
              My Schedule
            </h1>
            <p className="text-sm text-slate-500">
              Set your working hours and availability
            </p>
          </div>
        </div>
      </div>

      {/* Weekly Availability */}
      <Card className="relative overflow-hidden border border-orange-100/80 bg-white/75 backdrop-blur-xl shadow-[0_12px_40px_rgba(249,115,22,0.08)] rounded-[24px]">
        {/* Soft ambient glow */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-56 h-56 rounded-full bg-orange-200/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 -left-20 w-48 h-48 rounded-full bg-orange-100/20 blur-3xl" />

        <CardHeader className="relative pb-4 border-b border-orange-100/70">
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-500" />
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Weekly Availability
              </h2>
              <p className="text-xs sm:text-sm font-normal text-slate-500 mt-0.5">
                Manage your working hours for each day
              </p>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="relative p-4 sm:p-6 space-y-3">
          {DAYS.map((day, index) => {
            const dayData = schedule[day];

            return (
              <motion.div
                key={day}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.035 }}
                className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
                  dayData.enabled
                    ? 'border-orange-100 bg-gradient-to-br from-white via-white to-orange-50/35 shadow-[0_5px_20px_rgba(249,115,22,0.06)]'
                    : 'border-slate-200/80 bg-slate-50/70'
                }`}
              >
                {/* Day ambient glow */}
                {dayData.enabled && (
                  <div className="pointer-events-none absolute -right-16 -top-16 w-32 h-32 rounded-full bg-orange-200/15 blur-2xl" />
                )}

                <div className="relative p-4 sm:p-5">
                  {/* Day Header */}
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={dayData.enabled}
                        onCheckedChange={(checked) =>
                          updateDay(day, 'enabled', checked)
                        }
                        className="data-[state=checked]:bg-[#8B5CF6] data-[state=unchecked]:bg-slate-300"
                      />

                      <div>
                        <Label className="font-bold text-[15px] sm:text-base text-slate-900 cursor-pointer">
                          {day}
                        </Label>

                        {!dayData.enabled && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            Day off
                          </p>
                        )}
                      </div>
                    </div>

                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        dayData.enabled
                          ? 'bg-orange-50 text-orange-400'
                          : 'bg-slate-100 text-slate-300'
                      }`}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Time Fields */}
                  {dayData.enabled && (
                    <div className="grid grid-cols-2 gap-3">
                      {/* Open */}
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          Open
                        </Label>

                        <div className="relative">
                          <Clock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400 z-10" />

                          <Input
                            type="time"
                            value={dayData.start}
                            onChange={(e) =>
                              updateDay(day, 'start', e.target.value)
                            }
                            className="h-11 pl-9 rounded-xl border-orange-100 bg-white/90 text-sm font-semibold text-slate-800 shadow-sm focus-visible:ring-orange-300 focus-visible:border-orange-300"
                          />
                        </div>
                      </div>

                      {/* Close */}
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          Close
                        </Label>

                        <div className="relative">
                          <Clock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400 z-10" />

                          <Input
                            type="time"
                            value={dayData.end}
                            onChange={(e) =>
                              updateDay(day, 'end', e.target.value)
                            }
                            className="h-11 pl-9 rounded-xl border-orange-100 bg-white/90 text-sm font-semibold text-slate-800 shadow-sm focus-visible:ring-orange-300 focus-visible:border-orange-300"
                          />
                        </div>
                      </div>

                      {/* Break Start */}
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          Break Start
                        </Label>

                        <div className="relative">
                          <Clock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-300 z-10" />

                          <Input
                            type="time"
                            value={dayData.breakStart}
                            onChange={(e) =>
                              updateDay(day, 'breakStart', e.target.value)
                            }
                            className="h-11 pl-9 rounded-xl border-orange-100 bg-white/90 text-sm font-semibold text-slate-800 shadow-sm focus-visible:ring-orange-300 focus-visible:border-orange-300"
                          />
                        </div>
                      </div>

                      {/* Break End */}
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          Break End
                        </Label>

                        <div className="relative">
                          <Clock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-300 z-10" />

                          <Input
                            type="time"
                            value={dayData.breakEnd}
                            onChange={(e) =>
                              updateDay(day, 'breakEnd', e.target.value)
                            }
                            className="h-11 pl-9 rounded-xl border-orange-100 bg-white/90 text-sm font-semibold text-slate-800 shadow-sm focus-visible:ring-orange-300 focus-visible:border-orange-300"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </CardContent>
      </Card>

      {/* Sticky Save Button */}
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50">
        <Button
          onClick={handleSave}
          disabled={saving || !barberId}
          size="lg"
          className="w-full sm:w-auto min-w-[190px] h-12 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white font-semibold shadow-[0_10px_30px_rgba(249,115,22,0.28)] border border-orange-400/30"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}

          {saving ? 'Saving...' : 'Save Schedule'}
        </Button>
      </div>
    </motion.div>
  );
}