package com.banquethub.modules.reservations.repository;

import com.banquethub.modules.reservations.entity.ReservationStatus;
import com.banquethub.modules.reservations.entity.StockReservation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface StockReservationRepository extends JpaRepository<StockReservation, Long> {

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"items", "items.ingredient"})
    Optional<StockReservation> findByOrderId(Long orderId);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"items"})
    @Query("select r from StockReservation r where r.order.id=:id")
    Optional<StockReservation> findSnapshotByOrderId(@Param("id") Long id);

    List<StockReservation> findByStatusAndExpiresAtBefore(ReservationStatus status, OffsetDateTime time);

    @Query("SELECT COALESCE(SUM(sri.reservedQuantity), 0) FROM StockReservationItem sri " +
           "JOIN sri.reservation sr " +
           "WHERE sri.ingredient.id = :ingredientId " +
           "AND sr.status = 'ACTIVE' " +
           "AND sr.expiresAt > :now")
    BigDecimal getActiveReservedQuantity(@Param("ingredientId") Long ingredientId, @Param("now") OffsetDateTime now);

    @Query("SELECT sri.ingredient.id, COALESCE(SUM(sri.reservedQuantity), 0) " +
           "FROM StockReservationItem sri " +
           "JOIN sri.reservation sr " +
           "WHERE sr.status = 'ACTIVE' " +
           "AND sr.expiresAt > :now " +
           "AND sri.ingredient.id IN :ingredientIds " +
           "GROUP BY sri.ingredient.id")
    List<Object[]> getActiveReservedQuantitiesByIds(
            @Param("ingredientIds") Collection<Long> ingredientIds,
            @Param("now") OffsetDateTime now
    );

    @Query("SELECT sr FROM StockReservation sr " +
           "JOIN sr.order o " +
           "WHERE (:status IS NULL OR sr.status = :status) " +
           "AND (:keyword IS NULL OR LOWER(o.orderCode) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(o.customerName) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY sr.createdAt DESC")
    Page<StockReservation> searchReservations(
            @Param("keyword") String keyword,
            @Param("status") ReservationStatus status,
            Pageable pageable
    );
}
