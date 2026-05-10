import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, MapPin, Filter, Scissors, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getApprovedBarbers } from '@/lib/api';

export default function DiscoverBarbers() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: allBarbers = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['approvedBarbers'],
    queryFn: async () => {
      const response = await getApprovedBarbers();
      return response.success && response.data ? response.data : [];
    },
  });

  const barbers = searchQuery
    ? allBarbers.filter(
        (barber) =>
          barber.shop_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          barber.location.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allBarbers;

  return (
    <div className="animate-fade-in">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl lg:text-4xl font-display font-bold mb-2">
            Discover <span className="gradient-text">Barbers</span>
          </h1>
          <p className="text-white/90">Find the perfect barber for your style</p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/90" />
          <Input
            placeholder="Search by name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 bg-card"
          />
        </div>
        <Button variant="outline" className="h-12 gap-2">
          <Filter className="w-4 h-4" /> Filters
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p className="text-white/90">Loading barbers...</p>
        </div>
      ) : barbers.length > 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {barbers.map((barber, index) => (
            <motion.div
              key={barber.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="glass-card rounded-2xl overflow-hidden group cursor-pointer hover:border-gold/50 transition-all duration-300"
              onClick={() => navigate(`/book/${barber.id}`)}
            >
              <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/40 via-primary/20 to-background flex items-center justify-center">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,hsl(270_70%_60%/0.35),transparent_70%)]" />
                <Scissors className="relative w-16 h-16 text-gold drop-shadow-[0_0_12px_hsl(var(--gold)/0.6)]" />
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-display font-bold gradient-gold-text group-hover:opacity-90 transition-opacity">
                    {barber.shop_name}
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/90 mb-3">
                  <MapPin className="w-4 h-4 text-gold" />
                  <span className="font-medium">{barber.location}</span>
                </div>
                {barber.user?.name && (
                  <p className="text-sm text-white/80 mb-4 font-medium">
                    Owner: <span className="text-foreground">{barber.user.name}</span>
                  </p>
                )}
                <Button className="w-full bg-gradient-to-r from-primary via-purple-500 to-primary hover:opacity-90 text-primary-foreground font-semibold rounded-xl shadow-lg shadow-primary/30">
                  Book Appointment
                </Button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="text-center py-12">
          <Scissors className="w-12 h-12 text-white/90 mx-auto mb-4" />
          <p className="text-white/90">
            {searchQuery ? 'No barbers found matching your search.' : 'No approved barbers available yet.'}
          </p>
        </div>
      )}
    </div>
  );
}