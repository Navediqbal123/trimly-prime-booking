import { NavLink, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
  Home,
  CalendarDays,
  LayoutGrid,
  Wallet,
  Store,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { title: 'Home', href: '/barber-hub', icon: Home },
  { title: 'Appointments', href: '/barber-hub/Appointments', icon: CalendarDays },
  { title: 'Services', href: '/barber-hub/services', icon: LayoutGrid },
  { title: 'Earnings', href: '/barber-hub/earnings', icon: Wallet },
 { title: 'My Shop', href: '/barber-hub/shop', icon: Store },
];

export function BarberBottomNav() {
  const { pathname } = useLocation();

  const navigation = (
    <nav
      className="
        lg:hidden
        fixed
        left-0
        right-0
        bottom-0
        z-[9999]
        w-full
        px-2
        pb-[calc(8px+env(safe-area-inset-bottom))]
        pt-2
      "
    >
      <div
        className="
          w-full
          rounded-[22px]
          border border-orange-200/70
          bg-white/95
          backdrop-blur-2xl
          shadow-[0_-6px_30px_rgba(249,115,22,0.15)]
        "
      >
        <div className="flex w-full items-stretch px-1.5 py-1.5">
          {items.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;

            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={cn(
                  'relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[17px] px-1 py-2.5 transition-all duration-200',
                  active
                    ? 'bg-orange-50 text-orange-500'
                    : 'text-slate-400'
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 shrink-0',
                    active &&
                      'stroke-[2.5] drop-shadow-[0_2px_6px_rgba(249,115,22,0.3)]'
                  )}
                />

                <span
                  className={cn(
                    'w-full truncate text-center text-[10px] font-semibold leading-none',
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

  return createPortal(navigation, document.body);
}