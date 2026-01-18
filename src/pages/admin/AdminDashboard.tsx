import { motion } from 'framer-motion';
import { Users, Scissors, Calendar, TrendingUp, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const stats = [
  { title: 'Total Users', value: '1,234', icon: Users, change: '+12%' },
  { title: 'Total Barbers', value: '56', icon: Scissors, change: '+8%' },
  { title: 'Total Bookings', value: '3,456', icon: Calendar, change: '+23%' },
  { title: 'Revenue', value: '$45,678', icon: DollarSign, change: '+15%' },
];

export default function AdminDashboard() {
  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-display font-bold mb-2">
          Admin <span className="gradient-text">Dashboard</span>
        </h1>
        <p className="text-muted-foreground">Platform overview and statistics</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {stats.map((stat) => (
          <Card key={stat.title} className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-green-500">{stat.change} from last month</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>
    </div>
  );
}
