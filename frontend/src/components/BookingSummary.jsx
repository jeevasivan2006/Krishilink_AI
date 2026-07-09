import React from "react";
import { Card } from "./ui";

const BookingSummary = ({ booking }) => {
  if (!booking) return null;

  const {
    start_location,
    end_location,
    scheduled_at,
    cargo_weight_kg,
    vehicle_type,
    estimated_cost,
    notes,
    status,
    created_at,
  } = booking;

  return (
    <Card className="shadow-md mt-6">
      <div className="p-4">
        <h3 className="font-medium text-lg mb-2">Booking Summary</h3>
        <p><strong>From:</strong> {start_location}</p>
        <p><strong>To:</strong> {end_location}</p>
        <p><strong>Pickup:</strong> {new Date(scheduled_at).toLocaleString()}</p>
        {cargo_weight_kg && <p><strong>Weight:</strong> {cargo_weight_kg} kg</p>}
        {vehicle_type && <p><strong>Vehicle:</strong> {vehicle_type}</p>}
        {estimated_cost && <p><strong>Est. Cost:</strong> ₹ {estimated_cost}</p>}
        {notes && <p><strong>Notes:</strong> {notes}</p>}
        <p><strong>Status:</strong> {status}</p>
        <p className="text-gray-500 text-sm">Created {new Date(created_at).toLocaleDateString()}</p>
      </div>
    </Card>
  );
};

export default BookingSummary;
