package com.yo.day1.repository;

import com.yo.day1.domain.entity.Users;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<Users, Long> {
    Optional<Users> findByUsername(String username);
    Optional<Users> findByUsernameAndIsActiveTrue(String username);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
}
