import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function BarberReviews() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-display font-bold mb-2">
          My <span className="gradient-text">Reviews</span>
        </h1>
        <p className="text-muted-foreground">See what your clients are saying</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" />
            Client Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Reviews and ratings coming soon. You'll be able to view and respond to client feedback here.</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
