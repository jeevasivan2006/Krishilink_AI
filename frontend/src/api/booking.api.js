import axios from 'axios';

export const createBooking = async (bookingData) => {
  const response = await axios.post('/api/bookings', bookingData);
  return response.data;
};
