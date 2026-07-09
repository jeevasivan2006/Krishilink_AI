-- Live Tracking Module schema
-- Run via: npm run migrate

CREATE TABLE IF NOT EXISTS driver_locations (
  driver_id       UUID PRIMARY KEY,
  booking_id      UUID REFERENCES bookings(id) ON DELETE SET NULL,
  lat             NUMERIC(10, 7) NOT NULL,
  lng             NUMERIC(10, 7) NOT NULL,
  heading         NUMERIC(5, 2),
  speed_kmh       NUMERIC(6, 2),
  accuracy_m      NUMERIC(8, 2),
  recorded_at     TIMESTAMPTZ NOT NULL,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS location_updates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id       UUID NOT NULL,
  booking_id      UUID REFERENCES bookings(id) ON DELETE SET NULL,
  lat             NUMERIC(10, 7) NOT NULL,
  lng             NUMERIC(10, 7) NOT NULL,
  heading         NUMERIC(5, 2),
  speed_kmh       NUMERIC(6, 2),
  accuracy_m      NUMERIC(8, 2),
  recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS booking_routes (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id              UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  origin_lat              NUMERIC(10, 7) NOT NULL,
  origin_lng              NUMERIC(10, 7) NOT NULL,
  destination_lat         NUMERIC(10, 7) NOT NULL,
  destination_lng         NUMERIC(10, 7) NOT NULL,
  planned_distance_km     NUMERIC(8, 2),
  planned_duration_minutes INTEGER,
  waypoints               JSONB NOT NULL DEFAULT '[]',
  encoded_polyline        TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS booking_tracking (
  booking_id              UUID PRIMARY KEY REFERENCES bookings(id) ON DELETE CASCADE,
  driver_id               UUID NOT NULL,
  status                  VARCHAR(20) NOT NULL DEFAULT 'active',
  eta_minutes             INTEGER,
  distance_remaining_km   NUMERIC(8, 2),
  last_calculated_at      TIMESTAMPTZ,
  started_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at            TIMESTAMPTZ,
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT booking_tracking_status_check CHECK (
    status IN ('active', 'paused', 'completed')
  )
);

CREATE INDEX IF NOT EXISTS idx_driver_locations_booking ON driver_locations(booking_id);
CREATE INDEX IF NOT EXISTS idx_location_updates_driver ON location_updates(driver_id);
CREATE INDEX IF NOT EXISTS idx_location_updates_booking ON location_updates(booking_id);
CREATE INDEX IF NOT EXISTS idx_location_updates_recorded_at ON location_updates(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_booking_tracking_driver ON booking_tracking(driver_id);
CREATE INDEX IF NOT EXISTS idx_booking_tracking_status ON booking_tracking(status);

CREATE OR REPLACE FUNCTION update_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_driver_locations_updated_at ON driver_locations;
CREATE TRIGGER trg_driver_locations_updated_at
  BEFORE UPDATE ON driver_locations
  FOR EACH ROW
  EXECUTE PROCEDURE update_tracking_updated_at();

DROP TRIGGER IF EXISTS trg_booking_routes_updated_at ON booking_routes;
CREATE TRIGGER trg_booking_routes_updated_at
  BEFORE UPDATE ON booking_routes
  FOR EACH ROW
  EXECUTE PROCEDURE update_tracking_updated_at();

DROP TRIGGER IF EXISTS trg_booking_tracking_updated_at ON booking_tracking;
CREATE TRIGGER trg_booking_tracking_updated_at
  BEFORE UPDATE ON booking_tracking
  FOR EACH ROW
  EXECUTE PROCEDURE update_tracking_updated_at();
