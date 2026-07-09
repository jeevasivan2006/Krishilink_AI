import React from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useTracking } from '@/hooks/useTracking';
import { ROUTES } from '@/constants';
import { PageSpinner } from '@/components/ui/Spinner';

// Fix default icon URLs (Leaflet expects images in a specific location)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const LiveTrackingPage = () => {
  const { bookingId } = useParams();
  const { driver, route, status, eta, loading, error } = useTracking(bookingId);

  // Dummy placeholders for pickup/destination – will be filled from booking data when available
  // Assume driver response includes lat/lng, route is array of [lat, lng]
  const pickup = driver?.pickupLocation || null;
  const destination = driver?.destinationLocation || null;

  if (loading) return <PageSpinner />;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  const position = driver?.location ? [driver.location.lat, driver.location.lng] : [0, 0];

  const polylinePositions = route?.map((pt) => [pt.lat, pt.lng]) || [];

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Live Tracking – Booking {bookingId}</h1>
        <span className={`status-badge ${status?.toLowerCase().replace(' ', '-')}`}>{status}</span>
      </div>

      {/* Map */}
      <div className="glass-card overflow-hidden rounded-lg" style={{ height: '60vh' }}>
        <MapContainer center={position} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {driver?.location && (
            <Marker position={position}>
              <Popup>Driver</Popup>
            </Marker>
          )}
          {pickup && (
            <Marker position={[pickup.lat, pickup.lng]} icon={new L.Icon({
              iconUrl: require('leaflet/dist/images/marker-icon-green.png'),
              shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
            })}>
              <Popup>Pickup</Popup>
            </Marker>
          )}
          {destination && (
            <Marker position={[destination.lat, destination.lng]} icon={new L.Icon({
              iconUrl: require('leaflet/dist/images/marker-icon-red.png'),
              shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
            })}>
              <Popup>Destination</Popup>
            </Marker>
          )}
          {polylinePositions.length > 0 && (
            <Polyline positions={polylinePositions} color="hsl(200,70%,55%)" />
          )}
        </MapContainer>
      </div>

      {/* Info Card */}
      <div className="glass-card p-4 flex flex-col md:flex-row justify-between items-center">
        <div className="text-lg">ETA: <strong>{eta ?? 'Calculating...'}</strong></div>
        <div className="text-sm text-gray-400 mt-2 md:mt-0">Last updated: {new Date().toLocaleTimeString()}</div>
      </div>
    </div>
  );
};

export default LiveTrackingPage;
