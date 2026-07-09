import React from 'react';
import BookingForm from '../components/BookingForm';
import BookingSummary from '../components/BookingSummary';
import { useQueryClient } from '@tanstack/react-query';

const BookingPage = () => {
  const queryClient = useQueryClient();

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['bookings'] });
    // TODO: replace alert with a styled toast component later
    alert('Booking created successfully!');
  };

  return (
    <div className="booking-page container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Create New Booking</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BookingForm onSuccess={handleSuccess} />
        <BookingSummary />
      </div>
    </div>
  );
};

export default BookingPage;
