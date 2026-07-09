-- Admin module: users, driver profiles, admin audit log
-- Run via: npm run migrate

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  phone         VARCHAR(20),
  role          VARCHAR(20) NOT NULL DEFAULT 'farmer',
  status        VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_role_check CHECK (
    role IN ('admin', 'manager', 'support', 'farmer', 'driver')
  ),
  CONSTRAINT users_status_check CHECK (
    status IN ('active', 'inactive', 'suspended', 'pending')
  )
);

CREATE TABLE IF NOT EXISTS driver_profiles (
  user_id           UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  license_number    VARCHAR(50),
  vehicle_type      VARCHAR(50),
  vehicle_number    VARCHAR(20),
  rating            NUMERIC(3, 2) DEFAULT 0.00,
  total_trips       INTEGER NOT NULL DEFAULT 0,
  availability      VARCHAR(20) NOT NULL DEFAULT 'offline',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT driver_profiles_availability_check CHECK (
    availability IN ('available', 'busy', 'offline')
  )
);

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id      UUID NOT NULL REFERENCES users(id),
  action        VARCHAR(60) NOT NULL,
  entity_type   VARCHAR(30),
  entity_id     UUID,
  details       JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_availability ON driver_profiles(availability);
CREATE INDEX IF NOT EXISTS idx_admin_audit_admin ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit_log(created_at DESC);

CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW
  EXECUTE PROCEDURE update_users_updated_at();

DROP TRIGGER IF EXISTS trg_driver_profiles_updated_at ON driver_profiles;
CREATE TRIGGER trg_driver_profiles_updated_at
  BEFORE UPDATE ON driver_profiles FOR EACH ROW
  EXECUTE PROCEDURE update_users_updated_at();

-- Seed default admin (dev only — change credentials in production)
INSERT INTO users (id, name, email, phone, role, status)
VALUES (
  '00000000-0000-4000-8000-000000000001',
  'System Admin',
  'admin@krishilink.in',
  '+910000000001',
  'admin',
  'active'
)
ON CONFLICT (email) DO NOTHING;
