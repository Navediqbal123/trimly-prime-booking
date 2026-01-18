import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Star, MapPin, Filter, Scissors } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const allBarbers = [
  {
    id: '1',
    shop_name: 'Classic Cuts Barbershop',
    description: 'Traditional barbershop offering classic cuts and hot towel shaves.',
    address: '123 Main Street, Downtown',
    image_url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=500',
    rating: 4.8,
    reviews: 124,
    specialties: ['Classic Cuts', 'Hot Shaves', 'Beard Trim'],
  },
  {
    id: '2',
    shop_name: 'Modern Styles Studio',
    description: 'Contemporary styling with the latest trends and techniques.',
    address: '456 Oak Avenue, Uptown',
    image_url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=500',
    rating: 4.9,
    reviews: 89,
    specialties: ['Fades', 'Modern Styles', 'Hair Design'],
  },
  {
    id: '3',
    shop_name: "The Gentleman's Corner",
    description: 'Premium grooming experience for the modern gentleman.',
    address: '789 Elite Boulevard',
    image_url: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=500',
    rating: 4.7,
    reviews: 156,
    specialties: ['Executive Cuts', 'Facial Treatments', 'Grooming'],
  },
  {
    id: '4',
    shop_name: 'Urban Edge Barbers',
    description: 'Trendy cuts and fades in a cool urban atmosphere.',
    address: '321 Street Art Lane',
    image_url: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=500',
    rating: 4.6,
    reviews: 78,
    specialties: ['Urban Styles', 'Fades', 'Line-ups'],
  },
  {
    id: '5',
    shop_name: 'Royal Razor Lounge',
    description: 'Luxury barbershop with a royal treatment experience.',
    address: '555 Crown Street',
    image_url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=500',
    rating: 4.9,
    reviews: 203,
    specialties: ['Luxury Cuts', 'Hot Towel Shave', 'Scalp Massage'],
  },
  {
    id: '6',
    shop_name: 'Fade Masters',
    description: 'Specialists in all types of fades and modern haircuts.',
    address: '999 Blend Avenue',
    image_url: 'https://images.unsplash.com/photo-1493256338651-d82f7acb2b38?w=500',
    rating: 4.8,
    reviews: 167,
    specialties: ['All Fades', 'Designs', 'Color'],
  },
];

export default function DiscoverBarbers() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [barbers, setBarbers] = useState(allBarbers);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query) {
      const filtered = allBarbers.filter(
        (barber) =>
          barber.shop_name.toLowerCase().includes(query.toLowerCase()) ||
          barber.specialties.some((s) => s.toLowerCase().includes(query.toLowerCase()))
      );
      setBarbers(filtered);
    } else {
      setBarbers(allBarbers);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-display font-bold mb-2">
          Discover <span className="gradient-text">Barbers</span>
        </h1>
        <p className="text-muted-foreground">
          Find the perfect barber for your style
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by name, style, or specialty..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-12 h-12 bg-card"
          />
        </div>
        <Button variant="outline" className="h-12 gap-2">
          <Filter className="w-4 h-4" />
          Filters
        </Button>
      </div>

      {/* Barbers Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
      >
        {barbers.map((barber, index) => (
          <motion.div
            key={barber.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -5 }}
            className="bg-card border border-border rounded-2xl overflow-hidden group cursor-pointer hover:border-primary/50 transition-all duration-300"
            onClick={() => navigate(`/book/${barber.id}`)}
          >
            <div className="relative h-48 overflow-hidden">
              <img
                src={barber.image_url}
                alt={barber.shop_name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-display font-semibold group-hover:text-primary transition-colors">
                  {barber.shop_name}
                </h3>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-medium">{barber.rating}</span>
                  <span className="text-sm text-muted-foreground">({barber.reviews})</span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {barber.description}
              </p>

              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <MapPin className="w-4 h-4" />
                <span>{barber.address}</span>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {barber.specialties.slice(0, 3).map((specialty) => (
                  <span
                    key={specialty}
                    className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full"
                  >
                    {specialty}
                  </span>
                ))}
              </div>

              <Button className="w-full">Book Appointment</Button>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {barbers.length === 0 && (
        <div className="text-center py-12">
          <Scissors className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No barbers found matching your search.</p>
        </div>
      )}
    </div>
  );
}
