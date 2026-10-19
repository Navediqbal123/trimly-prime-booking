import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Store,
  Settings,
  Calendar,
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

export function BarberHubSidebar({
  isOpen,
  onOpenChange,
}: BarberHubSidebarProps) {
  const { user, signOut } = useProtectedUser();
  const location = useLocation();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-border bg-background lg:flex">
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
            className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-border bg-background lg:hidden"
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
        className="border-b border-border px-5 py-5"
      >
        <Link
          to="/barber-hub"
          className="flex items-center gap-3"
          onClick={onNavigate}
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#ff7417]/10 p-1">
            <img
              src="/trimly-logo.png"
              alt="Trimly logo"
              className="h-full w-full object-contain"
            />
          </div>

          <span className="font-display text-2xl font-extrabold tracking-tight leading-none text-foreground">
            <span>Barber </span>
            <span className="text-[#ff7417]">Hub</span>
          </span>
        </Link>
      </motion.div>

      {/* Navigation items */}
      <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-5">
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
                  'group flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition-all duration-200',
                  isActive
                    ? 'border-[#ff7417] bg-gradient-to-b from-[#ff963f] to-[#ff7417] text-white shadow-[inset_0_2px_3px_rgba(255,255,255,0.28),0_5px_12px_rgba(255,116,23,0.22)]'
                    : 'border-transparent bg-[#ff7417]/[0.045] text-muted-foreground hover:border-[#ff7417]/20 hover:bg-[#ff7417]/[0.10] hover:text-foreground',
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 shrink-0 transition-colors duration-200',
                    isActive
                      ? 'text-white'
                      : 'text-muted-foreground group-hover:text-[#ff7417]',
                  )}
                />

                <span
                  className={cn(
                    'text-sm font-medium transition-colors duration-200',
                    isActive
                      ? 'text-white'
                      : 'text-muted-foreground group-hover:text-foreground',
                  )}
                >
                  {item.title}
                </span>

                {isActive && (
                  <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-white" />
                )}
              </Link>
            </motion.div>
          );
        })}

        {/* Divider */}
        <div className="my-4 border-t border-border" />

        {/* Back to Main App */}
        <Link
          to="/dashboard"
          onClick={onNavigate}
          className="group flex items-center gap-3 rounded-2xl border border-transparent bg-[#ff7417]/[0.045] px-4 py-3.5 text-muted-foreground transition-all duration-200 hover:border-[#ff7417]/20 hover:bg-[#ff7417]/[0.10] hover:text-foreground"
        >
          <ChevronLeft className="h-5 w-5 shrink-0 transition-colors group-hover:text-[#ff7417]" />

          <span className="text-sm font-medium transition-colors">
            Back to Main App
          </span>
        </Link>
      </nav>

      {/* User Profile Section - Bottom */}
      <div className="shrink-0 border-t border-border">
        <button
          onClick={() => setProfileOpen(!profileOpen)}
          className="flex w-full min-w-0 items-center gap-3 border-t border-border p-4 transition-colors duration-200 hover:bg-[#ff7417]/[0.06]"
          aria-expanded={profileOpen}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#ff7417]/15">
            <span className="text-sm font-bold text-[#ff7417]">
              {userInitials}
            </span>
          </div>

          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-sm font-medium text-foreground">
              {user?.full_name || 'Barber'}
            </p>

            <p className="text-xs text-muted-foreground">
              Approved Barber
            </p>
          </div>

          <motion.div
            animate={{ rotate: profileOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
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
                <div className="flex items-center gap-2 rounded-xl border border-[#ff7417]/10 bg-[#ff7417]/[0.045] px-3 py-2">
                  <Mail className="h-4 w-4 shrink-0 text-[#ff7417]" />

                  <span className="truncate text-xs text-muted-foreground">
                    {user?.email || ''}
                  </span>
                </div>

                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
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