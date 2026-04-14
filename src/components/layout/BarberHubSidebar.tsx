import { useState } from 'react';
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
            transition={{ duration: 0.2 }}
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
  const [profileOpen, setProfileOpen] = useState(false);
  const userInitials = (user?.full_name || 'B').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="p-6 border-b border-border"
      >
        <Link to="/barber-hub" className="flex items-center gap-3" onClick={onNavigate}>
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Scissors className="w-6 h-6 text-primary" />
          </div>
          <span className="text-2xl font-display font-bold gradient-text">Barber Hub</span>
        </Link>
      </motion.div>

      {/* Nav items */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {barberNavItems.map((item, i) => {
          const isActive = location.pathname === item.href;
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
            </motion.div>
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

      {/* User Profile Section - Bottom */}
      <div className="border-t border-border">
        <button
          onClick={() => setProfileOpen(!profileOpen)}
          className="w-full p-4 flex items-center gap-3 hover:bg-secondary/50 transition-colors duration-200"
        >
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-primary">{userInitials}</span>
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="font-medium text-sm truncate">{user?.full_name || 'Barber'}</p>
            <p className="text-xs text-muted-foreground">Approved Barber</p>
          </div>
          <motion.div
            animate={{ rotate: profileOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
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
              <div className="px-4 pb-4 space-y-2">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50">
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground truncate">{user?.email || ''}</span>
                </div>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={signOut}
                >
                  <LogOut className="w-4 h-4" />
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
