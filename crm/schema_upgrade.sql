-- AfrexAI CRM Schema Upgrade
-- 2026-02-14

BEGIN;

-- === Add columns to contacts ===
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS role_tier VARCHAR(20);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS enrichment_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_contacted TIMESTAMPTZ;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS source VARCHAR(50);

-- === Add columns to companies ===
ALTER TABLE companies ADD COLUMN IF NOT EXISTS domain VARCHAR(255);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS last_activity TIMESTAMPTZ;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS deal_count INT DEFAULT 0;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS source VARCHAR(50);

-- === Add columns to deals ===
ALTER TABLE deals ADD COLUMN IF NOT EXISTS source VARCHAR(50);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS owner_agent VARCHAR(50);

-- === New table: email_threads ===
CREATE TABLE IF NOT EXISTS email_threads (
    id SERIAL PRIMARY KEY,
    contact_id INT REFERENCES contacts(id),
    company_id INT REFERENCES companies(id),
    thread_id VARCHAR(255),
    subject VARCHAR(500),
    last_message_at TIMESTAMPTZ,
    message_count INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'stale', 'closed')),
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_email_threads_contact ON email_threads(contact_id);
CREATE INDEX IF NOT EXISTS idx_email_threads_company ON email_threads(company_id);
CREATE INDEX IF NOT EXISTS idx_email_threads_status ON email_threads(status);

-- === New table: timeline_events ===
CREATE TABLE IF NOT EXISTS timeline_events (
    id SERIAL PRIMARY KEY,
    company_id INT REFERENCES companies(id),
    contact_id INT REFERENCES contacts(id),
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB,
    agent VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_timeline_company ON timeline_events(company_id);
CREATE INDEX IF NOT EXISTS idx_timeline_contact ON timeline_events(contact_id);
CREATE INDEX IF NOT EXISTS idx_timeline_type ON timeline_events(event_type);
CREATE INDEX IF NOT EXISTS idx_timeline_created ON timeline_events(created_at);

-- === Trigger: auto-update companies.last_activity on activity insert ===
CREATE OR REPLACE FUNCTION trg_update_company_last_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.company_id IS NOT NULL THEN
        UPDATE companies SET last_activity = NEW.created_at WHERE id = NEW.company_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_activity_company_last_activity ON activities;
CREATE TRIGGER trg_activity_company_last_activity
    AFTER INSERT ON activities
    FOR EACH ROW EXECUTE FUNCTION trg_update_company_last_activity();

-- === Trigger: auto-update contacts.last_contacted on activity insert ===
CREATE OR REPLACE FUNCTION trg_update_contact_last_contacted()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.contact_id IS NOT NULL THEN
        UPDATE contacts SET last_contacted = NEW.created_at WHERE id = NEW.contact_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_activity_contact_last_contacted ON activities;
CREATE TRIGGER trg_activity_contact_last_contacted
    AFTER INSERT ON activities
    FOR EACH ROW EXECUTE FUNCTION trg_update_contact_last_contacted();

-- === Backfill last_activity and last_contacted from existing data ===
UPDATE companies c SET last_activity = sub.last_act
FROM (SELECT company_id, MAX(created_at) as last_act FROM activities WHERE company_id IS NOT NULL GROUP BY company_id) sub
WHERE c.id = sub.company_id;

UPDATE contacts ct SET last_contacted = sub.last_ct
FROM (SELECT contact_id, MAX(created_at) as last_ct FROM activities WHERE contact_id IS NOT NULL GROUP BY contact_id) sub
WHERE ct.id = sub.contact_id;

-- === Backfill deal_count ===
UPDATE companies c SET deal_count = sub.cnt
FROM (SELECT company_id, COUNT(*) as cnt FROM deals WHERE company_id IS NOT NULL GROUP BY company_id) sub
WHERE c.id = sub.company_id;

COMMIT;
