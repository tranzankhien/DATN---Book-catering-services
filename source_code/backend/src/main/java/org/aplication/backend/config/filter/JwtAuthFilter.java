package org.aplication.backend.config.filter;

import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.Set;
import org.aplication.backend.common.utils.JwtUtils;
import org.aplication.backend.repository.auth.RevokedAccessTokenRepository;
import org.aplication.backend.repository.auth.UserRepository;
import org.springframework.boot.web.servlet.FilterRegistration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@FilterRegistration(enabled = false)
public class JwtAuthFilter extends OncePerRequestFilter {
    private static final Set<String> PUBLIC_PATHS = Set.of(
            "/api/auth/user/register/start", "/api/auth/user/register/details", "/api/auth/user/register/verify",
            "/api/auth/user/login",
            "/api/auth/admin/login",
            "/api/auth/refresh",
            "/actuator/health");

    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;
    private final RevokedAccessTokenRepository revokedTokenRepository;

    public JwtAuthFilter(JwtUtils jwtUtils, UserRepository userRepository,
                         RevokedAccessTokenRepository revokedTokenRepository) {
        this.jwtUtils = jwtUtils;
        this.userRepository = userRepository;
        this.revokedTokenRepository = revokedTokenRepository;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return PUBLIC_PATHS.contains(request.getRequestURI());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header == null || !header.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }
        try {
            JwtUtils.AccessClaims claims = jwtUtils.parseAccessToken(header.substring(7));
            if (revokedTokenRepository.existsById(claims.jti())) {
                response.setStatus(HttpStatus.UNAUTHORIZED.value());
                return;
            }
            var user = userRepository.findById(claims.userId()).filter(u -> u.isActive()).orElse(null);
            if (user == null || !user.getRole().name().equals(claims.role())) {
                response.setStatus(HttpStatus.UNAUTHORIZED.value());
                return;
            }
            var authentication = new UsernamePasswordAuthenticationToken(user.getId(), null,
                    List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())));
            SecurityContextHolder.getContext().setAuthentication(authentication);
            filterChain.doFilter(request, response);
        } catch (JwtException | IllegalArgumentException exception) {
            SecurityContextHolder.clearContext();
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
        }
    }
}
