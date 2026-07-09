import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { getAiRecommendation } from '@/api/ai.api';
import { Card, Input, Select, Option, Button, Loader, Alert } from '@/components/ui';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '@/utils/formatters';
import { format } from 'date-fns';

// Validation schema
const recommendationSchema = z.object({
  crop_type:   z.string().min(1, 'Select a crop'),
  cargo_weight_kg: z.coerce
    .number({ invalid_type_error: 'Enter a valid weight' })
    .positive('Weight must be > 0')
    .max(50000, 'Weight cannot exceed 50,000 kg'),
  pickup:      z.string().min(1, 'Pickup location required'),
  destination: z.string().min(1, 'Destination required'),
  delivery_date: z.string().refine((d) => !isNaN(Date.parse(d)), {
    message: 'Enter a valid date',
  }),
});

const AiRecommendationPage = () => {
  const [result, setResult] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(recommendationSchema),
    defaultValues: { cargo_weight_kg: '' },
  });

  const mutation = useMutation(getAiRecommendation, {
    onSuccess: (data) => setResult(data),
    onError: (err) => toast.error(err.message || 'Recommendation failed'),
  });

  const onSubmit = (values) => {
    const payload = {
      crop_type: values.crop_type,
      weight_kg: Number(values.cargo_weight_kg),
      pickup: values.pickup,
      destination: values.destination,
      delivery_date: values.delivery_date,
    };
    mutation.mutate(payload);
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">AI Transport Recommendation</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Select
          label="Crop"
          placeholder="Select crop"
          {...register('crop_type')}
          error={errors.crop_type?.message}
        >
          {/* Replace with dynamic options if needed */}
          <Option value="vegetables">Vegetables</Option>
          <Option value="fruits">Fruits</Option>
          <Option value="grains">Grains</Option>
          <Option value="pulses">Pulses</Option>
        </Select>

        <Input
          label="Weight (kg)"
          type="number"
          placeholder="e.g. 500"
          {...register('cargo_weight_kg')}
          error={errors.cargo_weight_kg?.message}
        />

        <Input label="Pickup" placeholder="Village, taluk..." {...register('pickup')} error={errors.pickup?.message} />
        <Input label="Destination" placeholder="Market, city..." {...register('destination')} error={errors.destination?.message} />
        <Input label="Delivery Date" type="date" {...register('delivery_date')} error={errors.delivery_date?.message} />

        <Button type="submit" disabled={isSubmitting || mutation.isLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
          {isSubmitting || mutation.isLoading ? 'Generating...' : 'Get Recommendation'}
        </Button>
      </form>

      {mutation.isLoading && (
        <div className="mt-6 flex justify-center">
          <Loader />
        </div>
      )}

      {result && (
        <Card className="mt-8 backdrop-blur-sm bg-white/70 p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Recommendation</h2>
          <div className="grid gap-2 text-sm">
            <p>
              <strong>Suggested Vehicle:</strong> {result.suggested_vehicle || '-'}
            </p>
            <p>
              <strong>Estimated Cost:</strong> ₹ {formatCurrency(result.estimated_cost)}
            </p>
            <p>
              <strong>Estimated Time:</strong> {result.estimated_time || '-'}
            </p>
            <p>
              <strong>Shared Truck Advice:</strong> {result.shared_truck_advice || '-'}
            </p>
            <p>
              <strong>Return Trip Advice:</strong> {result.return_trip_advice || '-'}
            </p>
          </div>
        </Card>
      )}

      {mutation.isError && (
        <Alert severity="error" className="mt-4">
          {mutation.error?.message || 'Something went wrong'}
        </Alert>
      )}
    </div>
  );
};

export default AiRecommendationPage;
