package com.banquethub.modules.payments.service;

import com.banquethub.common.exception.*;
import com.banquethub.modules.catalog.entity.Ingredient;
import com.banquethub.modules.catalog.repository.IngredientRepository;
import com.banquethub.modules.inventory.entity.MovementType;
import com.banquethub.modules.inventory.entity.ReferenceType;
import com.banquethub.modules.inventory.entity.StockMovement;
import com.banquethub.modules.inventory.repository.StockMovementRepository;
import com.banquethub.modules.notifications.service.EmailOutboxService;
import com.banquethub.modules.orders.entity.*;
import com.banquethub.modules.orders.repository.*;
import com.banquethub.modules.payments.config.SePayConfig;
import com.banquethub.modules.payments.dto.PaymentView;
import com.banquethub.modules.payments.entity.PaymentTransaction;
import com.banquethub.modules.payments.repository.PaymentTransactionRepository;
import com.banquethub.modules.reservations.entity.*;
import com.banquethub.modules.reservations.repository.StockReservationRepository;
import com.banquethub.modules.users.entity.Role;
import com.banquethub.modules.users.entity.User;
import com.banquethub.modules.users.repository.UserRepository;
import org.springframework.data.domain.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.*;
import java.time.format.*;
import java.util.*;

@Service
public class PaymentService {
    public static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    public static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("uuuu-MM-dd HH:mm:ss").withResolverStyle(ResolverStyle.STRICT);
    private final SePayConfig config;
    private final SePaySigner signer;
    private final PaymentTransactionRepository payments;
    private final OrderRepository orders;
    private final StockReservationRepository reservations;
    private final IngredientRepository ingredients;
    private final StockMovementRepository movements;
    private final OrderStatusHistoryRepository history;
    private final EmailOutboxService email;
    private final JdbcTemplate jdbc;
    private final UserRepository users;

    public PaymentService(SePayConfig config, SePaySigner signer, PaymentTransactionRepository payments,
            OrderRepository orders, StockReservationRepository reservations, IngredientRepository ingredients,
            StockMovementRepository movements, OrderStatusHistoryRepository history, EmailOutboxService email, JdbcTemplate jdbc, UserRepository users) {
        this.config=config;
        this.signer=signer;
        this.payments=payments;
        this.orders=orders;
        this.reservations=reservations;
        this.ingredients=ingredients;
        this.movements=movements;
        this.history=history;
        this.email=email;
        this.jdbc=jdbc;
        this.users=users;
    }

    public record Attempt(String checkoutUrl, Map<String,String> fields, Long paymentAttemptId, String transactionReference, OffsetDateTime expiresAt) {}
    public record Status(Long orderId, OrderStatus orderStatus, PaymentStatus paymentStatus, boolean checkoutConfigured,
        List<PaymentView> transactions,
        com.banquethub.modules.reservations.dto.StockReservationResponse reservation,
        List<com.banquethub.modules.orders.dto.OrderStatusHistoryResponse> statusHistories) {}

    @Transactional
    public Attempt create(Long orderId, Long userId) {
        config.requireConfigured();
        Order order=lockOrder(orderId);
        requireOwner(order,userId);
        OffsetDateTime now=OffsetDateTime.now(ZONE);
        if(order.getOrderStatus()!=OrderStatus.PENDING_PAYMENT || order.getPaymentStatus()!=PaymentStatus.UNPAID)
            throw new BusinessValidationException("Đơn không còn ở trạng thái chờ thanh toán.");
        if(payments.existsByOrderIdAndStatus(orderId,"REVIEW_REQUIRED"))
            throw new BusinessValidationException("Đơn đang đối soát thanh toán.");
        StockReservation reservation=reservations.findByOrderId(orderId)
            .orElseThrow(()->new BusinessValidationException("Đơn không có giữ kho."));
        OffsetDateTime expiry=reservation.getExpiresAt().isBefore(order.getPaymentExpiresAt())?reservation.getExpiresAt():order.getPaymentExpiresAt();
        if (order.getEventDateTime().isBefore(expiry)) expiry = order.getEventDateTime();
        expiry = expiry.withNano(0);
        if(!reservation.isActive() || !expiry.isAfter(now) || Duration.between(now,expiry).getSeconds()<config.minRemainingSeconds)
            throw new BusinessValidationException("Thời gian giữ kho không đủ để thanh toán.");
        BigDecimal amount=order.getTotalAmount();
        config.validateAmount(amount);
        var existing=payments.findFirstByOrderIdAndStatusOrderByCreatedAtDesc(orderId,"PENDING");
        if (existing.isPresent()) {
            PaymentTransaction pending = existing.get();
            if ("SEPAY".equals(pending.getProvider()) && pending.getExpiresAt().isAfter(expiry))
                throw new BusinessValidationException("Yêu cầu thanh toán cũ vượt quá thời hạn hiện tại. Vui lòng liên hệ hỗ trợ.");
            if ("SEPAY".equals(pending.getProvider()) && pending.getExpiresAt().isAfter(now)) return attempt(pending);
            pending.setStatus("EXPIRED");
            payments.flush();
        }
        PaymentTransaction payment=new PaymentTransaction();
        payment.setOrder(order);
        payment.setProvider("SEPAY");
        payment.setCurrency("VND");
        payment.setStatus("PENDING");
        payment.setAmount(amount);
        payment.setTransactionReference(UUID.randomUUID().toString().replace("-",""));
        payment.setCreatedAt(now);
        payment.setUpdatedAt(now);
        payment.setExpiresAt(expiry);
        payment.setPaymentUrl(SePayConfig.CHECKOUT_URL);
        return attempt(payments.save(payment));
    }

