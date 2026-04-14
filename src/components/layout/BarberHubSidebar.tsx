import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Store,
  Settings,
  Calendar,
  User,
  Scissors,
  ChevronRight,
  ChevronLeft,
  LogOut,
  Clock,
  Users,
  IndianRupee,
  Star,
} from 'lucide-react';
import { useProtectedUser } from '@/contexts/ProtectedUserContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const barberNavItems = [
  { title: 'Dashboard', href: '/barber-hub', icon: LayoutDashboard },
  { title: 'My Services & Pricing', href: '/barber-hub/services', icon: Settings },
  { title: 'My Appointments', href: '/barber-hub/bookings', icon: Calendar },
  { title: 'My Schedule', href: '/barber-hub/schedule', icon: Clock },
  { title: 'My Clients', href: '/barber-hub/clients', icon: Users },
  { title: 'My Earnings', href: '/barber-hub/earnings', icon: IndianRupee },
  { title: 'My Reviews', href: '/barber-hub/reviews', icon: Star },
  { title: 'My Shop', href: '/barber-hub/shop', icon: Store },
];

interface BarberHubSidebarProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BarberHubSidebar({ isOpen, onOpenChange }: BarberHubSidebarProps) {
  const { user, signOut } = useProtectedUser();
  const location = useLocation();

  return (
    <>
      {/* Desktop sidebar - always visible */}
      <aside className="hidden lg:flex h-screen w-64 bg-card border-r border-border flex-col sticky top-0">
        <SidebarContent user={user} signOut={signOut} location={location} onNavigate={() => {}} />
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => onOpenChange(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-0 left-0 h-screen w-64 bg-card border-r border-border z-50 flex flex-col lg:hidden"
          >
            <SidebarContent user={user} signOut={signOut} location={location} onNavigate={() => onOpenChange(false)} />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

function SidebarContent({ user, signOut, location, onNavigate }: {
  user: any;
  signOut: () => void;
  location: { pathname: string };
  onNavigate: () => void;
}) {
  return (
    <>
      {/* Header */}
      <div className="p-6 border-b border-border">
        <Link to="/barber-hub" className="flex items-center gap-3" onClick={onNavigate}>
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Scissors className="w-6 h-6 text-primary" />
          </div>
          <span className="text-2xl font-display font-bold gradient-text">Barber Hub</span>
        </Link>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{user?.full_name || 'Barber'}</p>
            <p className="text-xs text-muted-foreground">Approved Barber</p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {barberNavItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                'hover:bg-secondary/80 group',
                isActive && 'bg-primary/10 text-primary'
              )}
            >
              <item.icon className={cn(
                'w-5 h-5 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
              )} />
              <span className={cn(
                'font-medium text-sm transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
              )}>
                {item.title}
              </span>
              {isActive && <ChevronRight className="w-4 h-4 ml-auto text-primary" />}
            </Link>
          );
        })}

        <div className="my-4 border-t border-border" />
        <Link
          to="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="font-medium">Back to Main App</span>
        </Link>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={signOut}
        >
          <LogOut className="w-5 h-5" />
          <span>Log Out</span>
        </Button>
      </div>
    </>
  );
}
