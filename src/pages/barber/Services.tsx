import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Clock, DollarSign, Scissors, Loader2, Home, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { addService } from '@/lib/api';

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  home_service: boolean;
}

export default function Services() {
  // Start with empty array - no mock data with numeric IDs
  // Services should be fetched from backend once a GET endpoint is available
  const [services, setServices] = useState<Service[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(false);
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

    if (editingService) {
      // Editing - no backend route, just update local UI
      setServices((prev) =>
        prev.map((s) =>
          s.id === editingService.id
            ? {
                ...s,
                name: formData.name,
                duration: parseInt(formData.duration),
                price: parseFloat(formData.price),
                home_service: formData.home_service,
              }
            : s
        )
      );
      toast.success('Service updated locally');
      setIsOpen(false);
      setEditingService(null);
      setFormData({ name: '', duration: '', price: '', home_service: false });
    } else {
      // Adding new service - call backend API
      // Backend resolves barber_id from JWT, do NOT send barber_id
      setLoading(true);
      const response = await addService({
        name: formData.name,
        duration: parseInt(formData.duration),
        price: parseFloat(formData.price),
        home_service: formData.home_service,
      });

      if (response.success) {
        // Generate a temporary UUID for local display
        // In production, backend should return the created service with its UUID
        const tempId = crypto.randomUUID();
        const newService: Service = {
          id: tempId,
          name: formData.name,
          duration: parseInt(formData.duration),
          price: parseFloat(formData.price),
          home_service: formData.home_service,
        };
        setServices((prev) => [...prev, newService]);
        toast.success('Service added successfully');
        setIsOpen(false);
        setFormData({ name: '', duration: '', price: '', home_service: false });
      } else {
        toast.error(response.error || 'Failed to add service');
      }
      setLoading(false);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      duration: service.duration.toString(),
      price: service.price.toString(),
      home_service: service.home_service,
    });
    setIsOpen(true);
  };

  const handleDelete = (id: string) => {
    // No backend route for delete - just update local UI
    setServices((prev) => prev.filter((s) => s.id !== id));
    toast.success('Service removed locally');
  };

  const resetForm = () => {
    setEditingService(null);
    setFormData({ name: '', duration: '', price: '', home_service: false });
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl lg:text-4xl font-display font-bold mb-2">
            My <span className="gradient-text">Services</span>
          </h1>
          <p className="text-muted-foreground">Manage your service offerings</p>
        </div>

        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
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
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="25.00"
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

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
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

      {services.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {services.map((service) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-2xl p-5"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Scissors className="w-6 h-6 text-primary" />
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => handleEdit(service)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(service.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-lg">{service.name}</h3>
                {service.home_service && (
                  <Home className="w-4 h-4 text-green-500" />
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{service.duration} min</span>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  <span>{service.price}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Services Yet</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            Add your first service to start accepting bookings. Click the "Add Service" button above.
          </p>
        </div>
      )}
    </div>
  );
}
