-- Optional request-log schema; the service runs without a database and never writes to it.
-- Columns mirror the request_completed log event for offline ingestion.
-- Standard SQL intended for PostgreSQL and SQLite; the automated tests apply it on SQLite only.

CREATE TABLE IF NOT EXISTS request_log (
    request_id   VARCHAR(36)    PRIMARY KEY,
    occurred_at  TIMESTAMP      NOT NULL,
    environment  VARCHAR(16)    NOT NULL CHECK (environment IN ('staging', 'production')),
    transport    VARCHAR(5)     NOT NULL CHECK (transport IN ('http', 'https')),
    method       VARCHAR(16)    NOT NULL,
    path         VARCHAR(256),
    status_code  SMALLINT       NOT NULL CHECK (status_code BETWEEN 100 AND 599),
    duration_ms  NUMERIC(12, 3) NOT NULL CHECK (duration_ms >= 0),
    aborted      BOOLEAN        NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_request_log_occurred_at ON request_log (occurred_at);
CREATE INDEX IF NOT EXISTS idx_request_log_status_time ON request_log (status_code, occurred_at);
CREATE INDEX IF NOT EXISTS idx_request_log_path_time ON request_log (path, occurred_at);
