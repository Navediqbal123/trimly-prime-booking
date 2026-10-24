import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Search,
  Calendar,
  User,
  Scissors,
  Shield,
  Users,
  ClipboardList,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  Clock,
  Mail,
  Heart,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useProtectedUser } from '@/contexts/ProtectedUserContext';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/NotificationBell';
import { useHideOnScroll } from '@/hooks/useHideOnScroll';
import { cn } from '@/lib/utils';

interface NavItemType {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const baseUserNavItems: NavItemType[] = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Discover Barbers', href: '/discover', icon: Search },
  { title: 'My Bookings', href: '/bookings', icon: Calendar },
  { title: 'Liked Shops ❤️', href: '/liked-shops', icon: Heart },
  { title: 'My Profile', href: '/profile', icon: User },
];

const adminNavItems: NavItemType[] = [
  { title: 'Admin Dashboard', href: '/admin/dashboard', icon: Shield },
  { title: 'Users', href: '/admin/users', icon: Users },
  { title: 'Barber Requests', href: '/admin/requests', icon: ClipboardList },
  { title: 'Barbers', href: '/admin/barbers', icon: Scissors },
  { title: 'Bookings', href: '/admin/bookings', icon: Calendar },
];

interface AppSidebarProps {
  adminMode?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AppSidebar({ adminMode = false, isOpen: controlledOpen, onOpenChange }: AppSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const { theme, setTheme } = useTheme();

  const {
    user,
    signOut,
    isAdmin,
    isSuperAdmin,
    isBarber,
    isBarberPending,
  } = useProtectedUser();

  const location = useLocation();
  const headerVisible = useHideOnScroll(0);
  const menuOpen = controlledOpen ?? isOpen;
  const setMenuOpen = (open: boolean) => {
    if (controlledOpen === undefined) setIsOpen(open);
    onOpenChange?.(open);
  };

  const showCustomerHeader =
    !adminMode && location.pathname === '/dashboard';

  const isBarberApproved = isBarber;
  const isPending = isBarberPending;
  const hasNoBarber = !isBarber && !isBarberPending;

  const NavLink = ({
    item,
    nested = false,
  }: {
    item: NavItemType;
    nested?: boolean;
  }) => {
    const isActive = location.pathname === item.href;

    return (
      <Link
        to={item.href}
        onClick={() => setMenuOpen(false)}
        className={cn(
          'group flex items-center gap-3 rounded-2xl border transition-all duration-200',
          nested ? 'ml-4 px-4 py-2.5' : 'px-4 py-3.5',
          isActive
            ? 'border-[#ff7417] bg-gradient-to-b from-[#ff963f] to-[#ff7417] text-white shadow-[inset_0_2px_3px_rgba(255,255,255,0.28),0_5px_12px_rgba(255,116,23,0.22)]'
            : 'border-transparent bg-[#ff7417]/[0.045] text-muted-foreground hover:border-[#ff7417]/20 hover:bg-[#ff7417]/[0.10] hover:text-foreground'
        )}
      >
        <item.icon
          className={cn(
            'transition-colors',
            nested ? 'w-4 h-4' : 'w-5 h-5',
            isActive
              ? 'text-white'
              : 'text-muted-foreground group-hover:text-[#ff7417]'
          )}
        />

        <span
          className={cn(
            'transition-colors',
            nested ? 'text-sm' : 'font-medium',
            isActive
              ? 'text-white'
              : 'text-muted-foreground group-hover:text-[#ff7417]'
          )}
        >
          {item.title}
        </span>

        {isActive && (
          <ChevronRight className="ml-auto h-4 w-4 text-white" />
        )}
      </Link>
    );
  };

  const userInitials = (user?.full_name || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      {/* Mobile Customer Header */}
      {showCustomerHeader && (
        <motion.div
          initial={false}
          animate={{ y: headerVisible || menuOpen ? 0 : '-100%' }}
          transition={{
            duration: 0.25,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="lg:hidden"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            zIndex: 1000,
            backgroundColor: 'hsl(var(--background))',
            willChange: 'transform',
          }}
        >
          <div className="relative flex items-center justify-between gap-3 px-4 pt-3 pb-3 bg-background border-b border-border">
            {/* Orange 3D Menu Button */}
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              className="
                relative z-10 flex h-12 w-12 shrink-0 items-center justify-center
                rounded-full
                bg-gradient-to-b from-[#ff963f] to-[#ff7417]
                text-white
                shadow-[inset_0_2px_3px_rgba(255,255,255,0.35),inset_0_-3px_4px_rgba(190,65,0,0.18),0_5px_10px_rgba(255,116,23,0.20)]
                transition-transform duration-150
                active:scale-95
              "
            >
              {menuOpen ? (
                <X className="h-6 w-6" strokeWidth={2.5} />
              ) : (
                <Menu className="h-6 w-6" strokeWidth={2.5} />
              )}
            </button>

            {/* Centered TrimlyHub Logo */}
            <Link
              to="/dashboard"
              aria-label="TrimlyHub home"
              className="absolute left-1/2 top-1/2 z-0 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center whitespace-nowrap"
            >
              <span className="text-[25px] font-display font-extrabold leading-none tracking-tight text-foreground sm:text-3xl">
                Trimly<span className="text-[#ff7417]">Hub</span>
              </span>
            </Link>

            {/* Orange 3D Notification Bell */}
            <div className="relative z-10 shrink-0">
              <NotificationBell />
            </div>
          </div>
        </motion.div>
      )}

      {/* Mobile Overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn('fixed inset-0 z-[1050] bg-background/80 backdrop-blur-sm', !adminMode && 'lg:hidden')}
            onClick={() => setMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: menuOpen ? 0 : '-100%',
        }}
        transition={{
          type: 'spring',
          damping: 25,
          stiffness: 300,
        }}
        className={cn(
            adminMode
              ? 'fixed top-0 left-0 z-[1100] flex h-screen w-72 flex-col border-r border-border bg-background'
              : 'fixed top-0 left-0 z-[1100] flex h-screen w-72 flex-col border-r border-border bg-background lg:z-auto lg:translate-x-0 lg:static'
        )}
      >
        {/* Desktop Sidebar Logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="p-6 border-b border-border"
        >
          <div className="flex items-center justify-between gap-3">
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#ff7417]/10 p-1">
                <img src="/trimly-logo.png" alt="Trimly logo" className="h-full w-full rounded-[15%] object-contain" />
              </div>

              <span className="text-3xl font-display font-extrabold tracking-wide leading-none text-foreground">
                Trimly<span className="text-[#ff7417]">Hub</span>
              </span>
            </Link>

            {!adminMode && <NotificationBell className="hidden lg:block" />}
          </div>
        </motion.div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {adminMode ? (
            <>
              <NavLink item={{ title: 'Customer Dashboard', href: '/dashboard', icon: LayoutDashboard }} />
              {adminNavItems.map((item) => <NavLink key={item.href} item={item} />)}
            </>
          ) : baseUserNavItems.map((item, i) => (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.3 }}
            >
              <NavLink item={item} />
            </motion.div>
          ))}

          {!adminMode && hasNoBarber && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25, duration: 0.3 }}
            >
              <NavLink
                item={{
                  title: 'Become a Barber',
                  href: '/become-barber',
                  icon: Scissors,
                }}
              />
            </motion.div>
          )}

          {!adminMode && isPending && !isBarberApproved && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 py-3"
            >
              <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/10 border border-accent/30">
                <Clock className="w-4 h-4 text-accent" />
                <span className="text-sm text-accent font-medium">
                  Waiting for approval
                </span>
              </div>
            </motion.div>
          )}

          {!adminMode && isBarberApproved && (
            <>
              <div className="my-4 border-t border-border" />
              <NavLink
                item={{
                  title: 'Barber Hub',
                  href: '/barber-hub',
                  icon: Scissors,
                }}
              />
            </>
          )}

          {!adminMode && isSuperAdmin && (
            <>
              <div className="my-4 border-t border-border" />

              <div className="px-4 py-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Admin
                </p>
              </div>

              {adminNavItems.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </>
          )}
        </nav>
{/* Light / Dark Theme Toggle */}
<button
  type="button"
  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
  className="mx-4 mb-3 flex w-[calc(100%-2rem)] min-w-0 shrink-0 items-center justify-between gap-3 rounded-2xl border border-[#ff7417]/20 bg-[#ff7417]/[0.06] px-4 py-3 text-foreground transition-colors hover:bg-[#ff7417]/[0.10]"
  aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
>
  <span className="flex items-center gap-3">
    {theme === 'dark' ? (
      <Sun className="h-5 w-5 text-[#ff7417]" />
    ) : (
      <Moon className="h-5 w-5 text-[#ff7417]" />
    )}
    <span className="text-sm font-medium">
      {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
    </span>
  </span>

  <span
    className={`relative block h-6 w-11 shrink-0 overflow-hidden rounded-full transition-colors ${
      theme === 'dark' ? 'bg-[#ff7417]' : 'bg-muted-foreground/30'
    }`}
  >
    <span
      className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
        theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </span>
</button>
        {/* User Profile Section */}
        <div className="border-t border-border">
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

            <div className="flex-1 min-w-0 text-left">
              <p className="font-semibold text-sm truncate">
                {user?.full_name || 'User'}
              </p>
            </div>

            <motion.div
              animate={{ rotate: profileOpen ? 90 : 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
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
                    <span className="text-xs text-muted-foreground truncate">
                      {user?.email || ''}
                    </span>
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
      </motion.aside>
    </>
  );
}
