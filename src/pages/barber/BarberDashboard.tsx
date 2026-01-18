import { motion } from 'framer-motion';
import { LayoutDashboard, Calendar, DollarSign, Users, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const stats = [
  { title: 'Total Bookings', value: '156', change: '+12%', icon: Calendar },
  { title: 'Revenue', value: '$4,320', change: '+8%', icon: DollarSign },
  { title: 'Customers', value: '89', change: '+15%', icon: Users },
  { title: 'Rating', value: '4.8', change: '+0.2', icon: TrendingUp },
];

const recentBookings = [
  { id: 1, customer: 'John Smith', service: 'Classic Haircut', time: '10:00 AM', status: 'confirmed' },
  { id: 2, customer: 'Mike Johnson', service: 'Fade + Beard', time: '11:30 AM', status: 'pending' },
  { id: 3, customer: 'David Wilson', service: 'Hot Towel Shave', time: '2:00 PM', status: 'confirmed' },
  { id: 4, customer: 'James Brown', service: 'Kids Haircut', time: '3:30 PM', status: 'confirmed' },
];

export default function BarberDashboard() {
  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-display font-bold mb-2">
          Barber <span className="gradient-text">Dashboard</span>
        </h1>
        <p className="text-muted-foreground">Overview of your barbershop performance</p>
      </div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        {stats.map((stat, index) => (
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

      {/* Today's Bookings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Today's Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/50"
                >
                  <div>
                    <p className="font-medium">{booking.customer}</p>
                    <p className="text-sm text-muted-foreground">{booking.service}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{booking.time}</p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        booking.status === 'confirmed'
                          ? 'bg-green-500/10 text-green-500'
                          : 'bg-yellow-500/10 text-yellow-500'
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
