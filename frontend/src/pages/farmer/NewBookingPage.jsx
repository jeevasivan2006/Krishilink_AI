import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Calendar, Weight, Truck, Leaf,
  StickyNote, Sparkles, ArrowLeft, CheckCircle2,
  Loader2, AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { farmerBookTransport, getEstimatedCost } from '@/api/farmer.api';
import { getAiRecommendation } from '@/api/ai.api';
import { queryKeys, ROUTES, VEHICLE_TYPES, PRODUCE_TYPES } from '@/constants';
import { usePageTitle, useDebounce } from '@/hooks';
import { formatCurrency } from '@/utils/formatters';
import { zRequiredString, zPositiveNumber } from '@/utils/validators';
import PageContainer from '@/layouts/PageContainer';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { cn } from '@/utils';

/* ── Zod schema ─────────────────────────────────────────────── */
const newBookingSchema = z.object({
  start_location:  zRequiredString('Pickup location'),
  end_location:    zRequiredString('Drop location'),
  scheduled_at:    zRequiredString('Scheduled date'),
  cargo_weight_kg: z.coerce
    .number({ invalid_type_error: 'Enter a valid weight' })
    .positive('Weight must be greater than 0')
    .max(50000, 'Weight cannot exceed 50,000 kg'),
  vehicle_type:    z.string().optional(),
  produce_type:    z.string().optional(),
  wants_shared:    z.boolean().default(true),
  notes:           z.string().max(1000).optional(),
});

/* ── Produce options ────────────────────────────────────────── */
const PRODUCE_OPTIONS = PRODUCE_TYPES.map((p) => ({ value: p.toLowerCase(), label: p }));
const VEHICLE_OPTIONS = VEHICLE_TYPES;

