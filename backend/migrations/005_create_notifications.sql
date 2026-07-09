-- Notification Service schema (outbox pattern — no external provider)
-- Run via: npm run migrate

CREATE TABLE IF NOT EXISTS notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL,
  category        VARCHAR(30) NOT NULL,
  event_type      VARCHAR(60) NOT NULL,
  title           VARCHAR(200) NOT NULL,
  channels        VARCHAR(20)[] NOT NULL DEFAULT '{}',
  sms_payload     JSONB,
  email_payload   JSONB,
  push_payload    JSONB,
  recipient       JSONB NOT NULL DEFAULT '{}',
  context         JSONB NOT NULL DEFAULT '{}',
  status          VARCHAR(20) NOT NULL DEFAULT 'queued',
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT notifications_category_check CHECK (
    category IN ('booking', 'trip', 'return_trip', 'shared_truck')
  ),
  CONSTRAINT notifications_status_check CHECK (
    status IN ('queued', 'delivered', 'read', 'failed', 'cancelled')
  )
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_event_type ON notifications(event_type);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id) WHERE read_at IS NULL;

CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notifications_updated_at ON notifications;
CREATE TRIGGER trg_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE PROCEDURE update_notifications_updated_at();
