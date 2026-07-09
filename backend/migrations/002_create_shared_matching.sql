-- Shared Truck Matching Engine schema
-- Run via: npm run migrate

-- Truck registry (capacity source of truth)
CREATE TABLE IF NOT EXISTS trucks (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_number   VARCHAR(20) NOT NULL UNIQUE,
  max_capacity_kg       NUMERIC(10, 2) NOT NULL CHECK (max_capacity_kg > 0),
  vehicle_type          VARCHAR(50) NOT NULL DEFAULT 'standard',
  status                VARCHAR(20) NOT NULL DEFAULT 'available',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT trucks_status_check CHECK (status IN ('available', 'assigned', 'maintenance', 'inactive'))
);

-- Extend bookings for shared matching
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS cargo_weight_kg NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS shared_group_id UUID,
  ADD COLUMN IF NOT EXISTS wants_shared BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE bookings
  DROP CONSTRAINT IF EXISTS bookings_cargo_weight_check;

ALTER TABLE bookings
  ADD CONSTRAINT bookings_cargo_weight_check
  CHECK (cargo_weight_kg IS NULL OR cargo_weight_kg > 0);

-- Shared groups: one truck, one route, one date
CREATE TABLE IF NOT EXISTS shared_groups (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  truck_id            UUID REFERENCES trucks(id),
  start_location      TEXT NOT NULL,
  end_location        TEXT NOT NULL,
  start_location_key  TEXT NOT NULL,
  end_location_key    TEXT NOT NULL,
  scheduled_date      DATE NOT NULL,
  total_capacity_kg   NUMERIC(10, 2) NOT NULL CHECK (total_capacity_kg > 0),
  used_capacity_kg    NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (used_capacity_kg >= 0),
  total_cost          NUMERIC(12, 2),
  status              VARCHAR(20) NOT NULL DEFAULT 'open',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT shared_groups_status_check CHECK (
    status IN ('open', 'full', 'confirmed', 'in_transit', 'completed', 'cancelled')
  ),
  CONSTRAINT shared_groups_capacity_check CHECK (used_capacity_kg <= total_capacity_kg)
);

-- Members linking bookings to shared groups
CREATE TABLE IF NOT EXISTS shared_group_members (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_group_id   UUID NOT NULL REFERENCES shared_groups(id) ON DELETE CASCADE,
  booking_id        UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  farmer_id         UUID NOT NULL,
  cargo_weight_kg   NUMERIC(10, 2) NOT NULL CHECK (cargo_weight_kg > 0),
  allocated_cost    NUMERIC(12, 2),
  status            VARCHAR(20) NOT NULL DEFAULT 'active',
  joined_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at           TIMESTAMPTZ,
  CONSTRAINT shared_group_members_status_check CHECK (status IN ('active', 'left'))
);

-- FK from bookings to shared_groups (deferred to avoid circular create issues)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bookings_shared_group_id_fkey'
  ) THEN
    ALTER TABLE bookings
      ADD CONSTRAINT bookings_shared_group_id_fkey
      FOREIGN KEY (shared_group_id) REFERENCES shared_groups(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_shared_groups_route_date
  ON shared_groups (start_location_key, end_location_key, scheduled_date, status);

CREATE INDEX IF NOT EXISTS idx_shared_groups_status ON shared_groups(status);
CREATE INDEX IF NOT EXISTS idx_shared_group_members_group ON shared_group_members(shared_group_id);
CREATE INDEX IF NOT EXISTS idx_shared_group_members_booking ON shared_group_members(booking_id);
CREATE INDEX IF NOT EXISTS idx_shared_group_members_active
  ON shared_group_members(shared_group_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_bookings_shared_group ON bookings(shared_group_id);

-- Seed a default truck for development
INSERT INTO trucks (registration_number, max_capacity_kg, vehicle_type)
VALUES ('DEFAULT-TRUCK-001', 5000.00, 'standard')
ON CONFLICT (registration_number) DO NOTHING;

CREATE OR REPLACE FUNCTION update_shared_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_shared_groups_updated_at ON shared_groups;
CREATE TRIGGER trg_shared_groups_updated_at
  BEFORE UPDATE ON shared_groups
  FOR EACH ROW
  EXECUTE PROCEDURE update_shared_groups_updated_at();
