package org.aplication.backend.service.impl.shared;

import static org.aplication.backend.common.constants.ErrorCode.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.Duration;
import java.util.HexFormat;
import java.util.UUID;
import org.aplication.backend.common.enums.UserRole;
import org.aplication.backend.common.exception.CustomBusinessException;
import org.aplication.backend.common.utils.JwtUtils;
import org.aplication.backend.dto.request.user.RegisterRequest;
import org.aplication.backend.dto.request.user.RegistrationDetailsRequest;
import org.aplication.backend.dto.request.user.VerifyRegistrationRequest;
import org.aplication.backend.dto.response.shared.RegistrationStartedResponse;
import org.aplication.backend.dto.response.shared.AuthResponse;
import org.aplication.backend.entity.auth.PendingRegistrationEntity;
import org.aplication.backend.entity.auth.RefreshTokenEntity;
import org.aplication.backend.entity.auth.RevokedAccessTokenEntity;
import org.aplication.backend.entity.auth.UserEntity;
import org.aplication.backend.repository.auth.PendingRegistrationRepository;
import org.aplication.backend.repository.auth.RefreshTokenRepository;
import org.aplication.backend.repository.auth.RevokedAccessTokenRepository;
import org.aplication.backend.repository.auth.UserRepository;
import org.aplication.backend.service.interfaces.shared.AuthService;
import org.aplication.backend.service.interfaces.shared.OtpService;
import org.aplication.backend.mapper.shared.AuthMapper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;

@Service
public class AuthServiceImpl implements AuthService {
    private final UserRepository users;
    private final PendingRegistrationRepository pending;
    private final RefreshTokenRepository refreshTokens;
    private final RevokedAccessTokenRepository revokedTokens;
    private final PasswordEncoder encoder;
    private final JwtUtils jwt;
    private final OtpService otp;
    private final AuthMapper authMapper;
    private final long refreshTtlSeconds;
    private final Duration registrationTtl;
    private final String defaultCountryCode;
    private final SecureRandom random = new SecureRandom();

    public AuthServiceImpl(UserRepository users, PendingRegistrationRepository pending,
                           RefreshTokenRepository refreshTokens, RevokedAccessTokenRepository revokedTokens,
                           PasswordEncoder encoder, JwtUtils jwt, OtpService otp,
                           AuthMapper authMapper,
                           @Value("${jwt.refresh-ttl-seconds:1296000}") long refreshTtlSeconds,
                           @Value("${auth.registration-ttl-seconds:600}") long registrationTtlSeconds,
                           @Value("${phone.default-country-code:+84}") String defaultCountryCode) {
        this.users = users; this.pending = pending; this.refreshTokens = refreshTokens;
        this.revokedTokens = revokedTokens; this.encoder = encoder; this.jwt = jwt; this.otp = otp;
        this.authMapper = authMapper;
        this.refreshTtlSeconds = refreshTtlSeconds;
        this.registrationTtl = Duration.ofSeconds(registrationTtlSeconds);
        this.defaultCountryCode = defaultCountryCode;
    }

    @Override
    @Transactional
    public RegistrationStartedResponse startRegistration(RegisterRequest request) {
        String email = request.email().trim().toLowerCase();
        String phone = normalizePhone(request.phone());
        if (users.existsByEmailIgnoreCase(email) || pending.findByEmailIgnoreCase(email).isPresent())
            throw new CustomBusinessException(AUTH_EMAIL_EXISTS);
        if (users.existsByPhone(phone) || pending.findByPhone(phone).isPresent())
            throw new CustomBusinessException(AUTH_PHONE_EXISTS);
        PendingRegistrationEntity registration = pending.save(new PendingRegistrationEntity(
                request.fullName().trim(), email, phone, encoder.encode(request.password()), Instant.now().plus(registrationTtl)));
        try { otp.sendSms(phone); }
        catch (RuntimeException exception) { pending.delete(registration); throw new CustomBusinessException(AUTH_OTP_SERVICE_UNAVAILABLE); }
        return new RegistrationStartedResponse(registration.getId(), registrationTtl.toSeconds());
    }

    @Override
    @Transactional
    public void completeRegistrationDetails(RegistrationDetailsRequest request) {
        PendingRegistrationEntity registration = findPending(request.registrationId());
        if (request.customerType() == RegistrationDetailsRequest.CustomerType.BUSINESS
                && (request.companyName() == null || request.companyName().isBlank()))
            throw new CustomBusinessException(VALIDATION_FAILED);
        registration.details(request.address().trim(), request.customerType(), request.companyName());
        pending.save(registration);
    }

