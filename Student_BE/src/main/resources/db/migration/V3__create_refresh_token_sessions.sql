CREATE TABLE refresh_token_sessions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    jti VARCHAR(100) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    expires_at DATETIME(6) NOT NULL,
    revoked_at DATETIME(6),
    replaced_by_jti VARCHAR(100),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_refresh_token_sessions_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_refresh_token_sessions_user_revoked ON refresh_token_sessions(user_id, revoked_at);
CREATE INDEX idx_refresh_token_sessions_expires_revoked ON refresh_token_sessions(expires_at, revoked_at);