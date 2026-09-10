import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  CalendarDays,
  LayoutGrid,
  Wallet,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { title: 'Home', href: '/barber-hub', icon: Home },
  { title: 'Bookings', href: '/barber-hub/bookings', icon: CalendarDays },
  { title: 'Services', href: '/barber-hub/services', icon: LayoutGrid },
  { title: 'Earnings', href: '/barber-hub/earnings', icon: Wallet },
  { title: 'Profile', href: '/profile', icon: User },
];

export function BarberBottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-3 pb-3 pt-2">
      <div
        className="
          relative overflow-hidden
          rounded-[24px]
          border border-orange-200/70
          bg-white/85
          backdrop-blur-2xl
          shadow-[0_12px_40px_rgba(249,115,22,0.14)]
        "
      >
        <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 w-52 h-20 rounded-full bg-orange-200/20 blur-3xl" />

        <div className="relative flex items-center justify-around px-2 py-2">
          {items.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;

            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={cn(
                  'relative flex min-w-[58px] flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 transition-all duration-300',
                  active
                    ? 'bg-orange-50 text-orange-500 shadow-[0_5px_18px_rgba(249,115,22,0.10)]'
                    : 'text-slate-400 hover:text-slate-600'
                )}
              >
                <Icon
                  className={cn(
                    'w-[21px] h-[21px] transition-all duration-300',
                    active &&
                      'stroke-[2.5] drop-shadow-[0_2px_6px_rgba(249,115,22,0.30)]'
                  )}
                />

                <span
                  className={cn(
                    'text-[11px] font-semibold leading-none',
                    active ? 'text-orange-500' : 'text-slate-400'
                  )}
                >
                  {item.title}
                </span>

                {active && (
                  <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-orange-500" />
                )}
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}