    private Attempt attempt(PaymentTransaction payment) {
        String reference = payment.getTransactionReference();
        String callback = org.springframework.web.util.UriComponentsBuilder.fromUriString(config.returnUrl)
            .replaceQueryParam("reference", reference).build().toUriString();
        Map<String,String> fields = new LinkedHashMap<>();
        fields.put("operation", "PURCHASE");
        fields.put("payment_method", "BANK_TRANSFER");
        fields.put("order_invoice_number", reference);
        fields.put("order_amount", payment.getAmount().toBigIntegerExact().toString());
        fields.put("currency", "VND");
        fields.put("order_description", "Thanh toan don " + payment.getOrder().getOrderCode());
        fields.put("success_url", callback);
        fields.put("error_url", callback);
        fields.put("cancel_url", callback);
        fields.put("merchant", config.merchantId);
        fields.put("signature", signer.sign(config.secretKey, fields));
        return new Attempt(SePayConfig.CHECKOUT_URL, fields, payment.getId(), reference, payment.getExpiresAt());
    }

    @Transactional
    public void applyCaptured(com.fasterxml.jackson.databind.JsonNode providerOrder,
                              com.fasterxml.jackson.databind.JsonNode transaction) {
        String reference = providerOrder.path("order_invoice_number").asText();
        if (!reference.matches("[A-Za-z0-9]{1,64}"))
            throw new BusinessValidationException("Mã hóa đơn SePay không hợp lệ.");
        var matching = jdbc.query("select id,order_id from payment_transactions where transaction_reference=? and provider='SEPAY'",
            (rs,row)->new long[]{rs.getLong("id"),rs.getLong("order_id")},reference);
        if (matching.isEmpty()) throw new ResourceNotFoundException("Không tìm thấy giao dịch SePay.");
        Order order = lockOrder(matching.getFirst()[1]);
        PaymentTransaction payment = payments.lockById(matching.getFirst()[0]).orElseThrow();
        String txnType = transaction.path("transaction_type").asText();
        if (!"CAPTURED".equals(providerOrder.path("order_status").asText())
                || (!"PAYMENT".equals(txnType) && !"CAPTURE".equals(txnType))
                || !"APPROVED".equals(transaction.path("transaction_status").asText())
                || !"VND".equals(providerOrder.path("order_currency").asText())
                || !"VND".equals(transaction.path("transaction_currency").asText())
                || !sameAmount(providerOrder.path("order_amount").asText(),payment.getAmount())
                || !sameAmount(transaction.path("transaction_amount").asText(),payment.getAmount())
                || payment.getAmount().compareTo(order.getTotalAmount()) != 0)
            throw new BusinessValidationException("Trạng thái, tiền tệ hoặc số tiền SePay không khớp.");
        // Both IPN and the order detail API expose the internal transaction ID.
        String number = transaction.path("id").asText();
        if (!number.matches("[A-Za-z0-9_-]{1,100}"))
            throw new BusinessValidationException("Mã giao dịch SePay không hợp lệ.");
        if (Set.of("SUCCESS", "REVIEW_CLOSED", "REVIEW_REQUIRED").contains(payment.getStatus())
                && Objects.equals(number,payment.getProviderTransactionNo()) && payment.getPaidAt()!=null) return;
        if ("SUCCESS".equals(payment.getStatus()))
            throw new BusinessValidationException("Hóa đơn đã được ghi nhận bằng giao dịch khác.");
        OffsetDateTime paidAt = null;
        String date = transaction.path("transaction_date").asText();
        try { paidAt = LocalDateTime.parse(date, DATE).atZone(ZONE).toOffsetDateTime(); }
        catch (DateTimeException ignored) { /* A verified payment without a valid time requires review. */ }
        if ("REVIEW_REQUIRED".equals(payment.getStatus()) && Objects.equals(number, payment.getProviderTransactionNo()) && paidAt==null) return;
        boolean alreadyUnderReview = "REVIEW_REQUIRED".equals(payment.getStatus()) || "REVIEW_CLOSED".equals(payment.getStatus());
        payment.setResponseCode("00");
        payment.setTransactionStatus("00");
        payment.setProviderTransactionNo(number);
        payment.setPaidAt(paidAt);
        if (paidAt == null || alreadyUnderReview) {
            flagReview(order,payment,paidAt == null ? "SePay xác nhận thanh toán nhưng thiếu thời điểm hợp lệ."
                : "SePay xác nhận khoản thanh toán cần đối soát.");
            return;
        }
        String reason = settle(order,payment,null,"Đã xác thực thanh toán SePay.");
        if (reason != null) flagReview(order,payment,reason);
    }

