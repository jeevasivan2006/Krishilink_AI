-- Return Trip Marketplace schema
-- Run via: npm run migrate

CREATE TABLE IF NOT EXISTS driver_delivery_completions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id               UUID NOT NULL,
  booking_id              UUID NOT NULL UNIQUE REFERENCES bookings(id),
  vehicle_id              UUID,
  current_lat             NUMERIC(10, 7) NOT NULL,
  current_lng             NUMERIC(10, 7) NOT NULL,
  current_location        TEXT,
  delivery_destination    TEXT NOT NULL,
  delivery_lat            NUMERIC(10, 7),
  delivery_lng            NUMERIC(10, 7),
  return_destination      TEXT,
  return_lat              NUMERIC(10, 7),
  return_lng              NUMERIC(10, 7),
  search_radius_km        NUMERIC(6, 2) NOT NULL DEFAULT 50.00,
  status                  VARCHAR(20) NOT NULL DEFAULT 'available',
  available_until         TIMESTAMPTZ,
  completed_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT driver_delivery_completions_status_check CHECK (
    status IN ('available', 'matched', 'expired', 'cancelled')
  )
);

CREATE TABLE IF NOT EXISTS return_trip_suggestions (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_completion_id    UUID NOT NULL REFERENCES driver_delivery_completions(id) ON DELETE CASCADE,
  booking_id                UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  driver_id                 UUID NOT NULL,
  farmer_id                 UUID NOT NULL,
  pickup_distance_km        NUMERIC(8, 2) NOT NULL,
  return_alignment_km       NUMERIC(8, 2),
  match_score               NUMERIC(8, 2) NOT NULL,
  status                    VARCHAR(20) NOT NULL DEFAULT 'suggested',
  rejection_reason          TEXT,
  suggested_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at              TIMESTAMPTZ,
  expires_at                TIMESTAMPTZ,
  CONSTRAINT return_trip_suggestions_status_check CHECK (
    status IN ('suggested', 'accepted', 'rejected', 'expired')
  ),
  CONSTRAINT return_trip_suggestions_unique_pair UNIQUE (delivery_completion_id, booking_id)
);

CREATE TABLE IF NOT EXISTS return_trips (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_completion_id    UUID NOT NULL REFERENCES driver_delivery_completions(id),
  suggestion_id             UUID REFERENCES return_trip_suggestions(id),
  booking_id                UUID NOT NULL UNIQUE REFERENCES bookings(id),
  driver_id                 UUID NOT NULL,
  farmer_id                 UUID NOT NULL,
  pickup_distance_km        NUMERIC(8, 2) NOT NULL,
  trip_distance_km          NUMERIC(8, 2),
  status                    VARCHAR(20) NOT NULL DEFAULT 'active',
  accepted_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at              TIMESTAMPTZ,
  cancelled_at              TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT return_trips_status_check CHECK (
    status IN ('active', 'completed', 'cancelled')
  )
);

CREATE INDEX IF NOT EXISTS idx_delivery_completions_driver ON driver_delivery_completions(driver_id);
CREATE INDEX IF NOT EXISTS idx_delivery_completions_status ON driver_delivery_completions(status);
CREATE INDEX IF NOT EXISTS idx_delivery_completions_location ON driver_delivery_completions(current_lat, current_lng);

CREATE INDEX IF NOT EXISTS idx_return_suggestions_driver ON return_trip_suggestions(driver_id);
CREATE INDEX IF NOT EXISTS idx_return_suggestions_completion ON return_trip_suggestions(delivery_completion_id);
CREATE INDEX IF NOT EXISTS idx_return_suggestions_status ON return_trip_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_return_suggestions_booking ON return_trip_suggestions(booking_id);

CREATE INDEX IF NOT EXISTS idx_return_trips_driver ON return_trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_return_trips_farmer ON return_trips(farmer_id);
CREATE INDEX IF NOT EXISTS idx_return_trips_status ON return_trips(status);
CREATE INDEX IF NOT EXISTS idx_return_trips_accepted_at ON return_trips(accepted_at DESC);

CREATE INDEX IF NOT EXISTS idx_bookings_pickup_coords ON bookings(start_lat, start_lng)
  WHERE start_lat IS NOT NULL AND start_lng IS NOT NULL;

CREATE OR REPLACE FUNCTION update_return_trip_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_delivery_completions_updated_at ON driver_delivery_completions;
CREATE TRIGGER trg_delivery_completions_updated_at
  BEFORE UPDATE ON driver_delivery_completions
  FOR EACH ROW
  EXECUTE PROCEDURE update_return_trip_updated_at();

DROP TRIGGER IF EXISTS trg_return_trips_updated_at ON return_trips;
CREATE TRIGGER trg_return_trips_updated_at
  BEFORE UPDATE ON return_trips
  FOR EACH ROW
  EXECUTE PROCEDURE update_return_trip_updated_at();
