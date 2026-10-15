import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Store,
  Settings,
  Calendar,
  Scissors,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  LogOut,
  Clock,
  Users,
  IndianRupee,
  Star,
  Mail,
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
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-border bg-card lg:flex">
        <SidebarContent
          user={user}
          signOut={signOut}
          location={location}
          onNavigate={() => {}}
        />
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
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
            className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-border bg-card lg:hidden"
          >
            <SidebarContent
              user={user}
              signOut={signOut}
              location={location}
              onNavigate={() => onOpenChange(false)}
            />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

function SidebarContent({
  user,
  signOut,
  location,
  onNavigate,
}: {
  user: any;
  signOut: () => void;
  location: { pathname: string };
  onNavigate: () => void;
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const userInitials = (user?.full_name || 'B')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="border-b border-border p-6"
      >
        <Link
          to="/barber-hub"
          className="flex items-center gap-3"
          onClick={onNavigate}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ff7417]">
            <Scissors className="h-5 w-5 text-white" />
          </div>
          <span className="font-display text-2xl font-bold tracking-tight">
            <span className="text-foreground">Barber </span>
            <span className="text-[#ff7417]">Hub</span>
          </span>
        </Link>
      </motion.div>

      {/* Nav items */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {barberNavItems.map((item, i) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;

          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.3 }}
            >
              <Link
                to={item.href}
                onClick={onNavigate}
                className={cn(
                  'group flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-200',
                  'hover:bg-secondary/80',
                  isActive && 'bg-primary/10 text-primary',
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 transition-colors',
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground group-hover:text-foreground',
                  )}
                />
                <span
                  className={cn(
                    'text-sm font-medium transition-colors',
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground group-hover:text-foreground',
                  )}
                >
                  {item.title}
                </span>
                {isActive && (
                  <ChevronRight className="ml-auto h-4 w-4 text-primary" />
                )}
              </Link>
            </motion.div>
          );
        })}

        <div className="my-4 border-t border-border" />
        <Link
          to="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg px-4 py-3 text-muted-foreground transition-all hover:bg-secondary/80 hover:text-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="font-medium">Back to Main App</span>
        </Link>
      </nav>

      {/* User Profile Section - Bottom */}
      <div className="border-t border-border">
        <button
          onClick={() => setProfileOpen(!profileOpen)}
          className="flex w-full items-center gap-3 p-4 transition-colors duration-200 hover:bg-secondary/50"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20">
            <span className="text-sm font-bold text-primary">{userInitials}</span>
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-sm font-medium">
              {user?.full_name || 'Barber'}
            </p>
            <p className="text-xs text-muted-foreground">Approved Barber</p>
          </div>
          <motion.div
            animate={{ rotate: profileOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </motion.div>
        </button>

        <AnimatePresence>
          {profileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="space-y-2 px-4 pb-4">
                <div className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2">
                  <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-xs text-muted-foreground">
                    {user?.email || ''}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  onClick={signOut}
                >
                  <LogOut className="h-4 w-4" />
                  <span className="text-sm">Log Out</span>
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
