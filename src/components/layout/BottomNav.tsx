import { NavLink, useLocation } from 'react-router-dom';
import { Home, Calendar, Search, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { title: 'Home', href: '/dashboard', icon: Home },
  { title: 'Search', href: '/discover', icon: Search },
  { title: 'Bookings', href: '/bookings', icon: Calendar },
  { title: 'Profile', href: '/profile', icon: User },
];

export function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pb-3 pt-2">
      <div className="bg-sidebar rounded-2xl flex items-center justify-around px-2 py-3 shadow-2xl border border-primary/30">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all duration-200',
                active ? 'text-gold bg-gold/10' : 'text-foreground/70 hover:text-foreground',
              )}
            >
              <Icon className={cn('w-7 h-7', active && 'drop-shadow-[0_0_6px_hsl(var(--gold))]')} />
              <span className="text-xs font-semibold">{item.title}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
