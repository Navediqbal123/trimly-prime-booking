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
        return Array.isArray(response.data)
          ? response.data
          : [];
      }

      return [];
    },
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({
      queryKey: ['myServices'],
    });

    queryClient.invalidateQueries({
      queryKey: ['barberServices'],
    });

    queryClient.invalidateQueries({
      queryKey: ['approvedBarbers'],
    });
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
        toast.success(
          'Service updated successfully'
        );

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
          response.error ||
            'Failed to update service'
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
        toast.success(
          'Service added successfully'
        );

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
          response.error ||
            'Failed to add service'
        );
      }
    }

    setSubmitting(false);
  };

  const handleEdit = (
    service: ServiceData
  ) => {
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

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center bg-white">
        <div className="flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[#fff0e5] shadow-[5px_6px_12px_rgba(0,0,0,0.10),-4px_-4px_10px_rgba(255,255,255,0.95)]">
            <Loader2 className="h-7 w-7 animate-spin text-[#ff7417]" />
          </div>

          <p className="mt-4 text-sm font-semibold text-gray-500">
            Loading services...
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 14,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="w-full min-w-0 bg-white pb-10"
    >
      <div className="w-full min-w-0 space-y-5">

        {/* ================= HEADER ================= */}

        <div className="w-full min-w-0">
          <h1 className="flex items-center gap-2 text-[36px] font-black leading-tight tracking-[-1.5px] text-black sm:text-4xl lg:text-5xl">
            <span>My</span>

            <span className="text-[#ff7417]">
              Services
            </span>
          </h1>

          <p className="mt-2 w-full whitespace-nowrap text-[13px] font-semibold text-gray-500 sm:text-base">
            Manage your service offerings
          </p>
        </div>

        {/* ================= REFRESH ================= */}

        <Button
          type="button"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="flex h-11 w-full rounded-[18px] bg-[#ff7417] font-bold text-white shadow-[6px_7px_14px_rgba(255,116,23,0.28),inset_2px_2px_5px_rgba(255,255,255,0.30),inset_-3px_-3px_6px_rgba(190,70,0,0.25)] hover:bg-[#f56d10]"
        >
          <RefreshCw
            className={`mr-2 h-5 w-5 ${
              isRefetching
                ? 'animate-spin'
                : ''
            }`}
          />

          {isRefetching
            ? 'Refreshing...'
            : 'Refresh'}
        </Button>

        {/* ================= ADD SERVICE ================= */}

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
              type="button"
              className="flex h-11 w-full rounded-[18px] bg-[#ff7417] font-bold text-white shadow-[6px_7px_14px_rgba(255,116,23,0.28),inset_2px_2px_5px_rgba(255,255,255,0.30),inset_-3px_-3px_6px_rgba(190,70,0,0.25)] hover:bg-[#f56d10]"
            >
              <Plus className="mr-2 h-5 w-5" />
              Add Service
            </Button>
          </DialogTrigger>

          {/* ================= DIALOG ================= */}

          <DialogContent className="w-[calc(100%-24px)] max-w-md rounded-[28px] border-0 bg-white p-5 shadow-[10px_12px_25px_rgba(0,0,0,0.12),-8px_-8px_18px_rgba(255,255,255,0.95)] sm:p-6">

            <DialogHeader>
              <DialogTitle className="text-xl font-black text-black">
                {editingService
                  ? 'Edit Service'
                  : 'Add New Service'}
              </DialogTitle>
            </DialogHeader>

            <form
              onSubmit={handleSubmit}
              className="mt-4 space-y-4"
            >

              {/* SERVICE NAME */}

              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="text-sm font-bold text-gray-700"
                >
                  Service Name
                </Label>

                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Classic Haircut"
                  className="h-11 rounded-[16px] border-0 bg-white shadow-[inset_3px_3px_7px_rgba(0,0,0,0.06),inset_-3px_-3px_7px_rgba(255,255,255,0.95)] focus-visible:ring-2 focus-visible:ring-[#ff7417]"
                />
              </div>

              {/* DURATION */}

              <div className="space-y-2">
                <Label
                  htmlFor="duration"
                  className="text-sm font-bold text-gray-700"
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
                  className="h-11 rounded-[16px] border-0 bg-white shadow-[inset_3px_3px_7px_rgba(0,0,0,0.06),inset_-3px_-3px_7px_rgba(255,255,255,0.95)] focus-visible:ring-2 focus-visible:ring-[#ff7417]"
                />
              </div>

              {/* PRICE */}

              <div className="space-y-2">
                <Label
                  htmlFor="price"
                  className="text-sm font-bold text-gray-700"
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
                  className="h-11 rounded-[16px] border-0 bg-white shadow-[inset_3px_3px_7px_rgba(0,0,0,0.06),inset_-3px_-3px_7px_rgba(255,255,255,0.95)] focus-visible:ring-2 focus-visible:ring-[#ff7417]"
                />
              </div>

              {/* HOME SERVICE */}

              <div className="flex items-center justify-between rounded-[22px] bg-[#fff8f2] p-4 shadow-[5px_6px_12px_rgba(0,0,0,0.08),inset_2px_2px_5px_rgba(255,255,255,0.95)]">

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px] bg-[#ffe4d1] text-[#ff7417] shadow-[4px_5px_9px_rgba(0,0,0,0.08),inset_2px_2px_4px_rgba(255,255,255,0.8)]">
                    <Home className="h-5 w-5" />
                  </div>

                  <div>
                    <Label
                      htmlFor="home_service"
                      className="cursor-pointer text-sm font-bold text-black"
                    >
                      Home Service Available
                    </Label>

                    <p className="mt-0.5 text-xs text-gray-500">
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

              {/* SAVE */}

              <Button
                type="submit"
                disabled={submitting}
                className="h-11 w-full rounded-[18px] bg-[#ff7417] font-bold text-white shadow-[6px_7px_14px_rgba(255,116,23,0.28),inset_2px_2px_5px_rgba(255,255,255,0.30),inset_-3px_-3px_6px_rgba(190,70,0,0.25)] hover:bg-[#f56d10]"
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

        {/* ================= SERVICE COUNT ================= */}

        {services.length > 0 && (
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-[14px] bg-[#fff0e5] text-[#ff7417] shadow-[4px_5px_9px_rgba(0,0,0,0.08),inset_2px_2px_4px_rgba(255,255,255,0.9)]">
                <Sparkles className="h-4 w-4" />
              </div>

              <span className="text-sm font-bold text-gray-700">
                Your Services
              </span>

              <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-[#ffe1ce] px-2 text-xs font-black text-[#ff7417] shadow-[3px_4px_7px_rgba(0,0,0,0.07)]">
                {services.length}
              </span>
            </div>
          </div>
        )}

        {/* ================= SERVICES ================= */}

        {services.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {services.map(
              (service, index) => (
                <motion.div
                  key={service.id}
                  initial={{
                    opacity: 0,
                    y: 15,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.04,
                  }}
                  className="w-full min-w-0 overflow-hidden rounded-[28px] border-0 bg-white p-5 shadow-[7px_8px_17px_rgba(0,0,0,0.10),-6px_-6px_15px_rgba(255,255,255,0.95)] transition-transform duration-300 hover:-translate-y-1"
                >
                  {/* TOP */}

                  <div className="flex items-start justify-between gap-3">

                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-[#ffe1ce] text-[#ff7417] shadow-[5px_6px_11px_rgba(255,116,23,0.16),inset_2px_2px_5px_rgba(255,255,255,0.9)]">
                      <Scissors className="h-6 w-6" />
                    </div>

                    <div className="flex gap-2">

                      {/* EDIT */}

                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          handleEdit(service)
                        }
                        className="h-10 w-10 rounded-[15px] bg-[#e7f0ff] text-[#397de0] shadow-[4px_5px_9px_rgba(0,0,0,0.09),inset_2px_2px_4px_rgba(255,255,255,0.9)] hover:bg-[#dceaff] hover:text-[#286bd0]"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>

                      {/* DELETE */}

                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          handleDelete(service.id)
                        }
                        className="h-10 w-10 rounded-[15px] bg-[#ffe2e7] text-[#e34f69] shadow-[4px_5px_9px_rgba(0,0,0,0.09),inset_2px_2px_4px_rgba(255,255,255,0.9)] hover:bg-[#ffd6dd] hover:text-[#d93d58]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>

                    </div>
                  </div>

                  {/* SERVICE NAME */}

                  <div className="mt-5 flex min-h-[34px] items-center gap-2">

                    <h3 className="min-w-0 flex-1 truncate text-lg font-black text-black">
                      {service.name}
                    </h3>

                    {service.home_service && (
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#dff8ee] px-2.5 py-1 text-[10px] font-black text-[#15966a] shadow-[3px_4px_7px_rgba(0,0,0,0.07)]">
                        <Home className="h-3 w-3" />
                        HOME
                      </span>
                    )}

                  </div>

                  {/* DETAILS */}

                  <div className="mt-4 grid grid-cols-2 gap-3">

                    {/* DURATION */}

                    <div className="rounded-[20px] bg-[#f4f7fa] p-3.5 shadow-[inset_3px_3px_7px_rgba(0,0,0,0.05),inset_-3px_-3px_7px_rgba(255,255,255,0.95)]">

                      <div className="mb-1.5 flex items-center gap-1.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-[10px] bg-[#e0edff] text-[#3c82e5] shadow-[3px_4px_7px_rgba(0,0,0,0.07)]">
                          <Clock className="h-3.5 w-3.5" />
                        </div>

                        <span className="text-[11px] font-bold text-gray-500">
                          Duration
                        </span>
                      </div>

                      <p className="text-sm font-black text-black">
                        {service.duration} min
                      </p>

                    </div>

                    {/* PRICE */}

                    <div className="rounded-[20px] bg-[#fff4eb] p-3.5 shadow-[inset_3px_3px_7px_rgba(0,0,0,0.05),inset_-3px_-3px_7px_rgba(255,255,255,0.95)]">

                      <div className="mb-1.5 flex items-center gap-1.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-[10px] bg-[#ffe0cb] text-[#ff7417] shadow-[3px_4px_7px_rgba(0,0,0,0.07)]">
                          <IndianRupee className="h-3.5 w-3.5" />
                        </div>

                        <span className="text-[11px] font-bold text-gray-500">
                          Price
                        </span>
                      </div>

                      <p className="text-sm font-black text-[#ff7417]">
                        ₹{service.price}
                      </p>

                    </div>

                  </div>
                </motion.div>
              )
            )}
          </motion.div>
        ) : (
          /* ================= EMPTY STATE ================= */

          <motion.div
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="w-full rounded-[28px] bg-white px-5 py-14 text-center shadow-[7px_8px_17px_rgba(0,0,0,0.10),-6px_-6px_15px_rgba(255,255,255,0.95)]"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#fff0e5] text-[#ff7417] shadow-[5px_6px_12px_rgba(0,0,0,0.10),inset_2px_2px_5px_rgba(255,255,255,0.9)]">
              <AlertCircle className="h-7 w-7" />
            </div>

            <h3 className="mt-5 text-xl font-black text-black">
              No Services Yet
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              Add your first service to start accepting bookings.
              Click the "Add Service" button above.
            </p>

            <Button
              type="button"
              onClick={() => setIsOpen(true)}
              className="mt-6 h-11 rounded-[18px] bg-[#ff7417] px-6 font-bold text-white shadow-[6px_7px_14px_rgba(255,116,23,0.28),inset_2px_2px_5px_rgba(255,255,255,0.30),inset_-3px_-3px_6px_rgba(190,70,0,0.25)] hover:bg-[#f56d10]"
            >
              <Plus className="mr-2 h-5 w-5" />
              Add Your First Service
            </Button>
          </motion.div>
        )}

      </div>
    </motion.div>
  );
}