package com.banquethub.modules.inventory.repository;

import com.banquethub.modules.inventory.entity.StockReceiptItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StockReceiptItemRepository extends JpaRepository<StockReceiptItem, Long> {

    List<StockReceiptItem> findByReceiptIdOrderByLineNoAsc(Long receiptId);

    boolean existsByIngredientId(Long ingredientId);
}

