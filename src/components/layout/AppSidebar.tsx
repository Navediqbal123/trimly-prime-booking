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

export function AppSidebar() {
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

  const showCustomerHeader =
    location.pathname === '/dashboard' ||
    location.pathname.startsWith('/admin/');

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
        onClick={() => setIsOpen(false)}
        className={cn(
          'flex items-center gap-3 rounded-lg transition-all duration-200',
          'hover:bg-sidebar-accent/60 group',
          nested ? 'px-4 py-2.5 ml-4' : 'px-4 py-3',
          isActive &&
            'bg-primary/15 text-primary border border-primary/30 glow-primary'
        )}
      >
        <item.icon
          className={cn(
            'transition-colors',
            nested ? 'w-4 h-4' : 'w-5 h-5',
            isActive
              ? 'text-primary'
              : 'text-muted-foreground group-hover:text-foreground'
          )}
        />

        <span
          className={cn(
            'transition-colors',
            nested ? 'text-sm' : 'font-medium',
            isActive
              ? 'text-primary'
              : 'text-muted-foreground group-hover:text-foreground'
          )}
        >
          {item.title}
        </span>

        {isActive && (
          <ChevronRight className="w-4 h-4 ml-auto text-primary" />
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
          animate={{ y: headerVisible || isOpen ? 0 : '-100%' }}
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
          <div className="flex items-center justify-between gap-3 px-4 pt-3 pb-3 bg-white">
            {/* Orange 3D Menu Button + TrimlyHub */}
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isOpen}
                className="
                  flex h-12 w-12 shrink-0 items-center justify-center
                  rounded-full
                  bg-gradient-to-b from-[#ff963f] to-[#ff7417]
                  text-white
                  shadow-[inset_0_2px_3px_rgba(255,255,255,0.35),inset_0_-3px_4px_rgba(190,65,0,0.18),0_5px_10px_rgba(255,116,23,0.20)]
                  transition-transform duration-150
                  active:scale-95
                "
              >
                {isOpen ? (
                  <X className="h-6 w-6" strokeWidth={2.5} />
                ) : (
                  <Menu className="h-6 w-6" strokeWidth={2.5} />
                )}
              </button>

              <Link
                to="/dashboard"
                aria-label="TrimlyHub home"
                className="flex min-w-0 items-center whitespace-nowrap"
              >
                <span className="text-[25px] font-display font-extrabold leading-none tracking-tight text-foreground sm:text-3xl">
                  Trimly<span className="text-[#ff7417]">Hub</span>
                </span>
              </Link>
            </div>

            {/* Orange 3D Notification Bell */}
            <NotificationBell />
          </div>
        </motion.div>
      )}

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[1050] bg-background/80 backdrop-blur-sm lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isOpen ? 0 : '-100%',
        }}
        transition={{
          type: 'spring',
          damping: 25,
          stiffness: 300,
        }}
        className={cn(
          'fixed top-0 left-0 h-screen w-72 bg-sidebar border-r border-sidebar-border z-[1100] shadow-2xl lg:z-auto',
          'flex flex-col',
          'lg:translate-x-0 lg:static'
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
              <div className="w-12 h-12 rounded-xl flex items-center justify-center btn-gold shrink-0">
                <Scissors className="w-6 h-6" />
              </div>

              <span className="text-3xl font-display font-extrabold tracking-wide leading-none text-foreground">
                Trimly<span className="text-[#ff7417]">Hub</span>
              </span>
            </Link>

            <NotificationBell className="hidden lg:block" />
          </div>
        </motion.div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {baseUserNavItems.map((item, i) => (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.3 }}
            >
              <NavLink item={item} />
            </motion.div>
          ))}

          {hasNoBarber && (
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

          {isPending && !isBarberApproved && (
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

          {isBarberApproved && (
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

          {isSuperAdmin && (
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
  className="mx-4 mb-3 flex w-[calc(100%-2rem)] items-center justify-between rounded-xl border border-border bg-secondary/40 px-4 py-3 text-foreground transition-colors hover:bg-secondary"
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
    className={`relative h-6 w-11 rounded-full transition-colors ${
      theme === 'dark' ? 'bg-[#ff7417]' : 'bg-muted-foreground/30'
    }`}
  >
    <span
      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
        theme === 'dark' ? 'translate-x-[22px]' : 'translate-x-0.5'
      }`}
    />
  </span>
</button>
        {/* User Profile Section */}
        <div className="border-t border-border">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="w-full p-4 flex items-center gap-3 hover:bg-secondary/50 transition-colors duration-200"
            aria-expanded={profileOpen}
          >
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-primary">
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