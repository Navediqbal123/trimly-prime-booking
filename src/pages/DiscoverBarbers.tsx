import { motion } from 'framer-motion';
import { Scissors } from 'lucide-react';

export default function DiscoverBarbers() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="animate-fade-in"
    >
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-display font-bold mb-2">
          Discover <span className="gradient-text">Barbers</span>
        </h1>
        <p className="text-white/90">Browse our featured services on the home page to book.</p>
      </div>

      <div className="glass-card rounded-2xl p-10 text-center">
        <Scissors className="w-12 h-12 text-gold mx-auto mb-4" />
        <h3 className="text-xl font-display font-semibold text-white mb-2">
          Barber profiles are private
        </h3>
        <p className="text-white/80 max-w-md mx-auto">
          To keep our network exclusive, individual barber profiles aren't listed publicly.
          Head back to the home page and pick a featured service to book your appointment.
        </p>
      </div>
    </motion.div>
  );
}
