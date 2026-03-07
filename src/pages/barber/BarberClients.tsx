import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function BarberClients() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-display font-bold mb-2">
          My <span className="gradient-text">Clients</span>
        </h1>
        <p className="text-muted-foreground">View and manage your client base</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Client List
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Client management coming soon. You'll see your regular clients, their booking history, and preferences here.</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
