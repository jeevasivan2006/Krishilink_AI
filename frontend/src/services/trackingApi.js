import axios from 'axios';

const base = `${process.env.REACT_APP_API_URL}/api/v1/tracking`;

export const getBookingTracking = (bookingId) => axios.get(`${base}/bookings/${bookingId}`);
export const getDriverLocation = (bookingId) => axios.get(`${base}/bookings/${bookingId}/location`);
export const getRoute = (bookingId) => axios.get(`${base}/bookings/${bookingId}/route`);
export const getEta = (bookingId) => axios.get(`${base}/bookings/${bookingId}/eta`);
