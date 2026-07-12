-- =====================================================================
-- AssetFlow Database Schema v2 (Corrected & Complete)
-- Target: PostgreSQL 14+ (Supabase / Neon compatible)
-- Assumptions locked in for this version (confirm before implementation):
--   1. SINGLE-TENANT deployment (one organization per DB). If multi-tenant
--      SaaS is actually needed, every table below needs an org_id column
--      and every UNIQUE constraint must be re-scoped per org.
--   2. Asset RETURN is a TWO-STEP flow (holder initiates, Asset Manager
--      approves) per PRD's "Asset Manager approves returns" language.
--   3. When an allocated asset enters Under Maintenance, the allocation
--      is PAUSED (not closed) and resumes automatically on Resolved.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. EXTENSIONS
-- ---------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;    -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS btree_gist;  -- REQUIRED for the exclusion
                                            -- constraint on resource_bookings
                                            -- (UUID equality inside GiST).
                                            -- Constraint creation FAILS
                                            -- without this extension.

-- ---------------------------------------------------------------------
-- 1. MASTER DATA
-- ---------------------------------------------------------------------

CREATE TABLE departments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) UNIQUE NOT NULL,
    parent_id       UUID REFERENCES departments(id) ON DELETE SET NULL,
    head_user_id    UUID,  -- FK added after users table exists (circular ref)
    status          TEXT NOT NULL DEFAULT 'Active'
                    CHECK (status IN ('Active','Inactive')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    department_id   UUID REFERENCES departments(id) ON DELETE SET NULL,
    role            TEXT NOT NULL DEFAULT 'Employee'
                    CHECK (role IN ('Employee','DepartmentHead','AssetManager','Admin')),
    status          TEXT NOT NULL DEFAULT 'Active'
                    CHECK (status IN ('Active','Inactive')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Now that users exists, wire the circular FK on departments.
ALTER TABLE departments
    ADD CONSTRAINT fk_departments_head_user
    FOREIGN KEY (head_user_id) REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX idx_users_department_id ON users(department_id);
CREATE INDEX idx_users_role ON users(role);

CREATE TABLE password_reset_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      VARCHAR(255) NOT NULL,
    expires_at      TIMESTAMPTZ NOT NULL,
    used_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_reset_tokens_user_id ON password_reset_tokens(user_id);

CREATE TABLE categories (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(50) UNIQUE NOT NULL,
    custom_fields   JSONB,  -- e.g. {"warranty_months": 12}
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 2. CORE INVENTORY
-- ---------------------------------------------------------------------

CREATE TABLE assets (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_tag           VARCHAR(20) UNIQUE NOT NULL,   -- DB-generated, e.g. AF-0001
    qr_code_value       VARCHAR(255) UNIQUE,           -- encodes asset_tag or a short link
    category_id         UUID REFERENCES categories(id) ON DELETE RESTRICT,
    name                VARCHAR(150) NOT NULL,
    serial_number       VARCHAR(100) UNIQUE,
    acquisition_date    DATE NOT NULL,
    acquisition_cost    DECIMAL(10,2) CHECK (acquisition_cost >= 0),
    condition           TEXT NOT NULL DEFAULT 'Good'
                        CHECK (condition IN ('New','Good','Fair','Poor','Damaged')),
    location            VARCHAR(150) NOT NULL,
    is_shared           BOOLEAN NOT NULL DEFAULT FALSE,  -- bookable flag
    status              TEXT NOT NULL DEFAULT 'Available'
                        CHECK (status IN (
                            'Available','Allocated','Reserved',
                            'Under Maintenance','Lost','Retired','Disposed'
                        )),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_category_id ON assets(category_id);
CREATE INDEX idx_assets_location ON assets(location);
CREATE INDEX idx_assets_is_shared ON assets(is_shared) WHERE is_shared = TRUE;

-- Generic attachment table for asset photos/docs and maintenance photos.
CREATE TABLE attachments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type     TEXT NOT NULL CHECK (entity_type IN ('Asset','MaintenanceRequest')),
    entity_id       UUID NOT NULL,
    file_url        TEXT NOT NULL,
    mime_type       VARCHAR(100) NOT NULL,
    size_bytes      INTEGER NOT NULL CHECK (size_bytes <= 5242880), -- 5MB cap
    uploaded_by     UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_attachments_entity ON attachments(entity_type, entity_id);

-- ---------------------------------------------------------------------
-- 3. OPERATIONS: ALLOCATIONS, TRANSFERS, RETURNS
-- ---------------------------------------------------------------------

CREATE TABLE allocations (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id                UUID NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
    assigned_user_id        UUID REFERENCES users(id) ON DELETE RESTRICT,
    assigned_dept_id        UUID REFERENCES departments(id) ON DELETE RESTRICT,
    allocated_by            UUID NOT NULL REFERENCES users(id),
    allocated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    expected_return_date    DATE,
    is_paused_for_maintenance BOOLEAN NOT NULL DEFAULT FALSE,
    return_status           TEXT CHECK (return_status IN ('PendingApproval','Approved','Rejected')),
    return_requested_at     TIMESTAMPTZ,
    condition_check_in_notes TEXT,
    approved_return_by      UUID REFERENCES users(id),
    returned_at             TIMESTAMPTZ,  -- populated only once return is APPROVED
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_allocation_target
        CHECK (assigned_user_id IS NOT NULL OR assigned_dept_id IS NOT NULL)
);

-- THE CRITICAL FIX: only one *active* (open) allocation per asset at a time.
-- This is the actual enforcement of the PRD's "no double allocation" rule.
CREATE UNIQUE INDEX one_active_allocation_per_asset
    ON allocations(asset_id) WHERE returned_at IS NULL;

CREATE INDEX idx_allocations_asset_id ON allocations(asset_id);
CREATE INDEX idx_allocations_assigned_user ON allocations(assigned_user_id);
CREATE INDEX idx_allocations_assigned_dept ON allocations(assigned_dept_id);
CREATE INDEX idx_allocations_overdue
    ON allocations(expected_return_date) WHERE returned_at IS NULL;

CREATE TABLE transfers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id            UUID NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
    allocation_id       UUID NOT NULL REFERENCES allocations(id) ON DELETE RESTRICT,
    requested_by        UUID NOT NULL REFERENCES users(id),
    requested_to_type   TEXT NOT NULL CHECK (requested_to_type IN ('Employee','Department')),
    requested_to_id     UUID NOT NULL,
    reason              TEXT,
    status              TEXT NOT NULL DEFAULT 'Requested'
                        CHECK (status IN ('Requested','Approved','Rejected','Re-allocated')),
    approved_by         UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_transfers_asset_id ON transfers(asset_id);
CREATE INDEX idx_transfers_status ON transfers(status);

-- ---------------------------------------------------------------------
-- 4. RESOURCE BOOKINGS (Time-Slot Engine)
-- ---------------------------------------------------------------------

CREATE TABLE resource_bookings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id        UUID NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
    booked_by_id    UUID NOT NULL REFERENCES users(id),
    booked_for_type TEXT NOT NULL DEFAULT 'Self' CHECK (booked_for_type IN ('Self','Department')),
    booked_for_dept_id UUID REFERENCES departments(id),
    booking_range   TSTZRANGE NOT NULL,  -- tstzrange, NOT tsrange: avoids
                                          -- timezone/DST correctness bugs
    status          TEXT NOT NULL DEFAULT 'Upcoming'
                    CHECK (status IN ('Upcoming','Ongoing','Completed','Cancelled')),
    cancellation_reason TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- THE CRITICAL FIX: excludes only against NON-cancelled bookings.
    -- Without the WHERE clause, a new booking would be wrongly blocked
    -- by a slot that was already cancelled.
    EXCLUDE USING gist (
        asset_id WITH =,
        booking_range WITH &&
    ) WHERE (status <> 'Cancelled')
);

CREATE INDEX idx_bookings_asset_id ON resource_bookings(asset_id);
CREATE INDEX idx_bookings_status ON resource_bookings(status);

-- ---------------------------------------------------------------------
-- 5. MAINTENANCE WORKFLOW
-- ---------------------------------------------------------------------

CREATE TABLE maintenance_requests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id        UUID NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
    requested_by    UUID NOT NULL REFERENCES users(id),
    description     TEXT NOT NULL,
    priority        TEXT NOT NULL DEFAULT 'Medium'
                    CHECK (priority IN ('Low','Medium','High','Critical')),
    status          TEXT NOT NULL DEFAULT 'Pending'
                    CHECK (status IN (
                        'Pending','Approved','Rejected',
                        'TechnicianAssigned','InProgress','Resolved'
                    )),
    approved_by     UUID REFERENCES users(id),
    technician_name VARCHAR(150),
    resolution_notes TEXT,
    resolved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_maintenance_asset_id ON maintenance_requests(asset_id);
CREATE INDEX idx_maintenance_status ON maintenance_requests(status);

-- ---------------------------------------------------------------------
-- 6. AUDITS
-- ---------------------------------------------------------------------

CREATE TABLE audit_cycles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope_type      TEXT NOT NULL CHECK (scope_type IN ('Department','Location')),
    scope_value     TEXT NOT NULL,  -- department_id (as text) or a location string
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    status          TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open','Closed')),
    closed_at       TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (end_date >= start_date)
);

-- Many-to-many: a cycle can have multiple auditors assigned.
CREATE TABLE audit_cycle_auditors (
    audit_cycle_id  UUID NOT NULL REFERENCES audit_cycles(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    PRIMARY KEY (audit_cycle_id, user_id)
);

CREATE TABLE audit_items (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_cycle_id      UUID NOT NULL REFERENCES audit_cycles(id) ON DELETE CASCADE,
    asset_id            UUID NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
    verified_by         UUID REFERENCES users(id),  -- which auditor recorded this item
    verification        TEXT NOT NULL DEFAULT 'Pending'
                        CHECK (verification IN ('Pending','Verified','Missing','Damaged')),
    discrepancy_note    TEXT,
    verified_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (audit_cycle_id, asset_id)
);
CREATE INDEX idx_audit_items_cycle_id ON audit_items(audit_cycle_id);
CREATE INDEX idx_audit_items_verification ON audit_items(verification);

-- ---------------------------------------------------------------------
-- 7. ACTIVITY LOG & NOTIFICATIONS
-- ---------------------------------------------------------------------

CREATE TABLE activity_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    action          VARCHAR(100) NOT NULL,  -- e.g. 'AssetAllocated', 'MaintenanceApproved'
    target_entity   VARCHAR(50) NOT NULL,   -- e.g. 'Asset', 'Transfer'
    target_id       UUID,
    metadata        JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_target ON activity_logs(target_entity, target_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type            VARCHAR(50) NOT NULL,  -- e.g. 'OverdueReturn', 'TransferApproved'
    message         TEXT NOT NULL,
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    related_entity  VARCHAR(50),
    related_id      UUID,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user_unread
    ON notifications(user_id) WHERE is_read = FALSE;

-- =====================================================================
-- END OF SCHEMA
-- =====================================================================

-- ---------------------------------------------------------------------
-- TRIGGERS FOR updated_at
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_departments_modtime BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_categories_modtime BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_assets_modtime BEFORE UPDATE ON assets FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_allocations_modtime BEFORE UPDATE ON allocations FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_transfers_modtime BEFORE UPDATE ON transfers FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_resource_bookings_modtime BEFORE UPDATE ON resource_bookings FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_maintenance_requests_modtime BEFORE UPDATE ON maintenance_requests FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_audit_cycles_modtime BEFORE UPDATE ON audit_cycles FOR EACH ROW EXECUTE FUNCTION update_modified_column();
