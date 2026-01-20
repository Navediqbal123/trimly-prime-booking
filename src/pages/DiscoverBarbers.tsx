import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, MapPin, Filter, Scissors, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getApprovedBarbers, ApprovedBarberData } from '@/lib/api';
import { toast } from 'sonner';

export default function DiscoverBarbers() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [allBarbers, setAllBarbers] = useState<ApprovedBarberData[]>([]);
  const [barbers, setBarbers] = useState<ApprovedBarberData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBarbers = async () => {
    setLoading(true);
    const response = await getApprovedBarbers();
    
    if (response.success && response.data) {
      setAllBarbers(response.data);
      setBarbers(response.data);
    } else {
      toast.error(response.error || 'Failed to fetch barbers');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBarbers();
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query) {
      const filtered = allBarbers.filter(
        (barber) =>
          barber.shop_name.toLowerCase().includes(query.toLowerCase()) ||
          barber.location.toLowerCase().includes(query.toLowerCase())
      );
      setBarbers(filtered);
    } else {
      setBarbers(allBarbers);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading barbers...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl lg:text-4xl font-display font-bold mb-2">
            Discover <span className="gradient-text">Barbers</span>
          </h1>
          <p className="text-muted-foreground">
            Find the perfect barber for your style
          </p>
        </div>
        <Button variant="outline" onClick={fetchBarbers} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by name or location..."
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
      {barbers.length > 0 ? (
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
              <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Scissors className="w-16 h-16 text-primary/40" />
              </div>

              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-display font-semibold group-hover:text-primary transition-colors">
                    {barber.shop_name}
                  </h3>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <MapPin className="w-4 h-4" />
                  <span>{barber.location}</span>
                </div>

                {barber.user?.name && (
                  <p className="text-sm text-muted-foreground mb-4">
                    Owner: {barber.user.name}
                  </p>
                )}

                <Button className="w-full">Book Appointment</Button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="text-center py-12">
          <Scissors className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {searchQuery ? 'No barbers found matching your search.' : 'No approved barbers available yet.'}
          </p>
        </div>
      )}
    </div>
  );
}