    @Transactional
    public void applyVoid(com.fasterxml.jackson.databind.JsonNode providerOrder) {
        String reference = providerOrder.path("order_invoice_number").asText();
        var matching = jdbc.query("select id,order_id from payment_transactions where transaction_reference=? and provider='SEPAY'",
            (rs,row)->new long[]{rs.getLong("id"),rs.getLong("order_id")},reference);
        if (matching.isEmpty()) throw new ResourceNotFoundException("Không tìm thấy giao dịch SePay.");
        Order order = lockOrder(matching.getFirst()[1]);
        var payment = payments.lockById(matching.getFirst()[0]).orElseThrow();
        if ("SUCCESS".equals(payment.getStatus())) {
            String note = "SePay thông báo giao dịch đã ghi nhận bị đảo. Cần kiểm tra thủ công.";
            if (!note.equals(payment.getFailureReason())) {
                payment.setFailureReason(note);
                history.save(new OrderStatusHistory(order, order.getOrderStatus(), order.getOrderStatus(), null, "SEPAY", note));
            }
        } else if ("PENDING".equals(payment.getStatus())) {
            payment.setResponseCode("00");
            payment.setTransactionStatus("02");
            flagReview(order, payment, "SePay thông báo hủy giao dịch. Cần đối soát trạng thái.");
        }
    }

    private boolean sameAmount(String amount, BigDecimal expected) {
        return amount.matches("[0-9]{1,15}(\\.[0-9]{1,2})?") && new BigDecimal(amount).compareTo(expected)==0;
    }

    private void flagReview(Order order,PaymentTransaction payment,String reason) {
        payment.setStatus("REVIEW_REQUIRED");
        payment.setFailureReason(reason);
        if(order.getPaymentStatus()!=PaymentStatus.PAID) order.setPaymentStatus(PaymentStatus.PAYMENT_REVIEW);
        history.save(new OrderStatusHistory(order,order.getOrderStatus(),order.getOrderStatus(),null,"SEPAY",reason));
    }

