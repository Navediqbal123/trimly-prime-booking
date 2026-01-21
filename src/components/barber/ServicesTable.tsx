import { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Plus, Loader2, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ServiceData, addService, updateService } from '@/lib/api';

interface ServicesTableProps {
  services: ServiceData[];
  onRefresh: () => void;
  loading: boolean;
}

export function ServicesTable({ services, onRefresh, loading }: ServicesTableProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    duration: '',
    price: '',
    home_service: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.duration || !formData.price) {
      toast.error('Please fill in all fields');
      return;
    }

    setSubmitting(true);

    if (editingService) {
      // Edit existing service
      const response = await updateService(editingService.id, {
        name: formData.name,
        duration: parseInt(formData.duration),
        price: parseFloat(formData.price),
        home_service: formData.home_service,
      });

      if (response.success) {
        toast.success('Service updated successfully');
        setIsOpen(false);
        resetForm();
        onRefresh();
      } else {
        toast.error(response.error || 'Failed to update service');
      }
    } else {
      // Add new service
      const response = await addService({
        name: formData.name,
        duration: parseInt(formData.duration),
        price: parseFloat(formData.price),
        home_service: formData.home_service,
      });

      if (response.success) {
        toast.success('Service added successfully');
        setIsOpen(false);
        resetForm();
        onRefresh();
      } else {
        toast.error(response.error || 'Failed to add service');
      }
    }
    setSubmitting(false);
  };

  const handleEdit = (service: ServiceData) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      duration: service.duration.toString(),
      price: service.price.toString(),
      home_service: service.home_service,
    });
    setIsOpen(true);
  };

  const resetForm = () => {
    setEditingService(null);
    setFormData({ name: '', duration: '', price: '', home_service: false });
  };

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>My Services</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Service
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingService ? 'Edit Service' : 'Add New Service'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Service Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Classic Haircut"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    name="duration"
                    type="number"
                    value={formData.duration}
                    onChange={handleChange}
                    placeholder="30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹)</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="250"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="home_service">Home Service Available</Label>
                  <Switch
                    id="home_service"
                    checked={formData.home_service}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, home_service: checked }))
                    }
                  />
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {editingService ? 'Updating...' : 'Adding...'}
                    </>
                  ) : editingService ? (
                    'Update Service'
                  ) : (
                    'Add Service'
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {services.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service Name</TableHead>
                  <TableHead>Price (₹)</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Home Service</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell>₹{service.price.toLocaleString('en-IN')}</TableCell>
                    <TableCell>{service.duration} min</TableCell>
                    <TableCell>
                      {service.home_service ? (
                        <span className="flex items-center gap-1 text-green-500">
                          <Home className="w-4 h-4" /> Yes
                        </span>
                      ) : (
                        <span className="text-muted-foreground">No</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(service)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No services yet. Add your first service to start accepting bookings.
          </div>
        )}
      </CardContent>
    </Card>
  );
}