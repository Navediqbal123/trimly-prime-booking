import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, RefreshCw, Loader2, AlertCircle, Mail, Calendar, Shield } from 'lucide-react';
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
import { getAdminUsers, UserData } from '@/lib/api';
import { cn } from '@/lib/utils';

const roleConfig: Record<string, { label: string; className: string }> = {
  user: {
    label: 'User',
    className: 'text-blue-500 bg-blue-500/10',
  },
  barber: {
    label: 'Barber',
    className: 'text-green-500 bg-green-500/10',
  },
  admin: {
    label: 'Admin',
    className: 'text-purple-500 bg-purple-500/10',
  },
  barber_pending: {
    label: 'Barber (Pending)',
    className: 'text-yellow-500 bg-yellow-500/10',
  },
};

export default function AdminUsers() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    const response = await getAdminUsers();
    
    if (response.success && response.data) {
      setUsers(response.data);
    } else {
      toast.error(response.error || 'Failed to fetch users');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading users...</p>
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
            All <span className="gradient-text">Users</span>
          </h1>
          <p className="text-muted-foreground">Manage platform users</p>
        </div>
        <Button variant="outline" onClick={fetchUsers} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Users List ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const role = roleConfig[user.role] || roleConfig.user;
                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            {user.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={cn('px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit', role.className)}>
                            <Shield className="w-3 h-3" />
                            {role.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            {new Date(user.created_at).toLocaleDateString('en-IN')}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Users Found</h3>
              <p className="text-muted-foreground">No users registered on the platform yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}