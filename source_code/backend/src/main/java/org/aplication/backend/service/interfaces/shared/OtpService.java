package org.aplication.backend.service.interfaces.shared;

/** Abstraction for sending and checking one-time passwords. */
public interface OtpService {
    void sendSms(String phone);
    boolean verifySms(String phone, String code);
}
