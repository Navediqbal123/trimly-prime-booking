import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Scissors, RefreshCw, Loader2, AlertCircle, MapPin, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { getApprovedBarbers, ApprovedBarberData } from '@/lib/api';

export default function AdminBarbers() {
  const [barbers, setBarbers] = useState<ApprovedBarberData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBarbers = async () => {
    setLoading(true);
    const response = await getApprovedBarbers();
    
    if (response.success && response.data) {
      setBarbers(response.data);
    } else {
      toast.error(response.error || 'Failed to fetch barbers');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBarbers();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading barbers...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="animate-fade-in"
    >
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl lg:text-4xl font-display font-bold mb-2">
            Approved <span className="gradient-text">Barbers</span>
          </h1>
          <p className="text-muted-foreground">View all approved barbers on the platform</p>
        </div>
        <Button variant="outline" onClick={fetchBarbers} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scissors className="w-5 h-5 text-primary" />
            Barbers List ({barbers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {barbers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Shop Name</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {barbers.map((barber) => (
                    <TableRow key={barber.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Scissors className="w-4 h-4 text-primary" />
                          </div>
                          {barber.shop_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          {barber.user?.name || barber.user?.email || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          {barber.location}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded-full text-xs font-medium text-green-500 bg-green-500/10">
                          Approved
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Approved Barbers</h3>
              <p className="text-muted-foreground">No barbers have been approved yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}