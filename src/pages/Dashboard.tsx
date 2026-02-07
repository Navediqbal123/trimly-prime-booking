import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Star, MapPin, Scissors, Loader2 } from 'lucide-react';
import { useProtectedUser } from '@/contexts/ProtectedUserContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getApprovedBarbers, ApprovedBarberData } from '@/lib/api';

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
  const { user } = useProtectedUser();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [barbers, setBarbers] = useState<ApprovedBarberData[]>([]);
  const [filteredBarbers, setFilteredBarbers] = useState<ApprovedBarberData[]>([]);
  const [loading, setLoading] = useState(true);

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

    fetchData();
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