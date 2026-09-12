package org.aplication.backend.common.constants;

public class RegexConstants {
    private RegexConstants() {}

    public static final String PHONE = "^[+]?[0-9][0-9 .-]{7,18}$";
    public static final String PASSWORD = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).+$";
    public static final String OTP = "^\\d{6}$";
}
