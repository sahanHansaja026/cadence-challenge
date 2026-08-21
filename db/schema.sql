-- Cadence — database schema

DROP TABLE IF EXISTS payout_line_items CASCADE;
DROP TABLE IF EXISTS payout_runs CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS agents CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS companies CASCADE;


-- =========================================================
-- COMPANIES
-- =========================================================

CREATE TABLE companies (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- =========================================================
-- USERS
-- =========================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id TEXT NOT NULL
        REFERENCES companies(id)
        ON DELETE CASCADE,

    email VARCHAR(255) NOT NULL,

    password_hash TEXT NOT NULL,

    role VARCHAR(20) NOT NULL
        CHECK (
            role IN (
                'COMPANY_ADMIN',
                'FINANCE',
                'AGENT'
            )
        ),

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (company_id, email)
);


-- =========================================================
-- AGENTS
-- =========================================================

CREATE TABLE agents (
    id TEXT PRIMARY KEY,

    -- Links the agent profile to the authenticated user.
    -- This is NOT the same value as users.id.
    user_id UUID NOT NULL UNIQUE
        REFERENCES users(id)
        ON DELETE CASCADE,

    company_id TEXT NOT NULL
        REFERENCES companies(id)
        ON DELETE CASCADE,

    agent_code TEXT NOT NULL,

    full_name TEXT NOT NULL,

    status TEXT NOT NULL DEFAULT 'ACTIVE'
        CHECK (
            status IN (
                'ACTIVE',
                'INACTIVE'
            )
        ),

    ended_at DATE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Agent code is unique inside a company.
    CONSTRAINT agents_company_code_unique
        UNIQUE (company_id, agent_code)
);


CREATE INDEX agents_company_idx
    ON agents(company_id);

CREATE INDEX agents_user_idx
    ON agents(user_id);


-- =========================================================
-- BOOKINGS
-- =========================================================

CREATE TABLE bookings (
    id TEXT PRIMARY KEY,

    company_id TEXT NOT NULL
        REFERENCES companies(id)
        ON DELETE CASCADE,

    external_ref TEXT NOT NULL,

    agent_code TEXT NOT NULL,

    booking_date DATE NOT NULL,

    amount NUMERIC(14, 2) NOT NULL,

    currency CHAR(3) NOT NULL DEFAULT 'LKR',

    product_code TEXT NOT NULL,

    -- Booking lifecycle status.
    status TEXT NOT NULL DEFAULT 'ACTIVE'
        CHECK (
            status IN (
                'ACTIVE',
                'REJECTED'
            )
        ),

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- External booking reference must be unique
    -- within a company.
    CONSTRAINT bookings_company_external_ref_unique
        UNIQUE (company_id, external_ref)
);


CREATE INDEX bookings_company_date_idx
    ON bookings(company_id, booking_date);

CREATE INDEX bookings_company_agent_idx
    ON bookings(company_id, agent_code);

CREATE INDEX bookings_company_status_idx
    ON bookings(company_id, status);


-- =========================================================
-- PAYOUT RUNS
-- =========================================================

CREATE TABLE payout_runs (
    id TEXT PRIMARY KEY,

    company_id TEXT NOT NULL,

    run_no INTEGER NOT NULL,

    period_start DATE NOT NULL,

    period_end DATE NOT NULL,

    status TEXT NOT NULL
        CHECK (
            status IN (
                'DRAFT',
                'FINALISED'
            )
        ),

    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE(company_id, run_no)
);


-- =========================================================
-- PAYOUT LINE ITEMS
-- =========================================================

CREATE TABLE payout_line_items (
    id TEXT PRIMARY KEY,

    payout_run_id TEXT NOT NULL
        REFERENCES payout_runs(id)
        ON DELETE CASCADE,

    agent_code TEXT NOT NULL,

    booking_count INTEGER NOT NULL,

    gross_volume NUMERIC(12, 2) NOT NULL,

    commission_rate NUMERIC(8, 5) NOT NULL,

    commission_amount NUMERIC(12, 2) NOT NULL
);