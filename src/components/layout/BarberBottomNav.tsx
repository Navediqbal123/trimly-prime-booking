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
    <nav className="lg:hidden fixed inset-x-0 bottom-0 z-[100] px-2 pb-2 pt-1 pointer-events-none">
      <div
        className="
          pointer-events-auto
          mx-auto w-full max-w-lg
          overflow-hidden
          rounded-[22px]
          border border-orange-200/70
          bg-white/90
          backdrop-blur-2xl
          shadow-[0_-4px_30px_rgba(249,115,22,0.12)]
        "
      >
        <div className="relative flex w-full items-stretch px-1 py-1.5">
          {items.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;

            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={cn(
                  'relative flex flex-1 min-w-0 flex-col items-center justify-center gap-1 rounded-[17px] px-1 py-2 transition-all duration-300',
                  active
                    ? 'bg-orange-50 text-orange-500'
                    : 'text-slate-400 hover:text-slate-600'
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 shrink-0 transition-all duration-300',
                    active &&
                      'stroke-[2.5] drop-shadow-[0_2px_6px_rgba(249,115,22,0.30)]'
                  )}
                />

                <span
                  className={cn(
                    'truncate text-[10px] font-semibold leading-none',
                    active ? 'text-orange-500' : 'text-slate-400'
                  )}
                >
                  {item.title}
                </span>

                {active && (
                  <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-orange-500" />
                )}
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}