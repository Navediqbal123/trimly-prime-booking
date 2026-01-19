import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Star, MapPin, Clock, Scissors } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface BarberShop {
  id: string;
  shop_name: string;
  description: string;
  address: string;
  phone: string;
  image_url: string;
  rating: number;
  services_count: number;
}

// Mock data for barber shops
const mockBarberShops: BarberShop[] = [
  {
    id: '1',
    shop_name: 'Classic Cuts Barbershop',
    description: 'Traditional barbershop offering classic cuts and hot towel shaves.',
    address: '123 Main Street, Downtown',
    phone: '+1 234 567 890',
    image_url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=500',
    rating: 4.8,
    services_count: 12,
  },
  {
    id: '2',
    shop_name: 'Modern Styles Studio',
    description: 'Contemporary styling with the latest trends and techniques.',
    address: '456 Oak Avenue, Uptown',
    phone: '+1 234 567 891',
    image_url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=500',
    rating: 4.9,
    services_count: 15,
  },
  {
    id: '3',
    shop_name: 'The Gentleman\'s Corner',
    description: 'Premium grooming experience for the modern gentleman.',
    address: '789 Elite Boulevard',
    phone: '+1 234 567 892',
    image_url: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=500',
    rating: 4.7,
    services_count: 10,
  },
  {
    id: '4',
    shop_name: 'Urban Edge Barbers',
    description: 'Trendy cuts and fades in a cool urban atmosphere.',
    address: '321 Street Art Lane',
    phone: '+1 234 567 893',
    image_url: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=500',
    rating: 4.6,
    services_count: 8,
  },
];

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
  const { user, isBarberPending } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [shops, setShops] = useState(mockBarberShops);

  useEffect(() => {
    if (searchQuery) {
      const filtered = mockBarberShops.filter(
        (shop) =>
          shop.shop_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          shop.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setShops(filtered);
    } else {
      setShops(mockBarberShops);
    }
  }, [searchQuery]);

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
      {isBarberPending && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 p-4 rounded-xl bg-primary/10 border border-primary/20"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Barber Request Pending</p>
              <p className="text-sm text-muted-foreground">
                Your barber application is under review. We'll notify you once approved.
              </p>
            </div>
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
            placeholder="Search barbers, styles, locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 bg-card border-border"
          />
        </div>
      </motion.div>

      {/* Barber Shops Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
      >
        {shops.map((shop) => (
          <motion.div
            key={shop.id}
            variants={item}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="bg-card border border-border rounded-2xl overflow-hidden group cursor-pointer hover:border-primary/50 transition-all duration-300 hover:glow-card"
            onClick={() => navigate(`/book/${shop.id}`)}
          >
            {/* Image */}
            <div className="relative h-48 overflow-hidden">
              <img
                src={shop.image_url}
                alt={shop.shop_name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              <div className="absolute bottom-4 left-4 flex items-center gap-2">
                <div className="flex items-center gap-1 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-lg">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-medium">{shop.rating}</span>
                </div>
                <div className="flex items-center gap-1 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-lg">
                  <Scissors className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{shop.services_count} services</span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-5">
              <h3 className="text-xl font-display font-semibold mb-2 group-hover:text-primary transition-colors">
                {shop.shop_name}
              </h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {shop.description}
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <MapPin className="w-4 h-4" />
                <span>{shop.address}</span>
              </div>
              <Button
                className="w-full group-hover:glow-primary transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/book/${shop.id}`);
                }}
              >
                Book Now
              </Button>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {shops.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Scissors className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No barbers found matching your search.</p>
        </motion.div>
      )}
    </div>
  );
}
