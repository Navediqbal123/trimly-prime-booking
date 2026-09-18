import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  MapPin,
  Clock,
  ArrowLeft,
  Home,
  Loader2,
  AlertCircle,
  Scissors,
  Star,
  Check,
  ChevronRight,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

import {
  createBooking,
  getApprovedBarbers,
  getPendingBarbers,
  getBarberServices,
  checkSlotAvailability,
} from '@/lib/api';

const timeSlots = [
  '9:00 AM',
  '9:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '12:00 PM',
  '12:30 PM',
  '1:00 PM',
  '1:30 PM',
  '2:00 PM',
  '2:30 PM',
  '3:00 PM',
  '3:30 PM',
  '4:00 PM',
  '4:30 PM',
  '5:00 PM',
  '5:30 PM',
  '6:00 PM',
  '6:30 PM',
  '7:00 PM',
  '7:30 PM',
  '8:00 PM',
  '8:30 PM',
  '9:00 PM',
  '9:30 PM',
  '10:00 PM',
  '10:30 PM',
  '11:00 PM',
  '11:30 PM',
  '12:00 AM',
];

export default function BookingPage() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const preselectedServiceId = searchParams.get('service');

  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    undefined
  );
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [homeService, setHomeService] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: shop, isLoading: loadingShop } = useQuery({
    queryKey: ['barber', shopId],
    queryFn: async () => {
      const [approvedRes, pendingRes] = await Promise.all([
        getApprovedBarbers(),
        getPendingBarbers(),
      ]);

      const all = [
        ...(approvedRes.success && approvedRes.data
          ? approvedRes.data
          : []),
        ...(pendingRes.success && pendingRes.data
          ? pendingRes.data
          : []),
      ];

      return all.find((b) => b.id === shopId) || null;
    },
    enabled: !!shopId,
  });

  const { data: services = [], isLoading: loadingServices } = useQuery({
    queryKey: ['barberServices', shopId],
    queryFn: async () => {
      const res = await getBarberServices(shopId!);
      return res.success && res.data ? res.data : [];
    },
    enabled: !!shopId,
  });

  // Use local date so slot availability matches the selected calendar date.
  const toLocalDateKey = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${y}-${m}-${day}`;
  };

  const dateKey = selectedDate
    ? toLocalDateKey(selectedDate)
    : null;

  // Convert a displayed time slot into a local Date.
  const slotToDate = (day: Date, slot: string) => {
    const m = slot.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

    if (!m) return null;

    let hh = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);
    const ap = m[3].toUpperCase();

    if (ap === 'AM') {
      hh = hh === 12 ? 0 : hh;
    } else {
      hh = hh === 12 ? 12 : hh + 12;
    }

    const d = new Date(day);
    d.setHours(hh, mm, 0, 0);

    return d;
  };

  // Refresh past-slot state every 30 seconds.
  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      setNowTick(Date.now());
    }, 30000);

    return () => clearInterval(id);
  }, []);

  const isSlotPast = (slot: string) => {
    if (!selectedDate) return false;

    const d = slotToDate(selectedDate, slot);

    if (!d) return false;

    return d.getTime() <= nowTick;
  };

  const { data: bookedSlots = [], isLoading: loadingSlots } =
    useQuery({
      queryKey: ['bookedSlots', shopId, dateKey],
      queryFn: async () => {
        if (!shopId || !dateKey) return [];

        const results = await Promise.all(
          timeSlots.map(async (slot) => {
            const res = await checkSlotAvailability(
              shopId,
              dateKey,
              slot
            );

            const available = res.success
              ? res.data?.available !== false
              : true;

            return available ? null : slot;
          })
        );

        return results.filter(
          (s): s is string => !!s
        );
      },
      enabled: !!shopId && !!dateKey,
      staleTime: 0,
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
      refetchInterval: 15000,
      refetchIntervalInBackground: false,
    });

  const loadingData =
    loadingShop || loadingServices;

  const chosenServices = services.filter((s) =>
    selectedServices.includes(s.id)
  );

  const totalPrice = chosenServices.reduce(
    (sum, s) => sum + (Number(s.price) || 0),
    0
  );

  const totalDuration = chosenServices.reduce(
    (sum, s) => sum + (Number(s.duration) || 0),
    0
  );

  const anyHomeService = chosenServices.some(
    (s) => s.home_service
  );

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  };

  useEffect(() => {
    if (!anyHomeService && homeService) {
      setHomeService(false);
    }
  }, [anyHomeService, homeService]);

  useEffect(() => {
    if (
      preselectedServiceId &&
      selectedServices.length === 0 &&
      services.length > 0
    ) {
      const ids = preselectedServiceId
        .split(',')
        .filter((id) =>
          services.some((s) => s.id === id)
        );

      if (ids.length > 0) {
        setSelectedServices(ids);
      }
    }
  }, [
    preselectedServiceId,
    services,
    selectedServices.length,
  ]);

  useEffect(() => {
    if (
      selectedTime &&
      bookedSlots.includes(selectedTime)
    ) {
      setSelectedTime(null);
    }
  }, [bookedSlots, selectedTime]);

  const handleBook = async () => {
    if (
      selectedServices.length === 0 ||
      !selectedDate ||
      !selectedTime
    ) {
      toast.error(
        'Please select at least one service, a date and time'
      );
      return;
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (
      !shopId ||
      !uuidRegex.test(shopId) ||
      !selectedServices.every((id) =>
        uuidRegex.test(id)
      )
    ) {
      toast.error('Invalid IDs');
      return;
    }

    setLoading(true);

    const dateStr = toLocalDateKey(selectedDate);

    const slotCheck = await checkSlotAvailability(
      shopId,
      dateStr,
      selectedTime
    );

    if (!slotCheck.success) {
      toast.error(
        slotCheck.error ||
          'Failed to verify slot availability'
      );
      setLoading(false);
      return;
    }

    if (slotCheck.data?.available === false) {
      toast.error(
        'This slot is already booked, please select another time'
      );
      setLoading(false);
      return;
    }

    const response = await createBooking({
      barber_id: shopId,
      service_id: selectedServices[0],
      service_ids: selectedServices,
      date: dateStr,
      time_slot: selectedTime,
      home_service: homeService,
      total_amount: totalPrice,
    });

    if (response.success) {
      toast.success('Booking confirmed!');

      queryClient.invalidateQueries({
        queryKey: ['myBookings'],
      });

      queryClient.invalidateQueries({
        queryKey: ['barberBookings'],
      });

      queryClient.invalidateQueries({
        queryKey: ['bookedSlots'],
      });

      navigate('/bookings');
    } else {
      toast.error(
        response.error || 'Failed to create booking'
      );
    }

    setLoading(false);
  };

  if (loadingData) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-[#ff7417]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white px-4 pb-36 pt-4 text-slate-900 lg:px-8 lg:pb-10">
      <div className="mx-auto w-full max-w-2xl">
        {/* Back */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="h-10 rounded-full bg-white px-4 text-black shadow-[5px_6px_12px_rgba(0,0,0,0.09),-4px_-4px_9px_rgba(255,255,255,0.95)] hover:bg-white hover:text-black"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </motion.div>

        {/* Shop summary */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-[26px] border border-slate-100 bg-white p-4 shadow-[7px_8px_17px_rgba(0,0,0,0.10),-6px_-6px_15px_rgba(255,255,255,0.95)]"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-[#fff0e3] text-[#ff7417] shadow-[4px_5px_10px_rgba(255,116,23,0.16),inset_2px_2px_5px_rgba(255,255,255,0.9)]">
              <Scissors className="h-7 w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="break-words font-display text-[21px] font-bold leading-tight tracking-[-0.3px] text-black">{shop.shop_name}</h1>
              <div className="mt-1 flex min-w-0 items-center gap-1.5 text-xs font-medium text-slate-500">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-[#ff7417]" />
                <span className="min-w-0 truncate">{shop.location}</span>
              </div>
              <div className="mt-1.5 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className={cn('h-3.5 w-3.5', i <= 4 ? 'fill-[#ff8a3d] text-[#ff8a3d]' : 'text-slate-300')} />
                ))}
                <span className="ml-1 text-xs font-semibold text-slate-500">4.8</span>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Services */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="mb-7">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-[27px] font-bold leading-none tracking-[-0.7px] text-black">Choose Services</h2>
              <p className="mt-2 text-sm font-medium text-slate-500">Select one or more services</p>
            </div>
            <span className="shrink-0 rounded-full bg-[#fff0e3] px-3 py-1.5 text-[11px] font-bold text-[#ff7417] shadow-[3px_4px_8px_rgba(0,0,0,0.06)]">
              {selectedServices.length > 0 ? `${selectedServices.length} selected` : '0 selected'}
            </span>
          </div>

          {services.length === 0 ? (
            <div className="rounded-[25px] border border-slate-100 bg-white p-8 text-center shadow-[6px_7px_15px_rgba(0,0,0,0.08),-5px_-5px_13px_rgba(255,255,255,0.95)]">
              <Scissors className="mx-auto mb-3 h-9 w-9 text-orange-300" />
              <p className="text-sm font-medium text-slate-500">No services added yet by this barber.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {services.map((service) => {
                const active = selectedServices.includes(service.id);
                return (
                  <motion.button
                    key={service.id}
                    type="button"
                    onClick={() => toggleService(service.id)}
                    whileTap={{ scale: 0.99 }}
                    className={cn(
                      'relative flex w-full min-w-0 items-center gap-3 overflow-hidden rounded-[22px] border bg-white p-3.5 text-left shadow-[5px_6px_13px_rgba(0,0,0,0.08),-4px_-4px_10px_rgba(255,255,255,0.95)] transition-all duration-200',
                      active ? 'border-orange-200 bg-[#fff7f0] shadow-[6px_7px_15px_rgba(255,116,23,0.14),-4px_-4px_10px_rgba(255,255,255,0.95)]' : 'border-slate-100'
                    )}
                  >
                    <div className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] shadow-[3px_4px_8px_rgba(0,0,0,0.08),inset_1px_1px_3px_rgba(255,255,255,0.65)]',
                      active ? 'bg-[#ff7417] text-white' : 'bg-[#f4f6f9] text-slate-400'
                    )}>
                      {active ? <Check className="h-5 w-5" /> : <Scissors className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <p className="min-w-0 truncate text-[15px] font-bold text-black">{service.name}</p>
                        {service.home_service && <Home className="h-3.5 w-3.5 shrink-0 text-[#ff7417]" />}
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-slate-500">
                        <Clock className="h-3 w-3" /> {service.duration} min
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-[16px] font-black text-black">₹{service.price}</span>
                      <ChevronRight className="h-4 w-4 text-slate-300" />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </motion.section>

        {/* Date */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mb-7">
          <div className="mb-3">
            <h2 className="font-display text-[27px] font-bold leading-none tracking-[-0.7px] text-black">Select Date</h2>
            <p className="mt-2 text-sm font-medium text-slate-500">
              {selectedDate ? format(selectedDate, 'EEEE, MMM d, yyyy') : 'Choose your preferred date'}
            </p>
          </div>
          <div className="overflow-hidden rounded-[26px] border border-orange-100 bg-white p-3 shadow-[6px_7px_15px_rgba(0,0,0,0.08),-5px_-5px_13px_rgba(255,255,255,0.95)]">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => setSelectedDate(date ?? undefined)}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              initialFocus
              className="mx-auto p-1"
              classNames={{
                months: 'flex flex-col',
                month: 'space-y-3 w-full',
                caption: 'flex justify-center pt-1 pb-2 relative items-center',
                caption_label: 'text-base font-bold text-black',
                nav_button: 'h-9 w-9 bg-white hover:bg-orange-50 text-slate-700 border border-orange-100 rounded-[13px] p-0 transition-colors inline-flex items-center justify-center shadow-[3px_4px_8px_rgba(0,0,0,0.06)]',
                nav_button_previous: 'absolute left-1',
                nav_button_next: 'absolute right-1',
                head_cell: 'text-slate-400 rounded-md w-10 font-semibold text-[0.7rem] uppercase',
                row: 'flex w-full mt-1.5 justify-center',
                cell: 'h-10 w-10 text-center text-sm p-0 relative',
                day: 'h-10 w-10 p-0 font-medium rounded-[13px] text-slate-700 hover:bg-orange-50 hover:text-orange-600 transition-colors aria-selected:opacity-100 inline-flex items-center justify-center',
                day_selected: 'bg-[#ff7417] text-white hover:bg-[#ff7417] hover:text-white focus:bg-[#ff7417] focus:text-white font-bold shadow-[4px_5px_10px_rgba(194,65,12,0.25),inset_1px_1px_3px_rgba(255,255,255,0.25)]',
                day_today: 'border border-orange-300 text-orange-600 font-bold',
                day_outside: 'text-slate-300',
                day_disabled: 'text-slate-300 opacity-50',
              }}
            />
          </div>
        </motion.section>

        {/* Time */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="mb-7">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-[27px] font-bold leading-none tracking-[-0.7px] text-black">Select Time</h2>
              <p className="mt-2 text-sm font-medium text-slate-500">Pick an available time slot</p>
            </div>
            {loadingSlots && dateKey && <Loader2 className="h-4 w-4 animate-spin text-[#ff7417]" />}
          </div>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
            {timeSlots.map((time) => {
              const active = selectedTime === time;
              const past = isSlotPast(time);
              const booked = bookedSlots.includes(time) || past;
              return (
                <button
                  key={time}
                  type="button"
                  onClick={() => !booked && setSelectedTime(time)}
                  disabled={booked}
                  title={booked ? (past ? 'Time already passed' : 'Already booked') : undefined}
                  className={cn(
                    'rounded-[17px] border px-2 py-3 text-[12px] font-bold transition-all duration-200 shadow-[4px_5px_10px_rgba(0,0,0,0.06),-3px_-3px_8px_rgba(255,255,255,0.95)]',
                    booked
                      ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 line-through shadow-none'
                      : active
                        ? 'border-[#ff7417] bg-[#ff7417] text-white shadow-[5px_6px_12px_rgba(194,65,12,0.25),inset_1px_1px_3px_rgba(255,255,255,0.25),inset_-2px_-2px_4px_rgba(154,52,18,0.20)]'
                        : 'border-orange-100 bg-white text-slate-700 hover:border-orange-200 hover:bg-[#fff5ed] hover:text-[#ff7417]'
                  )}
                >
                  {time}
                </button>
              );
            })}
          </div>
          {dateKey && loadingSlots && <p className="mt-2 text-xs font-medium text-slate-400">Checking availability...</p>}

          {/* Home Service */}
          {anyHomeService && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 flex items-center justify-between gap-4 rounded-[24px] border border-orange-100 bg-[#fff2e4] p-4 shadow-[6px_7px_14px_rgba(255,116,23,0.13),inset_2px_2px_5px_rgba(255,255,255,0.85),inset_-3px_-3px_6px_rgba(214,93,0,0.08)]"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-[#ffb27f] text-[#e85d00] shadow-[3px_4px_8px_rgba(214,93,0,0.18),inset_1px_1px_3px_rgba(255,255,255,0.5)]">
                  <Home className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-black">Home Service</p>
                  <p className="mt-0.5 text-[11px] font-medium text-slate-500">Barber comes to your location</p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => setHomeService(!homeService)}
                className={cn(
                  'shrink-0 rounded-full font-bold shadow-[4px_5px_10px_rgba(0,0,0,0.08)]',
                  homeService ? 'bg-[#ff7417] text-white hover:bg-[#ff7417]' : 'border-0 bg-white text-black hover:bg-white'
                )}
              >
                {homeService ? <><Check className="mr-1 h-3.5 w-3.5" />Selected</> : 'Select'}
              </Button>
            </motion.div>
          )}
        </motion.section>

        {/* Summary */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="mb-5">
          <div className="mb-3">
            <h2 className="font-display text-[27px] font-bold leading-none tracking-[-0.7px] text-black">Booking Summary</h2>
            <p className="mt-2 text-sm font-medium text-slate-500">Review your booking before confirming</p>
          </div>

          <div className="overflow-hidden rounded-[27px] border border-slate-100 bg-white p-4 shadow-[7px_8px_17px_rgba(0,0,0,0.10),-6px_-6px_15px_rgba(255,255,255,0.95)]">
            <div className="space-y-4">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Selected Services</span>
                  {chosenServices.length > 0 && (
                    <span className="rounded-full bg-[#fff0e3] px-2.5 py-1 text-[11px] font-bold text-[#ff7417]">
                      {chosenServices.length} {chosenServices.length === 1 ? 'service' : 'services'}
                    </span>
                  )}
                </div>
                {chosenServices.length === 0 ? (
                  <div className="rounded-[18px] bg-slate-50 p-3 text-sm font-medium text-slate-400">No services selected yet</div>
                ) : (
                  <div className="space-y-2">
                    {chosenServices.map((s) => (
                      <div key={s.id} className="flex items-center justify-between gap-3 rounded-[18px] border border-orange-100 bg-[#fff8f2] px-3 py-3 shadow-[3px_4px_8px_rgba(0,0,0,0.05)]">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-black">{s.name}</p>
                          <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-slate-500"><Clock className="h-3 w-3" />{s.duration} min</p>
                        </div>
                        <span className="shrink-0 text-sm font-black text-black">₹{s.price}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-orange-100 pt-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-3"><span className="font-medium text-slate-500">Date</span><span className="font-bold text-black">{selectedDate ? format(selectedDate, 'EEE, MMM d') : '—'}</span></div>
                  <div className="flex items-center justify-between gap-3"><span className="font-medium text-slate-500">Time</span><span className="font-bold text-black">{selectedTime || '—'}</span></div>
                  <div className="flex items-center justify-between gap-3"><span className="font-medium text-slate-500">Total Duration</span><span className="font-bold text-black">{totalDuration > 0 ? `${totalDuration} min` : '—'}</span></div>
                  {homeService && (
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-slate-500">Service Type</span>
                      <span className="flex items-center gap-1 font-bold text-[#ff7417]"><Home className="h-3.5 w-3.5" />Home Service</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-end justify-between gap-4 border-t border-orange-100 pt-4">
                <div>
                  <p className="text-sm font-bold text-slate-500">Grand Total</p>
                  {chosenServices.length > 1 && <p className="mt-0.5 text-[11px] font-medium text-slate-400">{chosenServices.length} services selected</p>}
                </div>
                <span className="text-[30px] font-black tracking-tight text-[#ef4444]">₹{totalPrice}</span>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Confirm */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Button
            onClick={handleBook}
            disabled={loading || selectedServices.length === 0 || !selectedDate || !selectedTime}
            className="h-12 w-full rounded-full border-0 bg-[#ff7417] text-sm font-bold text-white shadow-[6px_7px_14px_rgba(194,65,12,0.28),inset_2px_2px_5px_rgba(255,255,255,0.30),inset_-3px_-3px_6px_rgba(154,52,18,0.25)] transition-all duration-200 hover:bg-[#ff7417] active:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Booking...</>
            ) : (
              <><Check className="mr-2 h-5 w-5" />Confirm Booking</>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
