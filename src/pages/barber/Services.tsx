import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Plus,
  Edit2,
  Trash2,
  Clock,
  IndianRupee,
  Scissors,
  Loader2,
  Home,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

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
import {
  addService,
  updateService,
  getMyServices,
  ServiceData,
} from '@/lib/api';

export default function Services() {
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);
  const [editingService, setEditingService] =
    useState<ServiceData | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    duration: '',
    price: '',
    home_service: false,
  });

  const {
    data: services = [],
    isLoading: loading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['myServices'],
    queryFn: async () => {
      const response = await getMyServices();

      if (response.success && response.data) {
        return Array.isArray(response.data) ? response.data : [];
      }

      return [];
    },
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['myServices'] });
    queryClient.invalidateQueries({ queryKey: ['barberServices'] });
    queryClient.invalidateQueries({ queryKey: ['approvedBarbers'] });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
        setEditingService(null);

        setFormData({
          name: '',
          duration: '',
          price: '',
          home_service: false,
        });

        invalidateAll();
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

        setFormData({
          name: '',
          duration: '',
          price: '',
          home_service: false,
        });

        invalidateAll();
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

  const handleDelete = (id: string) => {
    queryClient.setQueryData(
      ['myServices'],
      (old: ServiceData[] | undefined) =>
        old ? old.filter((s) => s.id !== id) : []
    );

    toast.success('Service removed locally');
  };

  const resetForm = () => {
    setEditingService(null);

    setFormData({
      name: '',
      duration: '',
      price: '',
      home_service: false,
    });
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-orange-200/40 blur-xl" />
          <Loader2 className="relative w-9 h-9 animate-spin text-orange-500" />
        </div>

        <p className="mt-4 text-sm font-medium text-slate-500">
          Loading services...
        </p>
      </div>
    );
  }

  return (
    <div className="relative min-h-full overflow-hidden bg-[#fffdfa] px-4 py-5 sm:px-6 lg:px-8">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-orange-200/30 blur-3xl" />
      <div className="pointer-events-none absolute top-72 -left-32 h-64 w-64 rounded-full bg-orange-100/35 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 shadow-[0_8px_25px_rgba(249,115,22,0.12)] ring-1 ring-orange-100 backdrop-blur-xl">
                <Scissors className="h-4 w-4 text-orange-500" />
              </div>

              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-500">
                Barber Hub
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              My{' '}
              <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                Services
              </span>
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage your service offerings
            </p>
          </div>

          <div className="flex w-full gap-2 sm:w-auto">
            {/* Refresh */}
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="h-10 flex-1 rounded-xl border-orange-100 bg-white/70 text-slate-700 shadow-sm backdrop-blur-xl hover:bg-orange-50 hover:text-orange-600 sm:flex-none"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${
                  isRefetching ? 'animate-spin' : ''
                }`}
              />

              <span className="hidden sm:inline">
                {isRefetching ? 'Refreshing...' : 'Refresh'}
              </span>

              <span className="sm:hidden">Refresh</span>
            </Button>

            {/* Add Service */}
            <Dialog
              open={isOpen}
              onOpenChange={(open) => {
                setIsOpen(open);

                if (!open) {
                  resetForm();
                }
              }}
            >
              <DialogTrigger asChild>
                <Button className="h-10 flex-1 rounded-xl border-0 bg-gradient-to-r from-orange-500 to-amber-500 px-4 font-semibold text-white shadow-[0_8px_24px_rgba(249,115,22,0.25)] hover:from-orange-600 hover:to-amber-600 sm:flex-none">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Service
                </Button>
              </DialogTrigger>

              <DialogContent className="w-[calc(100%-24px)] max-w-md rounded-3xl border border-orange-100/70 bg-white/95 p-5 shadow-2xl backdrop-blur-2xl sm:p-6">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-slate-900">
                    {editingService
                      ? 'Edit Service'
                      : 'Add New Service'}
                  </DialogTitle>
                </DialogHeader>

                <form
                  onSubmit={handleSubmit}
                  className="mt-4 space-y-4"
                >
                  {/* Service Name */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="name"
                      className="text-sm font-semibold text-slate-700"
                    >
                      Service Name
                    </Label>

                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g., Classic Haircut"
                      className="h-11 rounded-xl border-orange-100 bg-orange-50/30 focus-visible:ring-orange-400"
                    />
                  </div>

                  {/* Duration */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="duration"
                      className="text-sm font-semibold text-slate-700"
                    >
                      Duration (minutes)
                    </Label>

                    <Input
                      id="duration"
                      name="duration"
                      type="number"
                      value={formData.duration}
                      onChange={handleChange}
                      placeholder="30"
                      className="h-11 rounded-xl border-orange-100 bg-orange-50/30 focus-visible:ring-orange-400"
                    />
                  </div>

                  {/* Price */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="price"
                      className="text-sm font-semibold text-slate-700"
                    >
                      Price (₹)
                    </Label>

                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="250"
                      className="h-11 rounded-xl border-orange-100 bg-orange-50/30 focus-visible:ring-orange-400"
                    />
                  </div>

                  {/* Home Service */}
                  <div className="flex items-center justify-between rounded-2xl border border-orange-100 bg-orange-50/40 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm">
                        <Home className="h-4 w-4 text-orange-500" />
                      </div>

                      <div>
                        <Label
                          htmlFor="home_service"
                          className="cursor-pointer text-sm font-semibold text-slate-800"
                        >
                          Home Service Available
                        </Label>

                        <p className="mt-0.5 text-xs text-slate-500">
                          Offer this service at customer's location
                        </p>
                      </div>
                    </div>

                    <Switch
                      id="home_service"
                      checked={formData.home_service}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          home_service: checked,
                        }))
                      }
                    />
                  </div>

                  <Button
                    type="submit"
                    className="h-11 w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 font-semibold text-white shadow-[0_8px_22px_rgba(249,115,22,0.22)] hover:from-orange-600 hover:to-amber-600"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
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
        </div>

        {/* Service Count */}
        {services.length > 0 && (
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-orange-500" />

              <span className="text-sm font-semibold text-slate-700">
                Your Services
              </span>

              <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-600 ring-1 ring-orange-100">
                {services.length}
              </span>
            </div>
          </div>
        )}

        {/* Services */}
        {services.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {services.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.35,
                  delay: index * 0.04,
                }}
                className="group relative overflow-hidden rounded-3xl border border-orange-100/80 bg-white/75 p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(249,115,22,0.12)]"
              >
                {/* Card glow */}
                <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-orange-200/25 blur-2xl transition-all duration-300 group-hover:bg-orange-300/35" />

                <div className="relative">
                  {/* Top */}
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50 shadow-sm">
                      <Scissors className="h-5 w-5 text-orange-500" />
                    </div>

                    <div className="flex gap-1.5">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(service)}
                        className="h-9 w-9 rounded-xl text-slate-500 hover:bg-orange-50 hover:text-orange-600"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(service.id)}
                        className="h-9 w-9 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Service name */}
                  <div className="mb-4 flex min-h-[32px] items-center gap-2">
                    <h3 className="truncate text-lg font-bold text-slate-900">
                      {service.name}
                    </h3>

                    {service.home_service && (
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-600 ring-1 ring-emerald-100">
                        <Home className="h-3 w-3" />
                        HOME
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                      <div className="mb-1 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-orange-500" />

                        <span className="text-[11px] font-medium text-slate-400">
                          Duration
                        </span>
                      </div>

                      <p className="text-sm font-bold text-slate-800">
                        {service.duration} min
                      </p>
                    </div>

                    <div className="rounded-2xl border border-orange-100/80 bg-orange-50/45 p-3">
                      <div className="mb-1 flex items-center gap-1.5">
                        <IndianRupee className="h-3.5 w-3.5 text-orange-500" />

                        <span className="text-[11px] font-medium text-slate-400">
                          Price
                        </span>
                      </div>

                      <p className="text-sm font-bold text-orange-600">
                        ₹{service.price}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl border border-orange-100/80 bg-white/70 px-5 py-14 text-center shadow-[0_12px_40px_rgba(15,23,42,0.05)] backdrop-blur-xl"
          >
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-200/25 blur-3xl" />

            <div className="relative">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50 shadow-sm">
                <AlertCircle className="h-7 w-7 text-orange-400" />
              </div>

              <h3 className="mb-2 text-xl font-bold text-slate-900">
                No Services Yet
              </h3>

              <p className="mx-auto mb-6 max-w-md text-sm leading-6 text-slate-500">
                Add your first service to start accepting bookings.
                Click the "Add Service" button above.
              </p>

              <Dialog
                open={isOpen}
                onOpenChange={(open) => {
                  setIsOpen(open);

                  if (!open) {
                    resetForm();
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 font-semibold text-white shadow-[0_8px_22px_rgba(249,115,22,0.22)] hover:from-orange-600 hover:to-amber-600">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Service
                  </Button>
                </DialogTrigger>

                <DialogContent className="w-[calc(100%-24px)] max-w-md rounded-3xl border border-orange-100/70 bg-white/95 p-5 shadow-2xl backdrop-blur-2xl sm:p-6">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-slate-900">
                      Add New Service
                    </DialogTitle>
                  </DialogHeader>

                  <form
                    onSubmit={handleSubmit}
                    className="mt-4 space-y-4"
                  >
                    <div className="space-y-2">
                      <Label
                        htmlFor="name-empty"
                        className="text-sm font-semibold text-slate-700"
                      >
                        Service Name
                      </Label>

                      <Input
                        id="name-empty"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g., Classic Haircut"
                        className="h-11 rounded-xl border-orange-100 bg-orange-50/30 focus-visible:ring-orange-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="duration-empty"
                        className="text-sm font-semibold text-slate-700"
                      >
                        Duration (minutes)
                      </Label>

                      <Input
                        id="duration-empty"
                        name="duration"
                        type="number"
                        value={formData.duration}
                        onChange={handleChange}
                        placeholder="30"
                        className="h-11 rounded-xl border-orange-100 bg-orange-50/30 focus-visible:ring-orange-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="price-empty"
                        className="text-sm font-semibold text-slate-700"
                      >
                        Price (₹)
                      </Label>

                      <Input
                        id="price-empty"
                        name="price"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={handleChange}
                        placeholder="250"
                        className="h-11 rounded-xl border-orange-100 bg-orange-50/30 focus-visible:ring-orange-400"
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border border-orange-100 bg-orange-50/40 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm">
                          <Home className="h-4 w-4 text-orange-500" />
                        </div>

                        <div>
                          <Label
                            htmlFor="home_service-empty"
                            className="cursor-pointer text-sm font-semibold text-slate-800"
                          >
                            Home Service Available
                          </Label>

                          <p className="mt-0.5 text-xs text-slate-500">
                            Offer this service at customer's location
                          </p>
                        </div>
                      </div>

                      <Switch
                        id="home_service-empty"
                        checked={formData.home_service}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({
                            ...prev,
                            home_service: checked,
                          }))
                        }
                      />
                    </div>

                    <Button
                      type="submit"
                      className="h-11 w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 font-semibold text-white shadow-[0_8px_22px_rgba(249,115,22,0.22)] hover:from-orange-600 hover:to-amber-600"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Add Service'
                      )}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}