export default function NewBookingPage() {
  usePageTitle('New Booking');
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [costEstimate,    setCostEstimate]    = useState(null);
  const [aiSuggestion,    setAiSuggestion]    = useState(null);
  const [estimating,      setEstimating]      = useState(false);
  const [aiLoading,       setAiLoading]       = useState(false);
  const [submitSuccess,   setSubmitSuccess]   = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(newBookingSchema),
    defaultValues: {
      wants_shared: true,
      cargo_weight_kg: '',
    },
  });

  /* Watch fields needed for estimate / AI */
  const [watchStart, watchEnd, watchWeight, watchVehicle, watchProduce, watchDate] = watch([
    'start_location', 'end_location', 'cargo_weight_kg',
    'vehicle_type', 'produce_type', 'scheduled_at',
  ]);

  /* ── Cost estimate ─────────────────────────────────────────── */
  const fetchEstimate = useCallback(async () => {
    if (!watchStart || !watchEnd || !watchWeight) return;
    setEstimating(true);
    try {
      const res = await getEstimatedCost({
        start_location:  watchStart,
        end_location:    watchEnd,
        cargo_weight_kg: Number(watchWeight),
        vehicle_type:    watchVehicle || undefined,
      });
      setCostEstimate(res?.estimated_cost ?? res?.cost ?? res);
    } catch {
      setCostEstimate(null);
    } finally {
      setEstimating(false);
    }
  }, [watchStart, watchEnd, watchWeight, watchVehicle]);

  /* ── AI recommendation ─────────────────────────────────────── */
  const fetchAiSuggestion = useCallback(async () => {
    if (!watchStart || !watchEnd || !watchWeight || !watchProduce || !watchDate) {
      toast.error('Fill in pickup, drop, weight, produce type and date first.');
      return;
    }
    setAiLoading(true);
    setAiSuggestion(null);
    try {
      const res = await getAiRecommendation({
        pickup:        watchStart,
        destination:   watchEnd,
        crop_type:     watchProduce,
        weight_kg:     Number(watchWeight),
        delivery_date: watchDate,
      });
      setAiSuggestion(res);
    } catch (err) {
      toast.error(err.message || 'AI recommendation unavailable.');
    } finally {
      setAiLoading(false);
    }
  }, [watchStart, watchEnd, watchWeight, watchProduce, watchDate]);

  /* ── Submit ────────────────────────────────────────────────── */
  const mutation = useMutation({
    mutationFn: farmerBookTransport,
    onSuccess: () => {
      setSubmitSuccess(true);
      qc.invalidateQueries({ queryKey: queryKeys.bookings.lists() });
      toast.success('Booking created successfully! 🚛');
      setTimeout(() => navigate(ROUTES.FARMER_BOOKINGS), 1800);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to create booking.');
    },
  });

  const onSubmit = (values) => {
    // eslint-disable-next-line no-unused-vars
    const { vehicle_type, produce_type, ...payload } = values;
    payload.scheduled_at    = new Date(values.scheduled_at).toISOString();
    payload.cargo_weight_kg = Number(values.cargo_weight_kg);
    if (costEstimate) payload.estimated_cost = Number(costEstimate);
    mutation.mutate(payload);
  };

  /* ── Min date for calendar input ──────────────────────────── */
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().slice(0, 10);

  if (submitSuccess) {
    return (
      <PageContainer size="narrow" className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="inline-flex h-20 w-20 rounded-3xl bg-primary-50 dark:bg-primary-900/20
                          items-center justify-center mb-5 mx-auto">
            <CheckCircle2 size={40} className="text-primary-600" />
          </div>
          <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-2">
            Booking Created!
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Redirecting to your bookings…
          </p>
          <Loader2 size={20} className="animate-spin text-primary-500 mx-auto" />
        </motion.div>
      </PageContainer>
    );
  }

  return (
    <PageContainer size="narrow">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <Link
          to={ROUTES.FARMER_BOOKINGS}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500
                     hover:text-gray-700 dark:hover:text-gray-300 mb-4 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Bookings
        </Link>
        <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
          New Booking
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Book a verified transporter for your farm produce.
        </p>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">

        {/* ── Locations ──────────────────────────────────────── */}
        <Card>
          <Card.Header>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <MapPin size={15} className="text-primary-500" /> Pickup &amp; Drop
            </h2>
          </Card.Header>
          <Card.Body className="flex flex-col gap-4">
            <Input
              label="Pickup location"
              placeholder="Village name, taluk, district"
              required
              leftIcon={<MapPin size={15} />}
              error={errors.start_location?.message}
              {...register('start_location')}
            />
            <Input
              label="Drop location"
              placeholder="Market, city, destination"
              required
              leftIcon={<MapPin size={15} />}
              error={errors.end_location?.message}
              {...register('end_location')}
            />
          </Card.Body>
        </Card>

        {/* ── Cargo details ───────────────────────────────────── */}
        <Card>
          <Card.Header>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Leaf size={15} className="text-primary-500" /> Cargo Details
            </h2>
          </Card.Header>
          <Card.Body className="flex flex-col gap-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Select
                label="Produce type"
                placeholder="Select produce"
                options={PRODUCE_OPTIONS}
                error={errors.produce_type?.message}
                {...register('produce_type')}
              />
              <Input
                label="Weight (kg)"
                type="number"
                placeholder="e.g. 500"
                required
                min="0.01"
                step="0.01"
                leftIcon={<Weight size={15} />}
                error={errors.cargo_weight_kg?.message}
                {...register('cargo_weight_kg')}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Select
                label="Preferred vehicle type"
                placeholder="Any vehicle"
                options={VEHICLE_OPTIONS}
                error={errors.vehicle_type?.message}
                {...register('vehicle_type')}
              />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Shared load?
                </label>
                <label className="flex items-center gap-3 cursor-pointer h-10">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-primary-600
                               focus:ring-primary-500 cursor-pointer"
                    {...register('wants_shared')}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Allow shared truck (reduces cost)
                  </span>
                </label>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* ── Schedule ────────────────────────────────────────── */}
        <Card>
          <Card.Header>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Calendar size={15} className="text-primary-500" /> Schedule
            </h2>
          </Card.Header>
          <Card.Body>
            <Input
              label="Pickup date &amp; time"
              type="datetime-local"
              required
              min={`${minDateStr}T00:00`}
              leftIcon={<Calendar size={15} />}
              error={errors.scheduled_at?.message}
              {...register('scheduled_at')}
            />
          </Card.Body>
        </Card>

        {/* ── Notes ───────────────────────────────────────────── */}
        <Card>
          <Card.Header>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <StickyNote size={15} className="text-primary-500" /> Additional Notes
            </h2>
          </Card.Header>
          <Card.Body>
            <textarea
              rows={3}
              placeholder="Special handling instructions, fragile items, etc."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm
                         placeholder:text-gray-400 focus:outline-none focus:ring-2
                         focus:ring-primary-500 focus:border-transparent resize-none
                         transition-shadow duration-150"
              {...register('notes')}
            />
            {errors.notes && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle size={11} /> {errors.notes.message}
              </p>
            )}
          </Card.Body>
        </Card>

        {/* ── Cost estimate + AI ──────────────────────────────── */}
        <Card className="border-primary-100 dark:border-primary-900/30">
          <Card.Header>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Truck size={15} className="text-primary-500" /> Pricing &amp; AI Recommendation
            </h2>
          </Card.Header>
          <Card.Body className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                loading={estimating}
                onClick={fetchEstimate}
              >
                Get Cost Estimate
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                loading={aiLoading}
                leftIcon={<Sparkles size={14} />}
                onClick={fetchAiSuggestion}
              >
                AI Recommendation
              </Button>
            </div>

            <AnimatePresence>
              {costEstimate !== null && (
                <motion.div
                  key="estimate"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-primary-50
                             dark:bg-primary-900/20 border border-primary-100
                             dark:border-primary-800"
                >
                  <CheckCircle2 size={16} className="text-primary-600 shrink-0" />
                  <div>
                    <p className="text-xs text-primary-600 dark:text-primary-400 font-medium">
                      Estimated Cost
                    </p>
                    <p className="text-lg font-display font-bold text-primary-700 dark:text-primary-300">
                      {typeof costEstimate === 'number'
                        ? formatCurrency(costEstimate)
                        : String(costEstimate)}
                    </p>
                  </div>
                </motion.div>
              )}

              {aiSuggestion && (
                <motion.div
                  key="ai"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-4 rounded-xl bg-secondary-50 dark:bg-secondary-900/20
                             border border-secondary-200 dark:border-secondary-800"
                >
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-secondary-700
                                dark:text-secondary-400 mb-3">
                    <Sparkles size={13} /> AI Recommendation Details
                  </p>
                  
                  {typeof aiSuggestion === 'object' && aiSuggestion.recommendedVehicle ? (
                    <div className="space-y-3 text-xs text-gray-700 dark:text-gray-300">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-2.5 bg-white dark:bg-gray-800/50 rounded-lg border border-secondary-100 dark:border-secondary-900/20">
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Recommended Vehicle</p>
                          <p className="text-sm font-bold text-secondary-700 dark:text-secondary-400 capitalize mt-0.5">
                            {aiSuggestion.recommendedVehicle.replace('_', ' ')}
                          </p>
                        </div>
                        <div className="p-2.5 bg-white dark:bg-gray-800/50 rounded-lg border border-secondary-100 dark:border-secondary-900/20">
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Est. Cost & Duration</p>
                          <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                            {formatCurrency(aiSuggestion.estimatedCost)} • {aiSuggestion.estimatedDuration}
                          </p>
                        </div>
                      </div>

                      {aiSuggestion.sharedTruckSuggestion && (
                        <div className="p-2.5 bg-white dark:bg-gray-800/50 rounded-lg border border-secondary-100 dark:border-secondary-900/20">
                          <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                            <span>🚛 Shared Truck Option:</span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] ${aiSuggestion.sharedTruckSuggestion.recommended ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'}`}>
                              {aiSuggestion.sharedTruckSuggestion.recommended ? 'Recommended' : 'Optional'}
                            </span>
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">{aiSuggestion.sharedTruckSuggestion.reason}</p>
                        </div>
                      )}

                      {aiSuggestion.returnTripSuggestion && (
                        <div className="p-2.5 bg-white dark:bg-gray-800/50 rounded-lg border border-secondary-100 dark:border-secondary-900/20">
                          <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                            <span>🔄 Return Trip Matching:</span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] ${aiSuggestion.returnTripSuggestion.recommended ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'}`}>
                              {aiSuggestion.returnTripSuggestion.recommended ? 'Highly Recommended' : 'Optional'}
                            </span>
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">{aiSuggestion.returnTripSuggestion.reason}</p>
                        </div>
                      )}
                      
                      <div className="text-[10px] text-gray-400 flex items-center justify-between pt-1">
                        <span>Source: {aiSuggestion.source === 'gemini' ? 'Gemini AI Model' : 'Local Rule Engine'}</span>
                        <span>Model: {aiSuggestion.model}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {typeof aiSuggestion === 'string'
                        ? aiSuggestion
                        : aiSuggestion?.recommendation ?? JSON.stringify(aiSuggestion)}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </Card.Body>
        </Card>

        {/* ── Submit ──────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 pb-6">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="sm:w-auto"
            onClick={() => navigate(ROUTES.FARMER_BOOKINGS)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="lg"
            fullWidth
            loading={isSubmitting || mutation.isPending}
          >
            {isSubmitting || mutation.isPending ? 'Creating booking…' : 'Confirm Booking'}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}
