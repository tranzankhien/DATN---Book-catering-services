package org.aplication.backend.entity.order;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.UUID;
import org.aplication.backend.common.base.BaseEntity;
import org.aplication.backend.common.enums.OrderItemType;

@Entity
@Table(name = "order_items")
public class OrderItemEntity extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private OrderEntity order;
    @Enumerated(EnumType.STRING)
    @Column(name = "item_type", nullable = false, length = 20)
    private OrderItemType itemType;
    @Column(name = "reference_id", nullable = false)
    private UUID referenceId;
    @Column(name = "item_name", nullable = false, length = 200)
    private String itemName;
    @Column(nullable = false, precision = 12, scale = 3)
    private BigDecimal quantity;
    @Column(name = "unit_price", nullable = false, precision = 14, scale = 2)
    private BigDecimal unitPrice;
    @Column(name = "line_total", nullable = false, precision = 14, scale = 2)
    private BigDecimal lineTotal;

    protected OrderItemEntity() {}
    public OrderItemEntity(OrderItemType itemType, UUID referenceId, String itemName,
                           BigDecimal quantity, BigDecimal unitPrice) {
        this.itemType = itemType; this.referenceId = referenceId; this.itemName = itemName;
        this.quantity = quantity; this.unitPrice = unitPrice; this.lineTotal = unitPrice.multiply(quantity);
    }
    void attach(OrderEntity order) { this.order = order; }
    public UUID getId() { return super.getId(); }
    public OrderItemType getItemType() { return itemType; }
    public UUID getReferenceId() { return referenceId; }
    public String getItemName() { return itemName; }
    public BigDecimal getQuantity() { return quantity; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public BigDecimal getLineTotal() { return lineTotal; }
}
