-- Booking Management Module schema
-- Run: psql $DATABASE_URL -f migrations/001_create_bookings.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS bookings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id       UUID NOT NULL,
  vehicle_id      UUID,
  driver_id       UUID,
  start_location  TEXT NOT NULL,
  end_location    TEXT NOT NULL,
  start_lat       NUMERIC(10, 7),
  start_lng       NUMERIC(10, 7),
  end_lat         NUMERIC(10, 7),
  end_lng         NUMERIC(10, 7),
  scheduled_at    TIMESTAMPTZ NOT NULL,
  status          VARCHAR(50) NOT NULL DEFAULT 'pending',
  estimated_cost  NUMERIC(12, 2),
  final_cost      NUMERIC(12, 2),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT bookings_status_check CHECK (
    status IN (
      'pending',
      'searching_truck',
      'shared_matching',
      'accepted',
      'pickup_started',
      'in_transit',
      'delivered',
      'cancelled'
    )
  )
);

CREATE TABLE IF NOT EXISTS booking_timeline (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  from_status VARCHAR(50),
  to_status   VARCHAR(50) NOT NULL,
  note        TEXT,
  actor_id    UUID,
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_farmer_id ON bookings(farmer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_at ON bookings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_booking_timeline_booking_id ON booking_timeline(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_timeline_created_at ON booking_timeline(created_at);

CREATE OR REPLACE FUNCTION update_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bookings_updated_at ON bookings;
CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE PROCEDURE update_bookings_updated_at();
