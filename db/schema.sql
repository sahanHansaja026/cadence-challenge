-- Cadence — starting schema.
--
-- This is deliberately minimal and deliberately incomplete. It exists so the seed data
-- and the legacy reporting module have something to run against. It is NOT the schema
-- your finished system should have.
--
-- Things you will notice are missing: users, roles, commission rules, payout line items,
-- refunds, and any audit trail. Several constraints that ought to exist do not. Deciding
-- what belongs here is the assignment, not the starting point.
--
-- Replace this with real migrations once you have made your ORM/driver decision.

DROP TABLE IF EXISTS payout_runs CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS agents CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

CREATE TABLE companies (
  id          TEXT PRIMARY KEY,
  name        TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE agents (
    id          TEXT PRIMARY KEY,

    -- Link this agent profile to the logged-in user
    user_id     UUID NOT NULL UNIQUE
                REFERENCES users (id)
                ON DELETE CASCADE,

    company_id  TEXT NOT NULL
                REFERENCES companies (id)
                ON DELETE CASCADE,

    agent_code  TEXT NOT NULL,

    full_name   TEXT NOT NULL,

    status      TEXT NOT NULL DEFAULT 'ACTIVE'
                CHECK (status IN ('ACTIVE', 'INACTIVE')),

    ended_at    DATE,

    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Agent codes are unique within a company
    CONSTRAINT agents_company_code_unique
        UNIQUE (company_id, agent_code)
);

CREATE TABLE bookings (
  id            TEXT PRIMARY KEY,
  company_id    TEXT NOT NULL REFERENCES companies (id) ON DELETE CASCADE,
  external_ref  TEXT NOT NULL,
  agent_code    TEXT NOT NULL,
  booking_date  DATE NOT NULL,
  amount        NUMERIC(14, 2) NOT NULL,
  currency      CHAR(3) NOT NULL DEFAULT 'LKR',
  product_code  TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT bookings_company_external_ref_unique
    UNIQUE (company_id, external_ref)
);

CREATE INDEX bookings_company_date_idx ON bookings (company_id, booking_date);
CREATE INDEX bookings_company_agent_idx ON bookings (company_id, agent_code);

CREATE TABLE payout_runs (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    run_no INTEGER NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('DRAFT', 'FINALISED')),
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE(company_id, run_no)
);

CREATE TABLE payout_line_items (
    id TEXT PRIMARY KEY,
    payout_run_id TEXT NOT NULL REFERENCES payout_runs(id),
    agent_code TEXT NOT NULL,
    booking_count INTEGER NOT NULL,
    gross_volume NUMERIC(12,2) NOT NULL,
    commission_rate NUMERIC(8,5) NOT NULL,
    commission_amount NUMERIC(12,2) NOT NULL
);

-- create user table for signup and login and identify user
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id TEXT NOT NULL
        REFERENCES companies(id)
        ON DELETE CASCADE,

    email VARCHAR(255) NOT NULL,
    password_hash TEXT NOT NULL,

    role VARCHAR(20) NOT NULL
        CHECK (role IN ('COMPANY_ADMIN', 'FINANCE', 'AGENT')), --three rolles 

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (company_id, email)
);