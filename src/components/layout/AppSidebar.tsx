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
} from 'lucide-react';
import { useProtectedUser } from '@/contexts/ProtectedUserContext';
import { Button } from '@/components/ui/button';
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
  const { user, signOut, isAdmin, isSuperAdmin, isBarber, isBarberPending } = useProtectedUser();
  const location = useLocation();

  const isBarberApproved = isBarber;
  const isPending = isBarberPending;
  const hasNoBarber = !isBarber && !isBarberPending;

  const NavLink = ({ item, nested = false }: { item: NavItemType; nested?: boolean }) => {
    const isActive = location.pathname === item.href;
    
    return (
      <Link
        to={item.href}
        onClick={() => setIsOpen(false)}
        className={cn(
          'flex items-center gap-3 rounded-lg transition-all duration-200',
          'hover:bg-secondary/80 group',
          nested ? 'px-4 py-2.5 ml-4' : 'px-4 py-3',
          isActive && 'bg-primary/10 text-primary glow-primary'
        )}
      >
        <item.icon className={cn(
          'transition-colors',
          nested ? 'w-4 h-4' : 'w-5 h-5',
          isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
        )} />
        <span className={cn(
          'transition-colors',
          nested ? 'text-sm' : 'font-medium',
          isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
        )}>
          {item.title}
        </span>
        {isActive && (
          <ChevronRight className="w-4 h-4 ml-auto text-primary" />
        )}
      </Link>
    );
  };

  const userInitials = (user?.full_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <>
      {/* Mobile Menu Button + Brand */}
      <div className="fixed top-4 left-4 z-50 lg:hidden flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="h-12 w-12 [&_svg]:size-7"
        >
          {isOpen ? <X /> : <Menu />}
        </Button>
        <AnimatePresence>
          {!isOpen && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="flex items-center"
            >
              <span className="text-2xl font-display font-bold gradient-text tracking-tight">
                Barber&nbsp;&nbsp;Lane
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
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
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={cn(
          'fixed top-0 left-0 h-screen w-72 bg-card border-r border-border z-50',
          'flex flex-col',
          'lg:translate-x-0 lg:static'
        )}
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="p-6 border-b border-border"
        >
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Scissors className="w-6 h-6 text-primary" />
            </div>
            <span className="text-2xl font-display font-bold gradient-text">
              Barber&nbsp;&nbsp;Lane
            </span>
          </Link>
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
                item={{ title: 'Become a Barber', href: '/become-barber', icon: Scissors }} 
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
                <span className="text-sm text-accent font-medium">Waiting for approval</span>
              </div>
            </motion.div>
          )}

          {isBarberApproved && (
            <>
              <div className="my-4 border-t border-border" />
              <NavLink 
                item={{ title: 'Barber Hub', href: '/barber-hub', icon: Scissors }} 
              />
            </>
          )}

          {(isAdmin || isSuperAdmin) && (
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
              <p className="font-medium text-sm truncate">{user?.full_name || 'User'}</p>
              <p className="text-xs text-muted-foreground truncate capitalize">
                {isBarber ? 'Barber' : isBarberPending ? 'Pending Barber' : user?.role?.replace('_', ' ') || 'User'}
              </p>
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
      </motion.aside>
    </>
  );
}
