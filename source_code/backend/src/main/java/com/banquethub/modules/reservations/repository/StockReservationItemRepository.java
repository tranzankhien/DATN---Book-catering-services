package com.banquethub.modules.reservations.repository;

import com.banquethub.modules.reservations.entity.StockReservationItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StockReservationItemRepository extends JpaRepository<StockReservationItem, Long> {
    List<StockReservationItem> findByReservationId(Long reservationId);
}
