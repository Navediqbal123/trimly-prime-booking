import { motion } from 'framer-motion';
import { DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function BarberEarnings() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-display font-bold mb-2">
          My <span className="gradient-text">Earnings</span>
        </h1>
        <p className="text-muted-foreground">Track your revenue and payouts</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Earnings Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Detailed earnings tracking coming soon. You'll see daily, weekly, and monthly revenue breakdowns here.</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
