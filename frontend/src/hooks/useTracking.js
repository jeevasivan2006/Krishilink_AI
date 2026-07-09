import { useState, useEffect } from 'react';
import * as api from '@/services/trackingApi';

/**
 * Custom hook to fetch live tracking data for a booking.
 * It polls the backend every `intervalMs` (default 10 s).
 */
export const useTracking = (bookingId, intervalMs = 10000) => {
  const [state, setState] = useState({
    driver: null,
    route: [],
    status: '',
    eta: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    const fetchAll = async () => {
      try {
        const [{ data: booking }, { data: location }, { data: route }, { data: etaData }] = await Promise.all([
          api.getBookingTracking(bookingId),
          api.getDriverLocation(bookingId),
          api.getRoute(bookingId),
          api.getEta(bookingId),
        ]);
        if (!cancelled) {
          setState({
            driver: location,
            route: route,
            status: booking.status,
            eta: etaData?.eta,
            loading: false,
            error: null,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setState((prev) => ({ ...prev, loading: false, error: err.message }));
        }
      }
    };
    fetchAll();
    const timer = setInterval(fetchAll, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [bookingId, intervalMs]);

  return state;
};
