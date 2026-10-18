package com.banquethub.modules.payments.entity;
import jakarta.persistence.*;
import com.banquethub.modules.orders.entity.Order;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
@Entity @Table(name="payment_transactions")
public class PaymentTransaction {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="order_id",nullable=false)
    private Order order;
    @Column(nullable=false,length=20)
    private String provider;
    @Column(nullable=false,unique=true,length=64)
    private String transactionReference;
    @Column(length=100)
    private String providerTransactionNo;
    @Column(nullable=false,precision=15,scale=2)
    private BigDecimal amount;
    @Column(nullable=false,length=3)
    private String currency;
    @Column(nullable=false,length=30)
    private String status;
    @Column(length=2)
    private String responseCode;
    @Column(length=2)
    private String transactionStatus;
    @Column(length=20)
    private String bankCode;
    @Column(length=14)
    private String payDate;
    @Column(nullable=false,columnDefinition="text")
    private String paymentUrl;
    @Column(length=500)
    private String failureReason;
    @Column(nullable=false)
    private OffsetDateTime createdAt;
    @Column(nullable=false)
    private OffsetDateTime updatedAt;
    
    private OffsetDateTime paidAt;
    @Column(nullable=false)
    private OffsetDateTime expiresAt;
    
    private OffsetDateTime lastQueriedAt;
    @Column(nullable=false)
    private int queryCount;
    public PaymentTransaction() {}
    public Long getId() { return id; }
    public void setId(Long value) { this.id=value; }
    public Order getOrder() { return order; }
    public void setOrder(Order value) { this.order=value; }
    public String getProvider() { return provider; }
    public void setProvider(String value) { this.provider=value; }
    public String getTransactionReference() { return transactionReference; }
    public void setTransactionReference(String value) { this.transactionReference=value; }
    public String getProviderTransactionNo() { return providerTransactionNo; }
    public void setProviderTransactionNo(String value) { this.providerTransactionNo=value; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal value) { this.amount=value; }
    public String getCurrency() { return currency; }
    public void setCurrency(String value) { this.currency=value; }
    public String getStatus() { return status; }
    public void setStatus(String value) { this.status=value; }
    public String getResponseCode() { return responseCode; }
    public void setResponseCode(String value) { this.responseCode=value; }
    public String getTransactionStatus() { return transactionStatus; }
    public void setTransactionStatus(String value) { this.transactionStatus=value; }
    public String getBankCode() { return bankCode; }
    public void setBankCode(String value) { this.bankCode=value; }
    public String getPayDate() { return payDate; }
    public void setPayDate(String value) { this.payDate=value; }
    public String getPaymentUrl() { return paymentUrl; }
    public void setPaymentUrl(String value) { this.paymentUrl=value; }
    public String getFailureReason() { return failureReason; }
    public void setFailureReason(String value) { this.failureReason=value; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime value) { this.createdAt=value; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime value) { this.updatedAt=value; }
    public OffsetDateTime getPaidAt() { return paidAt; }
    public void setPaidAt(OffsetDateTime value) { this.paidAt=value; }
    public OffsetDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(OffsetDateTime value) { this.expiresAt=value; }
    public OffsetDateTime getLastQueriedAt() { return lastQueriedAt; }
    public void setLastQueriedAt(OffsetDateTime value) { this.lastQueriedAt=value; }
    public int getQueryCount() { return queryCount; }
    public void setQueryCount(int value) { this.queryCount=value; }
    @PreUpdate public void touch() { updatedAt=OffsetDateTime.now(); }
}
