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

const clayCard =
  'shadow-[7px_8px_17px_rgba(0,0,0,0.10),-6px_-6px_15px_rgba(255,255,255,0.95)]';

const orangeClay =
  'bg-[#ff7417] text-white shadow-[6px_7px_14px_rgba(255,116,23,0.28),inset_2px_2px_5px_rgba(255,255,255,0.30),inset_-3px_-3px_6px_rgba(190,70,0,0.25)]';

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.duration ||
      !formData.price
    ) {
      toast.error('Please fill in all fields');
      return;
    }

    setSubmitting(true);

    if (editingService) {
      const response = await updateService(
        editingService.id,
        {
          name: formData.name,
          duration: parseInt(formData.duration),
          price: parseFloat(formData.price),
          home_service: formData.home_service,
        }
      );

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
        toast.error(
          response.error || 'Failed to update service'
        );
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
        toast.error(
          response.error || 'Failed to add service'
        );
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
        old
          ? old.filter((s) => s.id !== id)
          : []
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
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-white">
        <Loader2 className="h-9 w-9 animate-spin text-orange-500" />

        <p className="mt-4 text-sm font-medium text-slate-500">
          Loading services...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-full overflow-hidden bg-white px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-6">
          <h1 className="whitespace-nowrap text-[32px] font-black leading-none tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
            My{' '}
            <span className="text-[#ff7417] drop-shadow-[2px_3px_1px_rgba(255,116,23,0.22)]">
              Services
            </span>
          </h1>

          <p className="mt-2 whitespace-nowrap text-sm font-semibold text-slate-500 sm:text-lg">
            Manage your service offerings
          </p>

          {/* Full Width Buttons */}
          <div className="mt-5 flex w-full flex-col gap-3">

            {/* Refresh */}
            <motion.div
              whileHover={{
                y: -1,
                scale: 1.01,
              }}
              whileTap={{
                y: 2,
                scale: 0.985,
              }}
              onClick={() => {
                if (!isRefetching) {
                  void refetch();
                }
              }}
              className={`flex h-14 w-full cursor-pointer items-center justify-center gap-3 rounded-[22px] text-base font-extrabold transition-all duration-200 sm:h-16 sm:text-xl ${orangeClay} ${
                isRefetching
                  ? 'cursor-not-allowed opacity-80'
                  : ''
              }`}
            >
              <RefreshCw
                className={`h-6 w-6 sm:h-7 sm:w-7 ${
                  isRefetching
                    ? 'animate-spin'
                    : ''
                }`}
              />

              {isRefetching
                ? 'Refreshing...'
                : 'Refresh'}
            </motion.div>

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
                <motion.div
                  whileHover={{
                    y: -1,
                    scale: 1.01,
                  }}
                  whileTap={{
                    y: 2,
                    scale: 0.985,
                  }}
                  className={`flex h-14 w-full cursor-pointer items-center justify-center gap-3 rounded-[22px] text-base font-extrabold transition-all duration-200 sm:h-16 sm:text-xl ${orangeClay}`}
                >
                  <Plus className="h-6 w-6 sm:h-7 sm:w-7" />
                  Add Service
                </motion.div>
              </DialogTrigger>

              <DialogContent className="w-[calc(100%-24px)] max-w-md rounded-[28px] border border-slate-100 bg-white p-5 shadow-[12px_14px_28px_rgba(0,0,0,0.12),-8px_-8px_20px_rgba(255,255,255,0.95)] sm:p-6">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black text-slate-900">
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
                      className="text-sm font-bold text-slate-700"
                    >
                      Service Name
                    </Label>

                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g., Classic Haircut"
                      className="h-11 rounded-[18px] border-slate-200 bg-white shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,0.95)] focus-visible:ring-orange-400"
                    />
                  </div>

                  {/* Duration */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="duration"
                      className="text-sm font-bold text-slate-700"
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
                      className="h-11 rounded-[18px] border-slate-200 bg-white shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,0.95)] focus-visible:ring-orange-400"
                    />
                  </div>

                  {/* Price */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="price"
                      className="text-sm font-bold text-slate-700"
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
                      className="h-11 rounded-[18px] border-slate-200 bg-white shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,0.95)] focus-visible:ring-orange-400"
                    />
                  </div>

                  {/* Home Service */}
                  <div
                    className="flex items-center justify-between rounded-[22px] border border-slate-100 bg-[#fffaf5] p-4"
                    style={{
                      boxShadow:
                        '5px 6px 13px rgba(0,0,0,0.07), -3px -3px 9px rgba(255,255,255,0.95)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff0e5]"
                        style={{
                          boxShadow:
                            '3px 4px 8px rgba(0,0,0,0.07), -2px -2px 6px rgba(255,255,255,0.95)',
                        }}
                      >
                        <Home className="h-5 w-5 text-orange-500" />
                      </div>

                      <div>
                        <Label
                          htmlFor="home_service"
                          className="cursor-pointer text-sm font-bold text-slate-800"
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
                    className={`h-12 w-full rounded-[20px] font-extrabold transition-all duration-200 active:translate-y-[2px] active:scale-[0.97] ${orangeClay}`}
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
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-orange-500" />

            <span className="text-lg font-black text-slate-900 sm:text-xl">
              Your Services
            </span>

            <span
              className="rounded-full bg-[#fff0e5] px-3 py-1.5 text-sm font-extrabold text-slate-900"
              style={{
                boxShadow:
                  '3px 4px 8px rgba(0,0,0,0.07), -2px -2px 6px rgba(255,255,255,0.95)',
              }}
            >
              {services.length}
            </span>
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
                initial={{
                  opacity: 0,
                  y: 18,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.35,
                  delay: index * 0.04,
                }}
                className={`rounded-[30px] border border-slate-100 bg-white p-5 transition-all duration-200 ${clayCard}`}
              >
                {/* Top */}
                <div className="mb-5 flex items-start justify-between">
                  {/* Scissors Icon */}
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-[20px] border border-orange-100 bg-[#fff3e8]"
                    style={{
                      boxShadow:
                        '5px 6px 12px rgba(0,0,0,0.08), -4px -4px 10px rgba(255,255,255,0.95), inset 2px 2px 4px rgba(255,255,255,0.60)',
                    }}
                  >
                    <Scissors className="h-7 w-7 text-orange-500" />
                  </div>

                  {/* Edit / Delete */}
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() =>
                        handleEdit(service)
                      }
                      className="h-11 w-11 rounded-[17px] bg-[#f2f6ff] text-slate-600 shadow-[4px_5px_10px_rgba(0,0,0,0.08),-3px_-3px_8px_rgba(255,255,255,0.95)] hover:bg-[#e9f0ff] hover:text-slate-700"
                    >
                      <Edit2 className="h-5 w-5" />
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() =>
                        handleDelete(service.id)
                      }
                      className="h-11 w-11 rounded-[17px] bg-[#fff0f2] text-red-500 shadow-[4px_5px_10px_rgba(0,0,0,0.08),-3px_-3px_8px_rgba(255,255,255,0.95)] hover:bg-[#ffe6e9] hover:text-red-600"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                {/* Service Name */}
                <div className="mb-5 flex min-h-[38px] items-center gap-2">
                  <h3 className="truncate text-2xl font-black tracking-tight text-slate-950">
                    {service.name}
                  </h3>

                  {service.home_service && (
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1.5 text-[10px] font-extrabold text-emerald-600 shadow-[2px_3px_7px_rgba(0,0,0,0.06)]">
                      <Home className="h-3 w-3" />
                      HOME
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Duration */}
                  <div
                    className="rounded-[22px] border border-blue-100 bg-[#f6f9ff] p-4"
                    style={{
                      boxShadow:
                        '5px 6px 12px rgba(0,0,0,0.07), -3px -3px 9px rgba(255,255,255,0.95), inset 2px 2px 4px rgba(255,255,255,0.65)',
                    }}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-orange-500" />

                      <span className="text-xs font-bold text-slate-500 sm:text-sm">
                        Duration
                      </span>
                    </div>

                    <p className="text-xl font-black text-slate-950 sm:text-2xl">
                      {service.duration} min
                    </p>
                  </div>

                  {/* Price */}
                  <div
                    className="rounded-[22px] border border-orange-100 bg-[#fff9f2] p-4"
                    style={{
                      boxShadow:
                        '5px 6px 12px rgba(0,0,0,0.07), -3px -3px 9px rgba(255,255,255,0.95), inset 2px 2px 4px rgba(255,255,255,0.65)',
                    }}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <IndianRupee className="h-5 w-5 text-orange-500" />

                      <span className="text-xs font-bold text-slate-500 sm:text-sm">
                        Price
                      </span>
                    </div>

                    <p className="text-xl font-black text-slate-950 sm:text-2xl">
                      ₹{service.price}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          /* Empty State */
          <motion.div
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className={`rounded-[30px] border border-slate-100 bg-white px-5 py-14 text-center ${clayCard}`}
          >
            <div
              className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#fff3e8]"
              style={{
                boxShadow:
                  '5px 6px 12px rgba(0,0,0,0.08), -4px -4px 10px rgba(255,255,255,0.95)',
              }}
            >
              <AlertCircle className="h-7 w-7 text-orange-400" />
            </div>

            <h3 className="mb-2 text-xl font-black text-slate-900">
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
                <Button
                  className={`h-12 rounded-[20px] px-6 font-extrabold ${orangeClay}`}
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Add Your First Service
                </Button>
              </DialogTrigger>

              <DialogContent className="w-[calc(100%-24px)] max-w-md rounded-[28px] border border-slate-100 bg-white p-5 shadow-[12px_14px_28px_rgba(0,0,0,0.12),-8px_-8px_20px_rgba(255,255,255,0.95)] sm:p-6">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black text-slate-900">
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
                      className="text-sm font-bold text-slate-700"
                    >
                      Service Name
                    </Label>

                    <Input
                      id="name-empty"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g., Classic Haircut"
                      className="h-11 rounded-[18px] border-slate-200 bg-white shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,0.95)] focus-visible:ring-orange-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="duration-empty"
                      className="text-sm font-bold text-slate-700"
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
                      className="h-11 rounded-[18px] border-slate-200 bg-white shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,0.95)] focus-visible:ring-orange-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="price-empty"
                      className="text-sm font-bold text-slate-700"
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
                      className="h-11 rounded-[18px] border-slate-200 bg-white shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,0.95)] focus-visible:ring-orange-400"
                    />
                  </div>

                  <div
                    className="flex items-center justify-between rounded-[22px] border border-slate-100 bg-[#fffaf5] p-4"
                    style={{
                      boxShadow:
                        '5px 6px 13px rgba(0,0,0,0.07), -3px -3px 9px rgba(255,255,255,0.95)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff0e5]">
                        <Home className="h-5 w-5 text-orange-500" />
                      </div>

                      <div>
                        <Label
                          htmlFor="home_service-empty"
                          className="cursor-pointer text-sm font-bold text-slate-800"
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
                    className={`h-12 w-full rounded-[20px] font-extrabold ${orangeClay}`}
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
          </motion.div>
        )}
      </div>
    </div>
  );
}