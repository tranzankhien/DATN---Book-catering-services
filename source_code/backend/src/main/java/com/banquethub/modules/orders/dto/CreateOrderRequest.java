package com.banquethub.modules.orders.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public class CreateOrderRequest {

    @NotBlank(message = "Họ và tên người đặt không được để trống")
    @Size(max = 120, message = "Họ và tên không được vượt quá 120 ký tự")
    private String customerName;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^(0|\\+84)[0-9]{9,10}$", message = "Số điện thoại không đúng định dạng Việt Nam (10 số)")
    private String customerPhone;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    @Size(max = 150, message = "Email không được vượt quá 150 ký tự")
    private String customerEmail;

    @NotNull(message = "Ngày và giờ tổ chức tiệc không được để trống")
    @Future(message = "Thời gian tổ chức tiệc phải là thời điểm trong tương lai")
    private OffsetDateTime eventDateTime;

    @NotNull(message = "Số lượng bàn tiệc không được để trống")
    @Min(value = 1, message = "Số lượng bàn tiệc phải từ 1 trở lên")
    private Integer tableCount = 1;

    @Size(max = 1000, message = "Ghi chú không được vượt quá 1000 ký tự")
    private String note;

    @NotBlank(message = "Địa điểm tổ chức tiệc không được để trống")
    @Size(max = 255, message = "Địa điểm tổ chức không được vượt quá 255 ký tự")
    private String eventLocation;

    @jakarta.validation.constraints.DecimalMin("-90")
    @jakarta.validation.constraints.DecimalMax("90")
    @jakarta.validation.constraints.Digits(integer=3, fraction=6)
    private BigDecimal eventLatitude;

    @jakarta.validation.constraints.DecimalMin("-180")
    @jakarta.validation.constraints.DecimalMax("180")
    @jakarta.validation.constraints.Digits(integer=3, fraction=6)
    private BigDecimal eventLongitude;

    @NotNull(message = "Số lượng khách dự kiến không được để trống")
    @Min(value = 1, message = "Số lượng khách tham dự phải từ 1 người trở lên")
    private Integer guestCount;

    private Long menuId;

    @Valid
    private List<CreateOrderItemRequest> items;

    private String idempotencyKey;

    public CreateOrderRequest() {}

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public void setCustomerPhone(String customerPhone) {
        this.customerPhone = customerPhone;
    }

    public String getCustomerEmail() {
        return customerEmail;
    }

    public void setCustomerEmail(String customerEmail) {
        this.customerEmail = customerEmail;
    }

    public OffsetDateTime getEventDateTime() {
        return eventDateTime;
    }

    public void setEventDateTime(OffsetDateTime eventDateTime) {
        this.eventDateTime = eventDateTime;
    }

    public Integer getTableCount() {
        return tableCount;
    }

    public void setTableCount(Integer tableCount) {
        this.tableCount = tableCount;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public BigDecimal getEventLatitude() { return eventLatitude; }

    public void setEventLatitude(BigDecimal value) { this.eventLatitude = value; }

    public BigDecimal getEventLongitude() { return eventLongitude; }

    public void setEventLongitude(BigDecimal value) { this.eventLongitude = value; }

    public String getEventLocation() {
        return eventLocation;
    }

    public void setEventLocation(String eventLocation) {
        this.eventLocation = eventLocation;
    }

    public Integer getGuestCount() {
        return guestCount;
    }

    public void setGuestCount(Integer guestCount) {
        this.guestCount = guestCount;
    }

    public Long getMenuId() {
        return menuId;
    }

    public void setMenuId(Long menuId) {
        this.menuId = menuId;
    }

    public List<CreateOrderItemRequest> getItems() {
        return items;
    }

    public void setItems(List<CreateOrderItemRequest> items) {
        this.items = items;
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public void setIdempotencyKey(String idempotencyKey) {
        this.idempotencyKey = idempotencyKey;
    }
}