    @Transactional
    public PaymentView resolveReview(Long id, String action, String reason, String resolutionReference, Long adminId) {
        var actor=users.findById(adminId).filter(user->user.getRole()==Role.ROLE_ADMIN && user.isActive())
            .orElseThrow(()->new AccessDeniedException("Chỉ quản trị viên được xử lý đối soát."));
        Long orderId=jdbc.query("select order_id from payment_transactions where id=?",
            (rs,row)->rs.getLong(1),id).stream().findFirst()
            .orElseThrow(()->new ResourceNotFoundException("Không tìm thấy giao dịch."));
        Order order=lockOrder(orderId);
        PaymentTransaction payment=payments.lockById(id).orElseThrow();
        if(!"REVIEW_REQUIRED".equals(payment.getStatus()))
            throw new BusinessValidationException("Giao dịch không còn chờ đối soát.");

        String note=reason.trim();
        if("RETRY_SETTLEMENT".equals(action)) {
            if(!"00".equals(payment.getResponseCode()) || !"00".equals(payment.getTransactionStatus())
                || payment.getPaidAt()==null || payment.getProviderTransactionNo()==null)
                throw new BusinessValidationException("Cần kết quả thanh toán thành công đã xác thực từ SePay.");
            String failure=settle(order,payment,actor,"Đã xác nhận thanh toán sau đối soát.");
            if(failure!=null) throw new BusinessValidationException(failure);
        } else if("CLOSE_MANUALLY".equals(action)) {
            boolean finalResult = ("00".equals(payment.getResponseCode())
                && Set.of("00","02").contains(Objects.toString(payment.getTransactionStatus(),"")))
                || "02".equals(payment.getTransactionStatus())
                || "VOID".equalsIgnoreCase(payment.getTransactionStatus());
            if (!finalResult) throw new BusinessValidationException("Cần kết quả SePay dứt điểm trước khi đóng đối soát.");
            if (resolutionReference==null || resolutionReference.isBlank())
                throw new BusinessValidationException("Cần mã chứng từ hoặc mã đối soát xác nhận đã xử lý khoản tiền.");
            note += " [Đối soát: "+resolutionReference.trim()+"]";
            payment.setStatus("REVIEW_CLOSED");
            payment.setFailureReason("Đã đóng đối soát thanh toán.");
            if(order.getPaymentStatus()==PaymentStatus.PAYMENT_REVIEW
                && !payments.existsByOrderIdAndStatus(orderId,"REVIEW_REQUIRED")) {
                order.setPaymentStatus(PaymentStatus.UNPAID);
            }
            history.save(new OrderStatusHistory(order,order.getOrderStatus(),order.getOrderStatus(),
                actor,actor.getFullName(),"Đã đóng đối soát thanh toán."));
        } else {
            throw new BusinessValidationException("Thao tác đối soát không hợp lệ.");
        }
        jdbc.update("insert into payment_notification_logs(transaction_reference,source,result_code,detail) values (?,?,?,?)",
            payment.getTransactionReference(),"ADMIN",action,"Admin "+adminId+": "+note);
        return PaymentView.from(payment);
    }

    private String settle(Order order, PaymentTransaction payment, User actor, String historyNote) {
        if(order.getPaymentStatus()==PaymentStatus.PAID) return "Đơn đã được thanh toán bằng giao dịch khác.";
        if(order.getPaymentStatus()!=PaymentStatus.UNPAID && actor==null) return "Đơn đang cần đối soát.";
        if(!Set.of(OrderStatus.PENDING_PAYMENT,OrderStatus.EXPIRED).contains(order.getOrderStatus())
            || !order.getEventDateTime().isAfter(OffsetDateTime.now()))
            return "Đơn không còn chấp nhận thanh toán.";
        OffsetDateTime paidAt=payment.getPaidAt();
        if(paidAt.isBefore(payment.getCreatedAt().withNano(0)) || paidAt.isAfter(OffsetDateTime.now().plusMinutes(2))
            || !paidAt.isBefore(order.getEventDateTime()) || !paidAt.isBefore(payment.getExpiresAt()) || !paidAt.isBefore(order.getPaymentExpiresAt()))
            return "Thời điểm thanh toán nằm ngoài thời hạn giữ kho.";
        var reservation=reservations.findSnapshotByOrderId(order.getId()).orElse(null);
        if(reservation==null || !Set.of(ReservationStatus.ACTIVE,ReservationStatus.EXPIRED).contains(reservation.getStatus())
            || !consume(order,reservation)) return "Không thể bảo đảm đủ nguyên liệu theo đơn.";

        OrderStatus previous=order.getOrderStatus();
        payment.setStatus("SUCCESS");
        payment.setFailureReason(null);
        order.setPaymentStatus(PaymentStatus.PAID);
        order.setOrderStatus(OrderStatus.PAID);
        history.save(new OrderStatusHistory(order,previous,OrderStatus.PAID,actor,actor==null?"SEPAY":actor.getFullName(),historyNote));
        email.enqueue(order,"PAYMENT_CONFIRMED");
        return null;
    }

