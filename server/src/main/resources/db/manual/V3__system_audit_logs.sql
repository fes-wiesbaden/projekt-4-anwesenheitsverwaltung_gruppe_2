CREATE TABLE IF NOT EXISTS system_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_username VARCHAR(120) NOT NULL,
    action_type VARCHAR(80) NOT NULL,
    entity_type VARCHAR(80) NOT NULL,
    entity_id VARCHAR(120),
    description VARCHAR(1000),
    before_value TEXT,
    after_value TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_system_audit_created ON system_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_system_audit_actor ON system_audit_logs(actor_username);
