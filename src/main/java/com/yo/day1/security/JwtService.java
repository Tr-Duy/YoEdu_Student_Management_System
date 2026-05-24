package com.yo.day1.security;

import com.yo.day1.config.AppJwtProperties;
import com.yo.day1.domain.entity.Users;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Service
public class JwtService {

    public static final String TOKEN_TYPE_CLAIM = "tokenType";
    public static final String ACCESS_TOKEN_TYPE = "access";
    public static final String REFRESH_TOKEN_TYPE = "refresh";

    private final AppJwtProperties properties;
    private final SecretKey secretKey;

    public JwtService(AppJwtProperties properties) {
        this.properties = properties;
        this.secretKey = Keys.hmacShaKeyFor(properties.secret().getBytes(StandardCharsets.UTF_8));
    }

    // dùng trong AuthServiceImpl: generateAccessToken(user.getUsername())
    public String generateAccessToken(String username) {
        Instant now = Instant.now();
        Instant expiresAt = now.plusSeconds(properties.accessTokenTtlMinutes() * 60);
        return Jwts.builder()
                .issuer(properties.issuer())
                .subject(username)
                .id(generateJti())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiresAt))
                .claim(TOKEN_TYPE_CLAIM, ACCESS_TOKEN_TYPE)
                .signWith(secretKey)
                .compact();
    }

    // overload dùng khi cần truyền Users để embed thêm claims
    public String generateAccessToken(Users user) {
        Instant now = Instant.now();
        Instant expiresAt = now.plusSeconds(properties.accessTokenTtlMinutes() * 60);
        return Jwts.builder()
                .issuer(properties.issuer())
                .subject(user.getUsername())
                .id(generateJti())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiresAt))
                .claim(TOKEN_TYPE_CLAIM, ACCESS_TOKEN_TYPE)
                .claim("roles", List.of(user.getRole().name()))
                .claim("userId", user.getId())
                .claim("fullName", user.getFullName())
                .claim("parentId", user.getParent() != null ? user.getParent().getId() : null)
                .claim("teacherId", user.getTeacher() != null ? user.getTeacher().getId() : null)
                .signWith(secretKey)
                .compact();
    }

    // dùng trong AuthServiceImpl: generateRefreshToken(user.getUsername())
    public String generateRefreshToken(String username) {
        Instant now = Instant.now();
        Instant expiresAt = now.plusSeconds(properties.refreshTokenTtlDays() * 86400);
        return Jwts.builder()
                .issuer(properties.issuer())
                .subject(username)
                .id(generateJti())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiresAt))
                .claim(TOKEN_TYPE_CLAIM, REFRESH_TOKEN_TYPE)
                .signWith(secretKey)
                .compact();
    }

    // overload dùng khi cần truyền Users
    public String generateRefreshToken(Users user) {
        Instant now = Instant.now();
        Instant expiresAt = now.plusSeconds(properties.refreshTokenTtlDays() * 86400);
        return Jwts.builder()
                .issuer(properties.issuer())
                .subject(user.getUsername())
                .id(generateJti())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiresAt))
                .claim(TOKEN_TYPE_CLAIM, REFRESH_TOKEN_TYPE)
                .claim("userId", user.getId())
                .signWith(secretKey)
                .compact();
    }

    public String generateJti() {
        return UUID.randomUUID().toString();
    }

    public String extractUsername(String token) {
        return parseClaims(token).getSubject();
    }

    public String extractJti(String token) {
        return parseClaims(token).getId();
    }

    public Instant extractExpiration(String token) {
        Date expiration = parseClaims(token).getExpiration();
        return expiration != null ? expiration.toInstant() : null;
    }

    public List<String> extractRoles(String token) {
        Object rolesObject = parseClaims(token).get("roles");
        if (rolesObject instanceof List<?> rolesList) {
            return rolesList.stream().map(String::valueOf).toList();
        }
        return Collections.emptyList();
    }

    public boolean isAccessToken(String token) {
        try {
            return ACCESS_TOKEN_TYPE.equals(parseClaims(token).get(TOKEN_TYPE_CLAIM, String.class));
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isRefreshToken(String token) {
        try {
            return REFRESH_TOKEN_TYPE.equals(parseClaims(token).get(TOKEN_TYPE_CLAIM, String.class));
        } catch (Exception e) {
            return false;
        }
    }

    public boolean validateToken(String token) {
        try {
            Claims claims = parseClaims(token);
            return ACCESS_TOKEN_TYPE.equals(claims.get(TOKEN_TYPE_CLAIM, String.class));
        } catch (Exception e) {
            return false;
        }
    }

    public Claims parseClaims(String token) {
        return parser(token).getPayload();
    }

    private Jws<Claims> parser(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .requireIssuer(properties.issuer())
                .build()
                .parseSignedClaims(token);
    }
}
