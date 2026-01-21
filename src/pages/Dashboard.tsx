import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Star, MapPin, Clock, Scissors, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getApprovedBarbers, getMyBarberProfile, ApprovedBarberData } from '@/lib/api';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [barbers, setBarbers] = useState<ApprovedBarberData[]>([]);
  const [filteredBarbers, setFilteredBarbers] = useState<ApprovedBarberData[]>([]);
  const [loading, setLoading] = useState(true);
  const [barberStatus, setBarberStatus] = useState<'none' | 'pending' | 'approved'>('none');
  const [checkingBarberStatus, setCheckingBarberStatus] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Fetch approved barbers
      const response = await getApprovedBarbers();
      if (response.success && response.data) {
        setBarbers(response.data);
        setFilteredBarbers(response.data);
      }
      
      setLoading(false);
    };

    const checkBarberStatus = async () => {
      setCheckingBarberStatus(true);
      const response = await getMyBarberProfile();
      
      if (response.success && response.data) {
        if (response.data.status === 'approved') {
          setBarberStatus('approved');
        } else if (response.data.status === 'pending') {
          setBarberStatus('pending');
        }
      } else {
        // No barber record found
        setBarberStatus('none');
      }
      setCheckingBarberStatus(false);
    };

    fetchData();
    checkBarberStatus();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = barbers.filter(
        (barber) =>
          barber.shop_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          barber.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredBarbers(filtered);
    } else {
      setFilteredBarbers(barbers);
    }
  }, [searchQuery, barbers]);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl lg:text-4xl font-display font-bold mb-2"
        >
          Welcome back, <span className="gradient-text">{user?.full_name?.split(' ')[0] || 'User'}</span>
        </motion.h1>
        <p className="text-muted-foreground">
          Find your perfect barber and book an appointment today.
        </p>
      </div>

      {/* Pending Status Banner */}
      {barberStatus === 'pending' && !checkingBarberStatus && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="font-medium text-yellow-500">Waiting for Admin Approval</p>
              <p className="text-sm text-muted-foreground">
                Your barber application is under review. We'll notify you once approved.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Become a Barber CTA - only show if not a barber and not pending */}
      {barberStatus === 'none' && !checkingBarberStatus && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 p-4 rounded-xl bg-primary/10 border border-primary/20"
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Scissors className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Are you a barber?</p>
                <p className="text-sm text-muted-foreground">
                  Join our platform and start accepting bookings today.
                </p>
              </div>
            </div>
            <Button onClick={() => navigate('/become-barber')}>
              Become a Barber
            </Button>
          </div>
        </motion.div>
      )}

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <div className="relative max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search barbers, locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 bg-card border-border"
          />
        </div>
      </motion.div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading barbers...</p>
        </div>
      )}

      {/* Barber Shops Grid */}
      {!loading && (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          {filteredBarbers.map((barber) => (
            <motion.div
              key={barber.id}
              variants={item}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="bg-card border border-border rounded-2xl overflow-hidden group cursor-pointer hover:border-primary/50 transition-all duration-300 hover:glow-card"
              onClick={() => navigate(`/book/${barber.id}`)}
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Scissors className="w-16 h-16 text-primary/30" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-lg">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-medium">New</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-xl font-display font-semibold mb-2 group-hover:text-primary transition-colors">
                  {barber.shop_name}
                </h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <MapPin className="w-4 h-4" />
                  <span>{barber.location}</span>
                </div>
                <Button
                  className="w-full group-hover:glow-primary transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/book/${barber.id}`);
                  }}
                >
                  Book Now
                </Button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {!loading && filteredBarbers.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Scissors className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {searchQuery ? 'No barbers found matching your search.' : 'No barbers available yet.'}
          </p>
        </motion.div>
      )}
    </div>
  );
}