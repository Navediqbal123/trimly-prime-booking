import { useState, type ChangeEvent, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Edit2,
  Plus,
  Loader2,
  Home,
  RefreshCw,
  Scissors,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import {
  ServiceData,
  addService,
  updateService,
} from '@/lib/api';

interface ServicesTableProps {
  services: ServiceData[];
  onRefresh: () => void;
  loading: boolean;
}

const rowVariants = {
  hidden: {
    opacity: 0,
    x: -20,
  },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
    },
  }),
};

const clayCard =
  'rounded-[30px] border-0 bg-white shadow-[7px_8px_17px_rgba(0,0,0,0.10),-6px_-6px_15px_rgba(255,255,255,0.95)]';

const clayButton =
  'border-0 bg-white text-slate-800 shadow-[5px_6px_12px_rgba(0,0,0,0.09),-4px_-4px_10px_rgba(255,255,255,0.95)] hover:bg-white hover:text-orange-500 hover:shadow-[6px_7px_14px_rgba(0,0,0,0.10),-5px_-5px_12px_rgba(255,255,255,1)]';

export function ServicesTable({
  services,
  onRefresh,
  loading,
}: ServicesTableProps) {
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

  const handleChange = (
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>,
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
          duration: parseInt(formData.duration, 10),
          price: parseFloat(formData.price),
          home_service: formData.home_service,
        },
      );

      if (response.success) {
        toast.success('Service updated successfully');
        setIsOpen(false);
        resetForm();
        onRefresh();
      } else {
        toast.error(
          response.error || 'Failed to update service',
        );
      }
    } else {
      const response = await addService({
        name: formData.name,
        duration: parseInt(formData.duration, 10),
        price: parseFloat(formData.price),
        home_service: formData.home_service,
      });

      if (response.success) {
        toast.success('Service added successfully');
        setIsOpen(false);
        resetForm();
        onRefresh();
      } else {
        toast.error(
          response.error || 'Failed to add service',
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

  const resetForm = () => {
    setEditingService(null);

    setFormData({
      name: '',
      duration: '',
      price: '',
      home_service: false,
    });
  };

  return (
    <Card
      className={`${clayCard} overflow-hidden`}
    >
      {/* Header */}
      <CardHeader
        className="
          flex
          flex-col
          gap-4
          p-4
          sm:flex-row
          sm:items-center
          sm:justify-between
          sm:p-6
        "
      >
        <CardTitle className="flex items-center gap-3">
          <div
            className="
              flex
              h-12
              w-12
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-[#fff0e5]
              text-orange-500
              shadow-[inset_3px_3px_7px_rgba(255,255,255,0.95),inset_-4px_-4px_8px_rgba(0,0,0,0.06),5px_6px_12px_rgba(0,0,0,0.08)]
            "
          >
            <Scissors className="h-6 w-6" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-950 sm:text-2xl">
              My Services
            </h2>

            <p className="mt-0.5 text-xs font-normal text-slate-500 sm:text-sm">
              Manage your shop services
            </p>
          </div>
        </CardTitle>

        <div className="flex w-full gap-3 sm:w-auto">
          {/* Refresh */}
          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={loading}
            aria-label="Refresh"
            className={`
              ${clayButton}
              h-11
              w-11
              shrink-0
              rounded-[18px]
              transition-all
              duration-200
              hover:scale-105
              active:scale-95
              sm:w-auto
              sm:px-4
            `}
          >
            <RefreshCw
              className={`
                h-4
                w-4
                ${loading ? 'animate-spin' : ''}
                sm:mr-2
              `}
            />

            <span className="hidden text-sm sm:inline">
              Refresh
            </span>
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
              <Button
                className="
                  flex-1
                  rounded-[18px]
                  border-0
                  bg-[#ff7417]
                  text-white
                  shadow-[5px_6px_12px_rgba(0,0,0,0.12),inset_2px_2px_4px_rgba(255,255,255,0.25),inset_-3px_-3px_6px_rgba(0,0,0,0.08)]
                  transition-all
                  duration-200
                  hover:bg-[#f66b10]
                  hover:shadow-[6px_7px_14px_rgba(0,0,0,0.14),inset_2px_2px_4px_rgba(255,255,255,0.25),inset_-3px_-3px_6px_rgba(0,0,0,0.08)]
                  hover:scale-[1.02]
                  active:scale-[0.98]
                  sm:flex-none
                  sm:px-5
                "
              >
                <Plus className="mr-2 h-4 w-4" />
                <span className="text-sm">
                  Add Service
                </span>
              </Button>
            </DialogTrigger>

            {/* Dialog */}
            <DialogContent
              className="
                max-w-md
                rounded-[28px]
                border-0
                bg-white
                shadow-[10px_12px_25px_rgba(0,0,0,0.12),-8px_-8px_20px_rgba(255,255,255,0.95)]
              "
            >
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-slate-950">
                  {editingService
                    ? 'Edit Service'
                    : 'Add New Service'}
                </DialogTitle>
              </DialogHeader>

              <form
                onSubmit={handleSubmit}
                className="mt-4 space-y-5"
              >
                {/* Service Name */}
                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Label
                    htmlFor="name"
                    className="font-semibold text-slate-700"
                  >
                    Service Name
                  </Label>

                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Classic Haircut"
                    className="
                      h-11
                      rounded-[16px]
                      border-0
                      bg-white
                      shadow-[inset_2px_2px_5px_rgba(0,0,0,0.06),inset_-2px_-2px_5px_rgba(255,255,255,0.95)]
                      focus-visible:ring-2
                      focus-visible:ring-orange-300
                    "
                  />
                </motion.div>

                {/* Duration */}
                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <Label
                    htmlFor="duration"
                    className="font-semibold text-slate-700"
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
                    className="
                      h-11
                      rounded-[16px]
                      border-0
                      bg-white
                      shadow-[inset_2px_2px_5px_rgba(0,0,0,0.06),inset_-2px_-2px_5px_rgba(255,255,255,0.95)]
                      focus-visible:ring-2
                      focus-visible:ring-orange-300
                    "
                  />
                </motion.div>

                {/* Price */}
                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Label
                    htmlFor="price"
                    className="font-semibold text-slate-700"
                  >
                    Price (₹)
                  </Label>

                  <div className="relative">
                    <span
                      className="
                        absolute
                        left-4
                        top-1/2
                        z-10
                        -translate-y-1/2
                        font-semibold
                        text-orange-500
                      "
                    >
                      ₹
                    </span>

                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="250"
                      className="
                        h-11
                        rounded-[16px]
                        border-0
                        bg-white
                        pl-9
                        shadow-[inset_2px_2px_5px_rgba(0,0,0,0.06),inset_-2px_-2px_5px_rgba(255,255,255,0.95)]
                        focus-visible:ring-2
                        focus-visible:ring-orange-300
                      "
                    />
                  </div>
                </motion.div>

                {/* Home Service */}
                <motion.div
                  className="
                    flex
                    items-center
                    justify-between
                    rounded-[20px]
                    bg-white
                    p-4
                    shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,0.95),4px_5px_10px_rgba(0,0,0,0.05)]
                  "
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="
                        flex
                        h-9
                        w-9
                        items-center
                        justify-center
                        rounded-full
                        bg-[#eafff4]
                        text-[#0dbb69]
                        shadow-[inset_2px_2px_5px_rgba(255,255,255,0.95),inset_-2px_-2px_5px_rgba(0,0,0,0.05),3px_4px_8px_rgba(0,0,0,0.06)]
                      "
                    >
                      <Home className="h-4 w-4" />
                    </div>

                    <Label
                      htmlFor="home_service"
                      className="cursor-pointer font-semibold text-slate-700"
                    >
                      Home Service Available
                    </Label>
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
                </motion.div>

                {/* Submit */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Button
                    type="submit"
                    className="
                      h-12
                      w-full
                      rounded-[18px]
                      border-0
                      bg-[#ff7417]
                      text-white
                      shadow-[5px_6px_12px_rgba(0,0,0,0.12),inset_2px_2px_4px_rgba(255,255,255,0.25),inset_-3px_-3px_6px_rgba(0,0,0,0.08)]
                      transition-all
                      duration-200
                      hover:bg-[#f66b10]
                      hover:scale-[1.01]
                      active:scale-[0.98]
                    "
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {editingService
                          ? 'Updating...'
                          : 'Adding...'}
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

      {/* Table */}
      <CardContent className="px-3 pb-4 sm:px-6 sm:pb-6">
        {services.length > 0 ? (
          <div
            className="
              overflow-x-auto
              rounded-[22px]
              bg-white
              shadow-[inset_2px_2px_6px_rgba(0,0,0,0.04),inset_-2px_-2px_6px_rgba(255,255,255,0.95)]
            "
          >
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-100">
                  <TableHead className="px-4 py-3 text-xs font-bold text-slate-600 sm:text-sm">
                    Service Name
                  </TableHead>

                  <TableHead className="px-4 py-3 text-xs font-bold text-slate-600 sm:text-sm">
                    Price (₹)
                  </TableHead>

                  <TableHead className="px-4 py-3 text-xs font-bold text-slate-600 sm:text-sm">
                    Duration
                  </TableHead>

                  <TableHead className="px-4 py-3 text-xs font-bold text-slate-600 sm:text-sm">
                    Home Service
                  </TableHead>

                  <TableHead className="px-4 py-3 text-right text-xs font-bold text-slate-600 sm:text-sm">
                    Actions
                  </TableHead>
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
                      exit={{
                        opacity: 0,
                        x: -20,
                      }}
                      className="
                        border-b
                        border-slate-100
                        transition-colors
                        hover:bg-orange-50/40
                      "
                    >
                      <TableCell className="px-4 py-3 font-semibold text-slate-800">
                        {service.name}
                      </TableCell>

                      <TableCell className="px-4 py-3 font-bold text-slate-900">
                        ₹{service.price.toLocaleString('en-IN')}
                      </TableCell>

                      <TableCell className="px-4 py-3 text-slate-600">
                        {service.duration} min
                      </TableCell>

                      <TableCell className="px-4 py-3">
                        {service.home_service ? (
                          <motion.span
                            className="
                              inline-flex
                              items-center
                              gap-1.5
                              rounded-full
                              bg-[#eafff4]
                              px-3
                              py-1.5
                              text-xs
                              font-semibold
                              text-[#0dbb69]
                              shadow-[inset_2px_2px_4px_rgba(255,255,255,0.95),inset_-2px_-2px_4px_rgba(0,0,0,0.04)]
                            "
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{
                              type: 'spring',
                              stiffness: 500,
                            }}
                          >
                            <Check className="h-3.5 w-3.5" />
                            Yes
                          </motion.span>
                        ) : (
                          <span
                            className="
                              inline-flex
                              rounded-full
                              bg-slate-100
                              px-3
                              py-1.5
                              text-xs
                              font-medium
                              text-slate-500
                            "
                          >
                            No
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(service)}
                          aria-label={`Edit ${service.name}`}
                          className="
                            h-9
                            w-9
                            rounded-full
                            border-0
                            bg-white
                            p-0
                            text-slate-700
                            shadow-[4px_5px_10px_rgba(0,0,0,0.08),-3px_-3px_8px_rgba(255,255,255,0.95)]
                            transition-all
                            duration-200
                            hover:bg-white
                            hover:text-orange-500
                            hover:scale-110
                            active:scale-95
                          "
                        >
                          <Edit2 className="h-4 w-4" />
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
            className="
              flex
              flex-col
              items-center
              justify-center
              py-14
              text-center
              text-slate-500
            "
          >
            <div
              className="
                mb-4
                flex
                h-16
                w-16
                items-center
                justify-center
                rounded-full
                bg-[#fff0e5]
                text-orange-300
                shadow-[inset_3px_3px_7px_rgba(255,255,255,0.95),inset_-4px_-4px_8px_rgba(0,0,0,0.05),5px_6px_12px_rgba(0,0,0,0.07)]
              "
            >
              <Scissors className="h-8 w-8" />
            </div>

            <p className="font-semibold text-slate-700">
              No services yet.
            </p>

            <p className="mt-1 px-5 text-sm text-slate-500">
              Add your first service to start accepting
              bookings.
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
