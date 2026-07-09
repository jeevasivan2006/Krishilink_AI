-- Driver booking response tracking
-- Run via: npm run migrate

CREATE TABLE IF NOT EXISTS driver_booking_responses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  driver_id   UUID NOT NULL,
  response    VARCHAR(20) NOT NULL,
  reason      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (booking_id, driver_id),
  CONSTRAINT driver_booking_responses_response_check
    CHECK (response IN ('accepted', 'rejected'))
);

CREATE INDEX IF NOT EXISTS idx_driver_booking_responses_driver
  ON driver_booking_responses(driver_id, response);

CREATE INDEX IF NOT EXISTS idx_driver_booking_responses_booking
  ON driver_booking_responses(booking_id);
