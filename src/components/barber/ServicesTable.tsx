import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Plus, Loader2, Home, RefreshCw, Scissors } from 'lucide-react';
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

const rowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
    },
  }),
};

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
    <Card className="border-border overflow-hidden">
      <CardHeader className="flex flex-col min-[480px]:flex-row min-[480px]:items-center justify-between gap-3">
        <CardTitle className="flex items-center gap-2">
          <Scissors className="w-5 h-5 text-primary" />
          My Services
        </CardTitle>
        <div className="flex gap-2 w-full min-[480px]:w-auto">
          <Button 
            variant="outline" 
            size="icon"
            onClick={onRefresh} 
            disabled={loading}
            aria-label="Refresh"
            className="shrink-0 min-[480px]:w-auto min-[480px]:px-3 transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 min-[480px]:mr-2 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden min-[480px]:inline text-sm">Refresh</span>
          </Button>
          <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button 
                size="sm"
                className="flex-1 min-[480px]:flex-none transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="text-sm">Add Service</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="animate-scale-in">
              <DialogHeader>
                <DialogTitle>{editingService ? 'Edit Service' : 'Add New Service'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <motion.div 
                  className="space-y-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Label htmlFor="name">Service Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Classic Haircut"
                    className="transition-all duration-200 focus:scale-[1.02]"
                  />
                </motion.div>

                <motion.div 
                  className="space-y-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    name="duration"
                    type="number"
                    value={formData.duration}
                    onChange={handleChange}
                    placeholder="30"
                    className="transition-all duration-200 focus:scale-[1.02]"
                  />
                </motion.div>

                <motion.div 
                  className="space-y-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Label htmlFor="price">Price (₹)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="250"
                      className="pl-8 transition-all duration-200 focus:scale-[1.02]"
                    />
                  </div>
                </motion.div>

                <motion.div 
                  className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-primary" />
                    <Label htmlFor="home_service" className="cursor-pointer">Home Service Available</Label>
                  </div>
                  <Switch
                    id="home_service"
                    checked={formData.home_service}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, home_service: checked }))
                    }
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Button 
                    type="submit" 
                    className="w-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]" 
                    disabled={submitting}
                  >
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
                </motion.div>
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
                <AnimatePresence mode="popLayout">
                  {services.map((service, index) => (
                    <motion.tr
                      key={service.id}
                      custom={index}
                      variants={rowVariants}
                      initial="hidden"
                      animate="visible"
                      exit={{ opacity: 0, x: -20 }}
                      className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                    >
                      <TableCell className="font-medium">{service.name}</TableCell>
                      <TableCell>₹{service.price.toLocaleString('en-IN')}</TableCell>
                      <TableCell>{service.duration} min</TableCell>
                      <TableCell>
                        {service.home_service ? (
                          <motion.span 
                            className="flex items-center gap-1 text-green-500"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500 }}
                          >
                            <Home className="w-4 h-4" /> Yes
                          </motion.span>
                        ) : (
                          <span className="text-muted-foreground">No</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleEdit(service)}
                          className="transition-all duration-200 hover:scale-110"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 text-muted-foreground"
          >
            <Scissors className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No services yet.</p>
            <p className="text-sm mt-1">Add your first service to start accepting bookings.</p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
