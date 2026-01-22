import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Search,
  Calendar,
  User,
  Scissors,
  Store,
  Settings,
  Shield,
  Users,
  ClipboardList,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const userNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Discover Barbers', href: '/discover', icon: Search },
  { title: 'My Bookings', href: '/bookings', icon: Calendar },
  { title: 'My Profile', href: '/profile', icon: User },
  { title: 'Become a Barber', href: '/become-barber', icon: Scissors },
];

const barberNavItems: NavItem[] = [
  { title: 'Barber Hub', href: '/barber/dashboard', icon: LayoutDashboard },
  { title: 'My Shop', href: '/barber/shop', icon: Store },
  { title: 'Services', href: '/barber/services', icon: Settings },
  { title: 'Bookings', href: '/barber/bookings', icon: Calendar },
  { title: 'Profile', href: '/profile', icon: User },
];

const adminNavItems: NavItem[] = [
  { title: 'Admin Dashboard', href: '/admin/dashboard', icon: Shield },
  { title: 'Users', href: '/admin/users', icon: Users },
  { title: 'Barber Requests', href: '/admin/requests', icon: ClipboardList },
  { title: 'Barbers', href: '/admin/barbers', icon: Scissors },
  { title: 'Bookings', href: '/admin/bookings', icon: Calendar },
];

export function AppSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut, isAdmin, isSuperAdmin, isBarber, isBarberPending, barberStatusChecked } = useAuth();
  const location = useLocation();

  const getNavItems = (): NavItem[] => {
    // Show barber menu if user is an approved barber OR pending barber
    if (isBarber || isBarberPending) {
      return barberNavItems;
    }
    // For regular users (after barber status is checked), show full menu
    return userNavItems;
  };

  const navItems = getNavItems();

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.href;
    
    return (
      <Link
        to={item.href}
        onClick={() => setIsOpen(false)}
        className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
          'hover:bg-secondary/80 group',
          isActive && 'bg-primary/10 text-primary glow-primary'
        )}
      >
        <item.icon className={cn(
          'w-5 h-5 transition-colors',
          isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
        )} />
        <span className={cn(
          'font-medium transition-colors',
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

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </Button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
        className={cn(
          'fixed top-0 left-0 h-screen w-72 bg-card border-r border-border z-50',
          'flex flex-col transition-transform duration-300',
          'lg:translate-x-0 lg:static'
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Scissors className="w-6 h-6 text-primary" />
            </div>
            <span className="text-2xl font-display font-bold gradient-text">
              Trimly
            </span>
          </Link>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{user?.full_name || 'User'}</p>
              <p className="text-xs text-muted-foreground truncate capitalize">
                {user?.role?.replace('_', ' ') || 'User'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}

          {/* Admin Panel Link - Only for admin/super_admin */}
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
      </motion.aside>
    </>
  );
}
