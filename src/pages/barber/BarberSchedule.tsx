import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function BarberSchedule() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-display font-bold mb-2">
          My <span className="gradient-text">Schedule</span>
        </h1>
        <p className="text-muted-foreground">Set your working hours and availability</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Availability
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Schedule management coming soon. You'll be able to set your working hours, days off, and break times here.</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
