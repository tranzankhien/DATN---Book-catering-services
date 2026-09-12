package org.aplication.backend.service.impl.shared;

import java.util.Map;
import org.aplication.backend.service.interfaces.shared.OtpService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;

@Service
public class TwilioOtpService implements OtpService {
    private final boolean enabled;
    private final String serviceSid;
    private final RestClient client;

    public TwilioOtpService(@Value("${twilio.verify.enabled:false}") boolean enabled,
                            @Value("${twilio.api-key-sid:}") String apiKeySid,
                            @Value("${twilio.api-key-secret:}") String apiKeySecret,
                            @Value("${twilio.verify.service-sid:}") String serviceSid,
                            @Value("${twilio.verify.base-url:https://verify.twilio.com/v2/Services}") String baseUrl) {
        this.enabled = enabled;
        this.serviceSid = serviceSid;
        this.client = RestClient.builder()
                .baseUrl(baseUrl + "/" + serviceSid)
                .defaultHeaders(headers -> headers.setBasicAuth(apiKeySid, apiKeySecret))
                .build();
    }

    @Override
    public void sendSms(String phone) {
        if (!enabled) return;
        var form = new LinkedMultiValueMap<String, String>();
        form.add("To", phone); form.add("Channel", "sms");
        client.post().uri("/Verifications").contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form).retrieve().toBodilessEntity();
    }

    @Override
    public boolean verifySms(String phone, String code) {
        if (!enabled) return "000000".equals(code);
        var form = new LinkedMultiValueMap<String, String>();
        form.add("To", phone); form.add("Code", code);
        try {
            Map<?, ?> response = client.post().uri("/VerificationCheck")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED).body(form)
                    .retrieve().body(Map.class);
            return response != null && "approved".equals(response.get("status"));
        } catch (RuntimeException exception) {
            return false;
        }
    }
}