    private boolean consume(Order order, StockReservation reservation) {
        Map<Long,BigDecimal> demand=new TreeMap<>();
        for(var row:reservation.getItems()) demand.put(row.getIngredient().getId(),row.getReservedQuantity());
        if(demand.isEmpty()) return false;
        List<Ingredient> locked=ingredients.findAllByIdInForUpdate(demand.keySet());
        if(locked.size()!=demand.size()) return false;
        OffsetDateTime now=OffsetDateTime.now();
        Map<Long,BigDecimal> holds=new HashMap<>();
        reservations.getActiveReservedQuantitiesByIds(demand.keySet(),now).forEach(row->holds.put((Long)row[0],(BigDecimal)row[1]));
        boolean ownHold=reservation.getStatus()==ReservationStatus.ACTIVE && reservation.getExpiresAt().isAfter(now);
        for(Ingredient ingredient:locked) {
            BigDecimal used=demand.get(ingredient.getId());
            BigDecimal others=holds.getOrDefault(ingredient.getId(),BigDecimal.ZERO);
            if(ownHold) others=others.subtract(used).max(BigDecimal.ZERO);
            if(ingredient.getCurrentStock().subtract(others).compareTo(used)<0) return false;
        }
        for(Ingredient ingredient:locked) {
            BigDecimal used=demand.get(ingredient.getId());
            BigDecimal stock=ingredient.getCurrentStock();
            BigDecimal cost=ingredient.getAvgUnitCost();
            ingredient.setCurrentStock(stock.subtract(used));
            StockMovement movement=new StockMovement();
            movement.setIngredient(ingredient);
            movement.setMovementType(MovementType.EXPORT);
            movement.setQuantityChange(used.negate());
            movement.setStockBefore(stock);
            movement.setStockAfter(ingredient.getCurrentStock());
            movement.setUnitCost(cost);
            movement.setAvgCostBefore(cost);
            movement.setAvgCostAfter(cost);
            movement.setReferenceType(ReferenceType.ORDER);
            movement.setReferenceId(order.getId());
            movement.setReferenceCode(order.getOrderCode());
            movement.setPerformedByName("SEPAY");
            movements.save(movement);
            jdbc.update("insert into order_ingredient_consumptions(order_id,ingredient_id,quantity_used,unit_cost_snapshot,total_cost) values (?,?,?,?,?)",
                order.getId(),ingredient.getId(),used,cost,used.multiply(cost).setScale(4,java.math.RoundingMode.HALF_UP));
        }
        reservation.setStatus(ReservationStatus.CONSUMED);
        return true;
    }

    @Transactional(readOnly=true)
    public Status status(Long orderId,Long userId,boolean admin) {
        Order order=orders.findById(orderId).orElseThrow(()->new ResourceNotFoundException("Không tìm thấy đơn."));
        if(!admin) requireOwner(order,userId);
        return new Status(orderId,order.getOrderStatus(),order.getPaymentStatus(),config.isConfigured(),
            payments.findByOrderIdOrderByCreatedAtDesc(orderId).stream()
                .map(payment -> admin ? PaymentView.from(payment) : PaymentView.forCustomer(payment)).toList(),
            reservations.findByOrderId(orderId)
                .map(com.banquethub.modules.reservations.dto.StockReservationResponse::fromEntity).orElse(null),
            order.getStatusHistories().stream()
                .map(com.banquethub.modules.orders.dto.OrderStatusHistoryResponse::fromEntity).toList());
    }

    @Transactional(readOnly=true)
    public Status reference(String reference,Long userId, boolean admin) {
        var payment=payments.findByTransactionReference(reference).orElseThrow(()->new ResourceNotFoundException("Không tìm thấy giao dịch."));
        return status(payment.getOrder().getId(),userId,admin);
    }

    @Transactional(readOnly=true)
    public Page<PaymentView> search(String status,Pageable page) {
        return payments.search(status,page).map(PaymentView::from);
    }

    @Transactional(readOnly=true)
    public PaymentView detail(Long id) {
        return PaymentView.from(payments.findById(id).orElseThrow(()->new ResourceNotFoundException("Không tìm thấy giao dịch.")));
    }

    private Order lockOrder(Long id) {
        return orders.findByIdForUpdate(id).orElseThrow(()->new ResourceNotFoundException("Không tìm thấy đơn."));
    }
    private void requireOwner(Order order,Long userId) {
        if(order.getUser()==null || !Objects.equals(order.getUser().getId(),userId))
            throw new AccessDeniedException("Đơn không thuộc tài khoản hiện tại.");
    }
}
