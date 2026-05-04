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
      <div className="glass-panel rounded-2xl flex items-center justify-around px-2 py-2 shadow-2xl border border-primary/20">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 px-4 py-1.5 rounded-xl transition-all duration-200',
                active ? 'text-gold' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className={cn('w-5 h-5', active && 'drop-shadow-[0_0_6px_hsl(var(--gold))]')} />
              <span className="text-[10px] font-medium">{item.title}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
