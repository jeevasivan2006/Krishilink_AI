import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getReturnTripAvailability, recordCompletion } from '@/api/returnTrip.api';
import { Card, Button, Loader, Alert } from '@/components/ui';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

// Helper to format numbers with commas
const fmt = (n) => (n != null ? Number(n).toLocaleString() : '-');

const ReturnTripMarketplace = () => {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isError,
    error,
    isFetching,
  } = useQuery(['returnTripAvailability'], getReturnTripAvailability, {
    staleTime: 5_000,
    refetchInterval: 15_000, // keep data fresh
  });

  const bookMutation = useMutation(recordCompletion, {
    onSuccess: () => {
      toast.success('Return trip booked!');
      queryClient.invalidateQueries(['returnTripAvailability']);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to book return trip');
    },
  });

  const handleBook = async (driver) => {
    // Payload shape matches backend expectation for a completion record.
    const payload = {
      booking_id: driver.booking_id || '', // assume linked booking if any
      vehicle_id: driver.vehicle_id,
      current_lat: driver.current_lat,
      current_lng: driver.current_lng,
      return_destination: driver.return_destination,
      return_lat: driver.return_lat,
      return_lng: driver.return_lng,
    };
    await bookMutation.mutateAsync(payload);
  };

  const handleContact = (driver) => {
    if (driver.phone) {
      window.open(`tel:${driver.phone}`);
    } else if (driver.email) {
      window.open(`mailto:${driver.email}`);
    } else {
      toast('Contact information not available');
    }
  };

  if (isLoading) return <Loader />;
  if (isError)
    return (
      <Alert severity="error">{error?.message || 'Failed to load return trips'}</Alert>
    );

  const trips = data?.trips ?? [];

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Return‑Trip Marketplace</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {trips.map((trip) => (
          <Card key={trip.id} className="shadow-lg backdrop-blur-sm bg-white/70 p-4">
            <div className="flex flex-col h-full">
              <h2 className="font-medium text-xl mb-2">
                {trip.driver_name || 'Driver'} – {trip.vehicle_type || 'Vehicle'}
              </h2>
              <p className="text-sm text-gray-600 mb-1">
                <strong>Estimated Savings:</strong> ₹ {fmt(trip.estimated_savings)}
              </p>
              <p className="text-sm text-gray-600 mb-1">
                <strong>Available Capacity:</strong> {fmt(trip.available_capacity_kg)} kg
              </p>
              <p className="text-sm text-gray-600 mb-1">
                <strong>Pickup Time:</strong>{' '}
                {trip.pickup_time
                  ? format(new Date(trip.pickup_time), 'PPP p')
                  : '-'}
              </p>

              <div className="mt-auto flex gap-2 pt-4">
                <Button
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                  loading={bookMutation.isLoading}
                  onClick={() => handleBook(trip)}
                >
                  Book Return Truck
                </Button>
                <Button
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
                  onClick={() => handleContact(trip)}
                >
                  Contact Driver
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Background refetch indicator */}
      {isFetching && <Loader className="absolute inset-0 opacity-50" />}
    </div>
  );
};

export default ReturnTripMarketplace;
