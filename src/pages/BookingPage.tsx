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
      <div className="min-h-screen bg-[#fffdf9] flex flex-col items-center justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 border border-orange-100 shadow-sm">
          <Loader2 className="h-7 w-7 animate-spin text-orange-500" />
        </div>

        <p className="mt-4 text-sm font-medium text-slate-600">
          Loading booking details...
        </p>
      </div>
    );
  }

  if (!shopId || !shop) {
    return (
      <div className="min-h-screen bg-[#fffdf9] p-4">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 text-slate-700 hover:bg-orange-50"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="mx-auto flex max-w-md flex-col items-center justify-center rounded-3xl border border-orange-100 bg-white/80 px-6 py-16 text-center shadow-sm backdrop-blur-xl">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50">
            <AlertCircle className="h-8 w-8 text-orange-400" />
          </div>

          <h3 className="text-xl font-bold text-slate-900">
            Barber Not Found
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            We couldn't find this barber shop.
          </p>

          <Button
            onClick={() => navigate('/discover')}
            className="mt-6 rounded-xl bg-orange-500 px-6 text-white shadow-lg shadow-orange-200 hover:bg-orange-600"
          >
            Discover Barbers
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#fffdf9] text-slate-900 px-4 pb-36 pt-5 lg:px-8 lg:pb-10">
      {/* Page ambient lighting */}
      <div className="pointer-events-none fixed -left-24 top-10 h-72 w-72 rounded-full bg-orange-200/20 blur-3xl" />
      <div className="pointer-events-none fixed -right-24 top-72 h-80 w-80 rounded-full bg-orange-100/30 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-2xl">
        {/* Back */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="-ml-2 mb-4 rounded-xl text-slate-700 hover:bg-orange-50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </motion.div>

        {/* Barber Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="
            relative
            mb-6
            overflow-hidden
            rounded-3xl
            border
            border-orange-100/80
            bg-white/70
            p-5
            shadow-[0_12px_35px_rgba(251,146,60,0.10)]
            backdrop-blur-xl
          "
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-orange-200/20 blur-3xl" />

          <div className="relative flex items-center gap-4">
            {/* Barber icon */}
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-orange-100 bg-orange-50 shadow-sm">
              <Scissors className="h-7 w-7 text-orange-500" />
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-xl font-bold tracking-tight text-slate-900">
                {shop.shop_name}
              </h1>

              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-orange-500" />
                <span className="truncate">
                  {shop.location}
                </span>
              </div>

              <div className="mt-2 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={cn(
                      'h-3.5 w-3.5',
                      i <= 4
                        ? 'fill-orange-400 text-orange-400'
                        : 'text-slate-200'
                    )}
                  />
                ))}

                <span className="ml-1.5 text-xs font-medium text-slate-500">
                  4.8
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Services */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.4 }}
          className="mb-7"
        >
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Choose Services
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                Select one or more services
              </p>
            </div>

            <span className="rounded-full bg-orange-50 px-3 py-1 text-[11px] font-medium text-orange-600">
              {selectedServices.length > 0
                ? `${selectedServices.length} selected`
                : '0 selected'}
            </span>
          </div>

          {services.length === 0 ? (
            <div className="rounded-2xl border border-orange-100 bg-white/70 p-8 text-center shadow-sm backdrop-blur-xl">
              <Scissors className="mx-auto mb-3 h-9 w-9 text-orange-300" />

              <p className="text-sm text-slate-500">
                No services added yet by this barber.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {services.map((service) => {
                const active = selectedServices.includes(
                  service.id
                );

                return (
                  <motion.button
                    key={service.id}
                    type="button"
                    onClick={() =>
                      toggleService(service.id)
                    }
                    whileTap={{ scale: 0.99 }}
                    className={cn(
                      `
                      relative
                      w-full
                      overflow-hidden
                      rounded-2xl
                      border
                      p-4
                      text-left
                      transition-all
                      duration-200
                      `,
                      active
                        ? `
                          border-orange-300
                          bg-orange-50/70
                          shadow-[0_8px_25px_rgba(251,146,60,0.14)]
                        `
                        : `
                          border-orange-100/80
                          bg-white/70
                          shadow-sm
                          backdrop-blur-xl
                          hover:border-orange-200
                          hover:bg-white/85
                        `
                    )}
                  >
                    {active && (
                      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-orange-200/20 blur-2xl" />
                    )}

                    <div className="relative flex items-center gap-3">
                      {/* Checkbox */}
                      <div
                        className={cn(
                          `
                          flex
                          h-7
                          w-7
                          shrink-0
                          items-center
                          justify-center
                          rounded-lg
                          border
                          transition-all
                          `,
                          active
                            ? 'border-orange-500 bg-orange-500 text-white'
                            : 'border-slate-300 bg-white text-transparent'
                        )}
                      >
                        <Check className="h-4 w-4" />
                      </div>

                      {/* Service information */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {service.name}
                          </p>

                          {service.home_service && (
                            <Home className="h-3.5 w-3.5 shrink-0 text-orange-500" />
                          )}
                        </div>

                        <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                          <Clock className="h-3 w-3" />
                          {service.duration} min
                        </div>
                      </div>

                      {/* Price */}
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-base font-bold text-slate-900">
                          ₹{service.price}
                        </span>

                        <ChevronRight className="h-4 w-4 text-slate-300" />
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </motion.section>

        {/* Date */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mb-7"
        >
          <div className="mb-3">
            <h2 className="text-lg font-bold text-slate-900">
              Select Date
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              {selectedDate
                ? format(
                    selectedDate,
                    'EEEE, MMM d, yyyy'
                  )
                : 'Choose your preferred date'}
            </p>
          </div>

          <div
            className="
              overflow-hidden
              rounded-3xl
              border
              border-orange-100/80
              bg-white/70
              p-3
              shadow-sm
              backdrop-blur-xl
            "
          >
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) =>
                setSelectedDate(date ?? undefined)
              }
              disabled={(date) =>
                date <
                new Date(
                  new Date().setHours(0, 0, 0, 0)
                )
              }
              initialFocus
              className="mx-auto p-1"
              classNames={{
                months: 'flex flex-col',
                month: 'space-y-3 w-full',
                caption:
                  'flex justify-center pt-1 pb-2 relative items-center',
                caption_label:
                  'text-sm font-semibold text-slate-900',
                nav_button:
                  'h-8 w-8 bg-white hover:bg-orange-50 text-slate-700 border border-orange-100 rounded-xl p-0 transition-colors inline-flex items-center justify-center',
                nav_button_previous:
                  'absolute left-1',
                nav_button_next:
                  'absolute right-1',
                head_cell:
                  'text-slate-400 rounded-md w-10 font-medium text-[0.7rem] uppercase tracking-wider',
                row: 'flex w-full mt-1.5 justify-center',
                cell:
                  'h-10 w-10 text-center text-sm p-0 relative',
                day:
                  'h-10 w-10 p-0 font-normal rounded-xl text-slate-700 hover:bg-orange-50 hover:text-orange-600 transition-colors aria-selected:opacity-100 inline-flex items-center justify-center',
                day_selected:
                  'bg-orange-500 text-white hover:bg-orange-600 hover:text-white focus:bg-orange-500 focus:text-white font-semibold shadow-[0_6px_18px_rgba(251,146,60,0.35)]',
                day_today:
                  'border border-orange-300 text-orange-600 font-semibold',
                day_outside:
                  'text-slate-300',
                day_disabled:
                  'text-slate-300 opacity-50',
              }}
            />
          </div>
        </motion.section>

        {/* Time */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="mb-7"
        >
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Select Time
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                Pick an available time slot
              </p>
            </div>

            {loadingSlots && dateKey && (
              <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {timeSlots.map((time) => {
              const active = selectedTime === time;
              const past = isSlotPast(time);
              const booked =
                bookedSlots.includes(time) || past;

              return (
                <button
                  key={time}
                  onClick={() =>
                    !booked && setSelectedTime(time)
                  }
                  disabled={booked}
                  title={
                    booked
                      ? past
                        ? 'Time already passed'
                        : 'Already booked'
                      : undefined
                  }
                  className={cn(
                    `
                    rounded-xl
                    border
                    px-2
                    py-3
                    text-[12px]
                    font-medium
                    transition-all
                    duration-200
                    `,
                    booked
                      ? `
                        cursor-not-allowed
                        border-slate-200
                        bg-slate-100
                        text-slate-400
                        line-through
                      `
                      : active
                        ? `
                          border-orange-500
                          bg-orange-500
                          text-white
                          shadow-[0_6px_18px_rgba(251,146,60,0.30)]
                        `
                        : `
                          border-orange-100
                          bg-white/70
                          text-slate-700
                          shadow-sm
                          hover:border-orange-300
                          hover:bg-orange-50
                          hover:text-orange-600
                        `
                  )}
                >
                  {time}
                </button>
              );
            })}
          </div>

          {dateKey && loadingSlots && (
            <p className="mt-2 text-xs text-slate-400">
              Checking availability...
            </p>
          )}

          {/* Home Service */}
          {anyHomeService && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="
                mt-5
                flex
                items-center
                justify-between
                gap-4
                rounded-2xl
                border
                border-orange-100
                bg-white/70
                p-4
                shadow-sm
                backdrop-blur-xl
              "
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
                  <Home className="h-5 w-5 text-orange-500" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Home Service
                  </p>

                  <p className="text-[11px] text-slate-500">
                    Barber comes to your location
                  </p>
                </div>
              </div>

              <Button
                size="sm"
                onClick={() =>
                  setHomeService(!homeService)
                }
                className={cn(
                  'rounded-xl font-medium',
                  homeService
                    ? 'bg-orange-500 text-white hover:bg-orange-600'
                    : 'border border-orange-100 bg-white text-slate-700 hover:bg-orange-50'
                )}
              >
                {homeService ? (
                  <>
                    <Check className="mr-1 h-3.5 w-3.5" />
                    Selected
                  </>
                ) : (
                  'Select'
                )}
              </Button>
            </motion.div>
          )}
        </motion.section>

        {/* Summary */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="mb-6"
        >
          <div className="mb-3">
            <h2 className="text-lg font-bold text-slate-900">
              Booking Summary
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              Review your booking before confirming
            </p>
          </div>

          <div
            className="
              relative
              overflow-hidden
              rounded-3xl
              border
              border-orange-100/80
              bg-white/75
              p-5
              shadow-[0_12px_35px_rgba(251,146,60,0.10)]
              backdrop-blur-xl
            "
          >
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-orange-200/20 blur-3xl" />

            <div className="relative space-y-4">
              {/* Selected Services */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Selected Services
                  </span>

                  {chosenServices.length > 0 && (
                    <span className="text-xs font-medium text-orange-500">
                      {chosenServices.length}{' '}
                      {chosenServices.length === 1
                        ? 'service'
                        : 'services'}
                    </span>
                  )}
                </div>

                {chosenServices.length === 0 ? (
                  <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-400">
                    No services selected yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {chosenServices.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between gap-3 rounded-xl bg-orange-50/50 px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {s.name}
                          </p>

                          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
                            <Clock className="h-3 w-3" />
                            {s.duration} min
                          </p>
                        </div>

                        <span className="shrink-0 text-sm font-semibold text-slate-900">
                          ₹{s.price}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Booking Details */}
              <div className="border-t border-orange-100 pt-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500">
                      Date
                    </span>

                    <span className="font-medium text-slate-900">
                      {selectedDate
                        ? format(
                            selectedDate,
                            'EEE, MMM d'
                          )
                        : '—'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500">
                      Time
                    </span>

                    <span className="font-medium text-slate-900">
                      {selectedTime || '—'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500">
                      Total Duration
                    </span>

                    <span className="font-medium text-slate-900">
                      {totalDuration > 0
                        ? `${totalDuration} min`
                        : '—'}
                    </span>
                  </div>

                  {homeService && (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-500">
                        Service Type
                      </span>

                      <span className="flex items-center gap-1 font-medium text-orange-500">
                        <Home className="h-3.5 w-3.5" />
                        Home Service
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Total */}
              <div className="flex items-end justify-between gap-4 border-t border-orange-100 pt-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Grand Total
                  </p>

                  {chosenServices.length > 1 && (
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {chosenServices.length} services selected
                    </p>
                  )}
                </div>

                <span className="text-3xl font-bold tracking-tight text-orange-500">
                  ₹{totalPrice}
                </span>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Confirm Booking */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
        >
          <Button
            onClick={handleBook}
            disabled={
              loading ||
              selectedServices.length === 0 ||
              !selectedDate ||
              !selectedTime
            }
            className="
              h-14
              w-full
              rounded-2xl
              bg-orange-500
              text-base
              font-semibold
              text-white
              shadow-[0_12px_30px_rgba(251,146,60,0.28)]
              transition-all
              duration-200
              hover:bg-orange-600
              hover:shadow-[0_14px_35px_rgba(251,146,60,0.35)]
              disabled:cursor-not-allowed
              disabled:opacity-40
            "
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Booking...
              </>
            ) : (
              <>
                <Check className="mr-2 h-5 w-5" />
                Confirm Booking
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}