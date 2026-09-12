package org.aplication.backend.common.utils;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;
import javax.crypto.SecretKey;
import org.aplication.backend.entity.auth.UserEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JwtUtils {
    private static final Logger LOGGER = LoggerFactory.getLogger(JwtUtils.class);

    private final SecretKey key;
    private final String issuer;
    private final long accessTtlSeconds;

    public JwtUtils(@Value("${jwt.secret}") String secret,
                    @Value("${jwt.issuer}") String issuer,
                    @Value("${jwt.access-ttl-seconds}") long accessTtlSeconds,
                    @Value("${jwt.allow-ephemeral-secret:false}") boolean allowEphemeralSecret) {
        if (secret.isBlank()) {
            if (!allowEphemeralSecret) {
                throw new IllegalStateException("JWT_SECRET must be configured outside local development");
            }
            this.key = Jwts.SIG.HS256.key().build();
            LOGGER.warn("JWT_SECRET is not configured; using an ephemeral local-development key");
        } else {
            this.key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
        }
        this.issuer = issuer;
        this.accessTtlSeconds = accessTtlSeconds;
    }

    public String createAccessToken(UserEntity user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(user.getId().toString())
                .issuer(issuer)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(accessTtlSeconds)))
                .claim("role", user.getRole().name())
                .claim("type", "access")
                .signWith(key)
                .compact();
    }

    public AccessClaims parseAccessToken(String token) {
        Claims claims = Jwts.parser().verifyWith(key).requireIssuer(issuer).build()
                .parseSignedClaims(token).getPayload();
        if (!"access".equals(claims.get("type", String.class))) {
            throw new IllegalArgumentException("Unexpected token type");
        }
        return new AccessClaims(UUID.fromString(claims.getId()), UUID.fromString(claims.getSubject()),
                claims.get("role", String.class), claims.getExpiration().toInstant());
    }

    public long getAccessTtlSeconds() { return accessTtlSeconds; }

    public record AccessClaims(UUID jti, UUID userId, String role, Instant expiresAt) {}
}
