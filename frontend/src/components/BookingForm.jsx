import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createBooking } from "../api/booking.api";
// import { calculateEstimatedCost } from "../api/booking.api"; // removed - not needed
import { Button, Input, Card, Select, Textarea, Loader, Alert } from "./ui";
import { useLoadScript, Autocomplete } from "@react-google-maps/api";

const libraries = ["places"];
const googleMapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const BookingForm = ({ onSuccess }) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      start_location: "",
      end_location: "",
      scheduled_at: "",
      cargo_weight_kg: "",
      vehicle_type: "",
      notes: "",
    },
  });

  const queryClient = useQueryClient();
  const [cost, setCost] = useState(null);
  const [distanceKm, setDistanceKm] = useState(null);
  const [loadingCost, setLoadingCost] = useState(false);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: googleMapsKey,
    libraries,
  });

  const mutation = useMutation(createBooking, {
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      onSuccess(data);
    },
  });

  const getLatLng = async (place) => {
    if (!place?.geometry?.location) return null;
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    return { lat, lng };
  };

  const estimateCost = async (payload) => {
    const { cargo_weight_kg, start_location, end_location } = payload;
    if (!cargo_weight_kg || !start_location || !end_location) return null;
    const origin = encodeURIComponent(start_location);
    const destination = encodeURIComponent(end_location);
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&key=${googleMapsKey}`;
    try {
      const resp = await fetch(url);
      const data = await resp.json();
      const meters = data?.rows?.[0]?.elements?.[0]?.distance?.value;
      if (!meters) return null;
      const km = meters / 1000;
      setDistanceKm(km.toFixed(2));
      const estimated = Number((cargo_weight_kg * km * 0.5).toFixed(2));
      setCost(estimated);
      return estimated;
    } catch (e) {
      console.error("Cost estimation error:", e);
      return null;
    }
  };

  const onSubmit = async (data) => {
    setLoadingCost(true);
    const estimated = await estimateCost(data);
    setLoadingCost(false);
    const payload = {
      ...data,
      cargo_weight_kg: data.cargo_weight_kg ? Number(data.cargo_weight_kg) : null,
      wants_shared: true,
      estimated_cost: estimated ?? undefined,
    };
    mutation.mutate(payload);
  };

  const startRef = React.useRef(null);
  const endRef = React.useRef(null);

  const handlePlaceChanged = async (type) => {
    const autocomplete = type === "start" ? startRef.current : endRef.current;
    const place = autocomplete.getPlace();
    const { lat, lng } = (await getLatLng(place)) ?? {};
    if (lat && lng) {
      setValue(`${type}_lat`, lat);
      setValue(`${type}_lng`, lng);
    }
  };

  if (loadError) return <Alert severity="error">Google Maps failed to load.</Alert>;
  if (!isLoaded) return <Loader />;

  return (
    <Card className="shadow-lg">
      <div className="p-4">
        <h2 className="font-semibold text-xl mb-4">Create New Booking</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Pickup Location */}
          <div>
            <label className="block font-medium mb-1">Pickup Location</label>
            <Autocomplete
              onLoad={(ac) => (startRef.current = ac)}
              onPlaceChanged={() => handlePlaceChanged("start")}
            >
              <Input
                placeholder="Enter pickup address"
                {...register("start_location", { required: "Pickup required" })}
                className={errors.start_location ? "border-red-500" : ""}
              />
            </Autocomplete>
            {errors.start_location && (
              <p className="text-sm text-red-600">{errors.start_location.message}</p>
            )}
          </div>

          {/* Destination */}
          <div>
            <label className="block font-medium mb-1">Destination</label>
            <Autocomplete
              onLoad={(ac) => (endRef.current = ac)}
              onPlaceChanged={() => handlePlaceChanged("end")}
            >
              <Input
                placeholder="Enter destination address"
                {...register("end_location", { required: "Destination required" })}
                className={errors.end_location ? "border-red-500" : ""}
              />
            </Autocomplete>
            {errors.end_location && (
              <p className="text-sm text-red-600">{errors.end_location.message}</p>
            )}
          </div>

          {/* Scheduled At */}
          <div>
            <label className="block font-medium mb-1">Pickup Date &amp; Time</label>
            <Input
              type="datetime-local"
              {...register("scheduled_at", {
                required: "Schedule required",
                validate: (v) => new Date(v) > new Date() || "Must be future date",
              })}
              className={errors.scheduled_at ? "border-red-500" : ""}
            />
            {errors.scheduled_at && (
              <p className="text-sm text-red-600">{errors.scheduled_at.message}</p>
            )}
          </div>

          {/* Cargo Weight */}
          <div>
            <label className="block font-medium mb-1">Weight (kg)</label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              {...register("cargo_weight_kg", {
                required: "Weight required",
                valueAsNumber: true,
                min: { value: 0.01, message: "Must be > 0" },
              })}
              className={errors.cargo_weight_kg ? "border-red-500" : ""}
            />
            {errors.cargo_weight_kg && (
              <p className="text-sm text-red-600">{errors.cargo_weight_kg.message}</p>
            )}
          </div>

          {/* Vehicle Type */}
          <div>
            <label className="block font-medium mb-1">Vehicle Type</label>
            <Select {...register("vehicle_type")} defaultValue="">
              <Option value="">Any</Option>
              <Option value="truck">Truck</Option>
              <Option value="tractor">Tractor</Option>
              <Option value="van">Van</Option>
            </Select>
          </div>

          {/* Special Notes */}
          <div>
            <label className="block font-medium mb-1">Special Notes</label>
            <Textarea
              rows={3}
              placeholder="Any additional instructions"
              {...register("notes")}
            />
          </div>

          {/* Estimated Cost Display */}
          <div className="p-4 bg-gray-50 rounded">
            <strong>Estimated Cost:</strong>{" "}
            {loadingCost ? (
              <span className="text-gray-500">Calculating…</span>
            ) : cost !== null ? (
              <span className="text-green-600">₹ {cost}</span>
            ) : (
              <span className="text-gray-400">—</span>
            )}
            {distanceKm && (
              <p className="text-sm text-gray-600">
                Distance: {distanceKm} km • Rate: ₹0.5 /kg/km
              </p>
            )}
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={mutation.isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {mutation.isLoading ? "Booking…" : "Book Transport"}
          </Button>

          {/* Error handling */}
          {mutation.isError && (
            <Alert severity="error" className="mt-2">
              {mutation.error?.response?.data?.message ||
                "Something went wrong. Please try again."}
            </Alert>
          )}
        </form>
      </div>
    </Card>
  );
};

export default BookingForm;
