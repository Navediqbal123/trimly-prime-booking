import { NavLink, useLocation } from 'react-router-dom';
import { Home, Calendar, Search, User, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { title: 'Home', href: '/dashboard', icon: Home },
  { title: 'Search', href: '/discover', icon: Search },
  { title: 'Map', href: '/map', icon: MapPin },
  { title: 'Bookings', href: '/bookings', icon: Calendar },
  { title: 'Profile', href: '/profile', icon: User },
];

export function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav
      className="
        lg:hidden
        fixed
        left-0
        right-0
        bottom-0
        z-[900]
        w-full
        bg-white
        shadow-[0_-6px_20px_rgba(0,0,0,0.08)]
      "
    >
      <div className="flex w-full items-stretch px-1 py-1.5">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;

          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={cn(
                'relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-2.5 transition-all duration-200',
                active ? 'text-orange-500' : 'text-slate-400'
              )}
            >
              <div
                className={cn(
                  'flex h-[44px] w-[72px] flex-col items-center justify-center rounded-[20px] transition-all duration-200',
                  active &&
                    'bg-orange-50 shadow-[3px_4px_10px_rgba(249,115,22,0.10),-2px_-2px_7px_rgba(255,255,255,0.95)]'
                )}
              >
                <Icon
                  className={cn(
                    'h-6 w-6 shrink-0',
                    active &&
                      'stroke-[2.5] drop-shadow-[0_2px_6px_rgba(249,115,22,0.3)]'
                  )}
                />

                <span
                  className={cn(
                    'mt-1 text-[11px] font-semibold leading-none',
                    active ? 'text-orange-500' : 'text-slate-400'
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
}