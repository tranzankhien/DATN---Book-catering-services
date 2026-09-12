package org.aplication.backend.entity.order;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.aplication.backend.common.base.BaseEntity;
import org.aplication.backend.common.enums.OrderStatus;
import org.aplication.backend.common.enums.ServiceLocation;
import org.aplication.backend.entity.auth.UserEntity;
import org.aplication.backend.entity.catalog.HallEntity;

@Entity
@Table(name = "orders")
public class OrderEntity extends BaseEntity {
    @Column(name = "order_code", nullable = false, unique = true, length = 30)
    private String orderCode;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private UserEntity customer;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hall_id")
    private HallEntity hall;
    @Enumerated(EnumType.STRING)
    @Column(name = "service_location", nullable = false, length = 20)
    private ServiceLocation serviceLocation;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private OrderStatus status;
    @Column(name = "event_start", nullable = false)
    private Instant eventStart;
    @Column(name = "event_end", nullable = false)
    private Instant eventEnd;
    @Column(name = "guest_count", nullable = false)
    private int guestCount;
    @Column(name = "contact_name", nullable = false, length = 120)
    private String contactName;
    @Column(name = "contact_phone", nullable = false, length = 20)
    private String contactPhone;
    @Column(name = "event_address", columnDefinition = "text")
    private String eventAddress;
    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;
    @Column(columnDefinition = "text")
    private String note;
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItemEntity> items = new ArrayList<>();

    protected OrderEntity() {}
    public OrderEntity(String orderCode, UserEntity customer, HallEntity hall, ServiceLocation location,
                       Instant eventStart, Instant eventEnd, int guestCount, String contactName,
                       String contactPhone, String eventAddress, String note) {
        this.orderCode = orderCode; this.customer = customer; this.hall = hall; this.serviceLocation = location;
        this.status = OrderStatus.PENDING_CONFIRMATION; this.eventStart = eventStart; this.eventEnd = eventEnd;
        this.guestCount = guestCount; this.contactName = contactName; this.contactPhone = contactPhone;
        this.eventAddress = eventAddress; this.note = note;
    }
    public void addItem(OrderItemEntity item) { items.add(item); item.attach(this); }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    public void changeStatus(OrderStatus status) { this.status = status; }
    public UUID getId() { return super.getId(); }
    public String getOrderCode() { return orderCode; }
    public HallEntity getHall() { return hall; }
    public ServiceLocation getServiceLocation() { return serviceLocation; }
    public OrderStatus getStatus() { return status; }
    public Instant getEventStart() { return eventStart; }
    public Instant getEventEnd() { return eventEnd; }
    public int getGuestCount() { return guestCount; }
    public String getContactName() { return contactName; }
    public String getContactPhone() { return contactPhone; }
    public String getEventAddress() { return eventAddress; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public String getNote() { return note; }
    public List<OrderItemEntity> getItems() { return items; }
}