    @Override
    @Transactional
    public AuthResult verifyRegistration(VerifyRegistrationRequest request) {
        PendingRegistrationEntity registration = findPending(request.registrationId());
        if (!otp.verifySms(registration.getPhone(), request.code()))
            throw new CustomBusinessException(AUTH_OTP_INVALID);
        if (users.existsByEmailIgnoreCase(registration.getEmail()))
            throw new CustomBusinessException(AUTH_EMAIL_EXISTS);
        if (users.existsByPhone(registration.getPhone()))
            throw new CustomBusinessException(AUTH_PHONE_EXISTS);
        if (registration.getAddress() == null || registration.getCustomerType() == null)
            throw new CustomBusinessException(VALIDATION_FAILED);
        UserEntity user = new UserEntity(registration.getFullName(), registration.getEmail(), registration.getPhone(),
                registration.getPasswordHash(), UserRole.CUSTOMER);
        user.setCustomerDetails(registration.getAddress(), registration.getCustomerType(), registration.getCompanyName());
        users.save(user);
        pending.delete(registration);
        return issue(user);
    }

    @Override @Transactional
    public AuthResult loginUser(String email, String password) {
        UserEntity user = users.findByEmailIgnoreCase(email.trim()).filter(u -> u.isActive())
                .filter(u -> u.getRole() == UserRole.CUSTOMER).orElseThrow(this::invalidCredentials);
        if (!encoder.matches(password, user.getPasswordHash())) throw invalidCredentials();
        return issue(user);
    }

    @Override @Transactional
    public AuthResult loginAdminOrStaff(String email, String password) {
        UserEntity user = users.findByEmailIgnoreCase(email.trim()).filter(u -> u.isActive())
                .filter(u -> u.getRole() != UserRole.CUSTOMER).orElseThrow(this::invalidCredentials);
        if (!encoder.matches(password, user.getPasswordHash())) throw invalidCredentials();
        return issue(user);
    }

    @Override @Transactional
    public AuthResult refresh(String rawToken) {
        RefreshTokenEntity current = refreshTokens.findByTokenHash(hash(rawToken)).orElseThrow(this::invalidToken);
        if (current.isRevoked() || current.isExpired()) {
            refreshTokens.revokeFamily(current.getFamilyId(), Instant.now());
            throw invalidToken();
        }
        String replacementRaw = randomToken();
        RefreshTokenEntity replacement = refreshTokens.save(new RefreshTokenEntity(current.getFamilyId(), current.getUser(),
                hash(replacementRaw), Instant.now().plusSeconds(refreshTtl())));
        current.revoke(replacement.getId());
        refreshTokens.save(current);
        return new AuthResult(response(current.getUser(), jwt.createAccessToken(current.getUser())), replacementRaw);
    }

    @Override @Transactional
    public void logout(String accessToken, String rawRefreshToken) {
        JwtUtils.AccessClaims claims;
        try { claims = jwt.parseAccessToken(accessToken); } catch (RuntimeException exception) { throw invalidToken(); }
        revokedTokens.save(new RevokedAccessTokenEntity(claims.jti(), claims.expiresAt()));
        refreshTokens.findByTokenHash(hash(rawRefreshToken)).ifPresent(token -> refreshTokens.revokeFamily(token.getFamilyId(), Instant.now()));
    }

    private AuthResult issue(UserEntity user) {
        String access = jwt.createAccessToken(user);
        String refresh = randomToken();
        refreshTokens.save(new RefreshTokenEntity(UUID.randomUUID(), user, hash(refresh), Instant.now().plusSeconds(refreshTtl())));
        return new AuthResult(response(user, access), refresh);
    }
    private AuthResponse response(UserEntity user, String access) {
        return authMapper.toResponse(user, access, jwt.getAccessTtlSeconds(), refreshTtl());
    }
    private PendingRegistrationEntity findPending(UUID id) {
        return pending.findById(id).filter(r -> !r.expired()).orElseThrow(() -> new CustomBusinessException(AUTH_REGISTRATION_NOT_FOUND));
    }
    private CustomBusinessException invalidCredentials() { return new CustomBusinessException(AUTH_INVALID_CREDENTIALS); }
    private CustomBusinessException invalidToken() { return new CustomBusinessException(AUTH_INVALID_TOKEN); }
    private long refreshTtl() { return refreshTtlSeconds; }
    private String randomToken() { byte[] bytes = new byte[32]; random.nextBytes(bytes); return HexFormat.of().formatHex(bytes); }
    private String hash(String raw) { try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8))); } catch (Exception e) { throw new IllegalStateException(e); } }
    private String normalizePhone(String raw) {
        String value = raw.replaceAll("[ .-]", "");
        if (value.startsWith("0")) value = defaultCountryCode + value.substring(1);
        if (!value.matches("^\\+[1-9]\\d{7,14}$")) throw new CustomBusinessException(VALIDATION_FAILED);
        return value;
    }
}
