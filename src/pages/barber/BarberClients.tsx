import { motion } from 'framer-motion';
import { Users, Phone, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Client {
  id: string;
  full_name: string;
  phone: string;
}

async function fetchMyClients(): Promise<Client[]> {
  const { supabase } = await import('@/lib/supabase');
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch('https://saloon-backend-gp4v.onrender.com/api/clients/my-clients', {
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
  });
  if (!res.ok) throw new Error('Failed to fetch clients');
  const data = await res.json();
  return Array.isArray(data) ? data : data.data ?? [];
}

export default function BarberClients() {
  const { data: clients, isLoading } = useQuery({
    queryKey: ['myClients'],
    queryFn: fetchMyClients,
  });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold mb-2">
          My <span className="gradient-text">Clients</span>
        </h1>
        <p className="text-muted-foreground">View and manage your client base</p>
      </div>

      {isLoading ? (
        <Card><CardContent className="p-6 space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
        </CardContent></Card>
      ) : !clients?.length ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg font-medium text-muted-foreground">No clients yet</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Clients who book with you will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Phone</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                            {client.full_name?.charAt(0)?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">{client.full_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-3.5 h-3.5" />
                        {client.phone || 'N/A'}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
