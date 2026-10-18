package com.banquethub.modules.payments.service;
import org.springframework.stereotype.Service;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.*;
@Service
public class PaymentAuditService {
    private final JdbcTemplate jdbc;
    public PaymentAuditService(JdbcTemplate jdbc){this.jdbc=jdbc;}
    @Transactional(propagation=Propagation.REQUIRES_NEW)
    public void record(String reference,String source,String code,String detail){
        jdbc.update("insert into payment_notification_logs(transaction_reference,source,result_code,detail) values (?,?,?,?)",
            reference!=null && reference.matches("[A-Za-z0-9]{1,64}")?reference:null,source,code,detail);
    }
}
