package org.aplication.backend.service.interfaces.shared;

import org.aplication.backend.dto.request.user.RegisterRequest;
import org.aplication.backend.dto.request.user.RegistrationDetailsRequest;
import org.aplication.backend.dto.request.user.VerifyRegistrationRequest;
import org.aplication.backend.dto.response.shared.AuthResponse;
import org.aplication.backend.dto.response.shared.RegistrationStartedResponse;

public interface AuthService {
    RegistrationStartedResponse startRegistration(RegisterRequest request);
    void completeRegistrationDetails(RegistrationDetailsRequest request);
    AuthResult verifyRegistration(VerifyRegistrationRequest request);
    AuthResult loginUser(String email, String password);
    AuthResult loginAdminOrStaff(String email, String password);
    AuthResult refresh(String refreshToken);
    void logout(String accessToken, String refreshToken);

    record AuthResult(AuthResponse response, String refreshToken) {}
}
