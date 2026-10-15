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
  { title: 'Appointments', href: '/barber-hub/bookings', icon: CalendarDays },
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
        z-[900]
        w-full
        bg-background border-t border-border
        shadow-[0_-6px_20px_rgba(0,0,0,0.08)]
        pb-[env(safe-area-inset-bottom)]
      "
    >
      <div className="flex w-full items-stretch px-1 py-1">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;

          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={cn(
                'relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-2.5 transition-colors duration-200',
                active ? 'text-orange-500' : 'text-muted-foreground'
              )}
            >
              <div
                className={cn(
                  'flex h-[44px] w-[72px] flex-col items-center justify-center rounded-[20px] transition-colors duration-200',
                  active && 'bg-orange-50 dark:bg-muted/60'
                )}
              >
                <Icon
                  className={cn(
                    'h-6 w-6 shrink-0',
                    active && 'stroke-[2.5]'
                  )}
                />

                <span
                  className={cn(
                    'mt-1 text-[11px] font-semibold leading-none',
                    active ? 'text-orange-500' : 'text-muted-foreground'
                  )}
                >
                  {item.title}
                </span>
              </div>

              {active && (
                <span className="absolute bottom-0.5 h-1.5 w-1.5 rounded-full bg-orange-500" />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );

  return createPortal(navigation, document.body);
}
