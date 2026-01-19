import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Clock, DollarSign, Scissors, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
}

const initialServices: Service[] = [
  { id: '1', name: 'Classic Haircut', duration: 30, price: 25 },
  { id: '2', name: 'Fade Haircut', duration: 45, price: 35 },
  { id: '3', name: 'Beard Trim', duration: 20, price: 15 },
  { id: '4', name: 'Hot Towel Shave', duration: 30, price: 30 },
  { id: '5', name: 'Haircut + Beard', duration: 60, price: 45 },
];

export default function Services() {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [isOpen, setIsOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    duration: '',
    price: '',
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
      // Editing - no backend route, just update UI
      setServices((prev) =>
        prev.map((s) =>
          s.id === editingService.id
            ? {
                ...s,
                name: formData.name,
                duration: parseInt(formData.duration),
                price: parseFloat(formData.price),
              }
            : s
        )
      );
      toast.success('Service updated successfully');
      setIsOpen(false);
      setEditingService(null);
      setFormData({ name: '', duration: '', price: '' });
    } else {
      // Adding new service - call backend API
      setLoading(true);
      const response = await addService({
        name: formData.name,
        duration: parseInt(formData.duration),
        price: parseFloat(formData.price),
      });

      if (response.success) {
        const newService: Service = {
          id: Date.now().toString(),
          name: formData.name,
          duration: parseInt(formData.duration),
          price: parseFloat(formData.price),
        };
        setServices((prev) => [...prev, newService]);
        toast.success('Service added successfully');
        setIsOpen(false);
        setFormData({ name: '', duration: '', price: '' });
      } else {
        toast.error(response.error || 'Failed to add service');
      }
      setLoading(false);
    }

    setEditingService(null);
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      duration: service.duration.toString(),
      price: service.price.toString(),
    });
    setIsOpen(true);
  };

  const handleDelete = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
    toast.success('Service deleted');
  };

  const openAddDialog = () => {
    setEditingService(null);
    setFormData({ name: '', duration: '', price: '' });
    setIsOpen(true);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl lg:text-4xl font-display font-bold mb-2">
            My <span className="gradient-text">Services</span>
          </h1>
          <p className="text-muted-foreground">Manage your service offerings</p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingService ? 'Edit Service' : 'Add New Service'}
              </DialogTitle>
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

      {/* Services Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {services.map((service, index) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Scissors className="w-5 h-5 text-primary" />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(service)}
                  className="p-2 rounded-lg hover:bg-secondary transition-colors"
                >
                  <Edit2 className="w-4 h-4 text-muted-foreground" />
                </button>
                <button
                  onClick={() => handleDelete(service.id)}
                  className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>
            </div>

            <h3 className="font-semibold mb-2">{service.name}</h3>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{service.duration} min</span>
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-primary font-medium">${service.price}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {services.length === 0 && (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <Scissors className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No services added yet</p>
          <Button onClick={openAddDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Service
          </Button>
        </div>
      )}
    </div>
  );
}
