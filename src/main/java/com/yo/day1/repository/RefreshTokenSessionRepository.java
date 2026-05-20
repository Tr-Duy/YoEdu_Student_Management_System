package com.yo.day1.repository;

import com.yo.day1.domain.entity.RefreshTokenSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RefreshTokenSessionRepository extends JpaRepository<RefreshTokenSession, Long> {
    Optional<RefreshTokenSession> findByJti(String jti);
    List<RefreshTokenSession> findByUserIdAndIsRevokedFalse(Long userId);
    Optional<RefreshTokenSession> findByJtiAndIsRevokedFalse(String jti);
}
