package com.banquethub.modules.suppliers.repository;

import com.banquethub.modules.suppliers.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SupplierRepository extends JpaRepository<Supplier, Long> {

    Optional<Supplier> findByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCase(String code);

    boolean existsByPhone(String phone);

    boolean existsByPhoneAndIdNot(String phone, Long id);

    List<Supplier> findAllByOrderByNameAsc();

    List<Supplier> findByActiveTrueOrderByNameAsc();

    @Query(value = "SELECT nextval('supplier_code_seq')", nativeQuery = true)
    Long getNextSupplierCodeSeq();

    @Query("SELECT s FROM Supplier s WHERE " +
           "(:active IS NULL OR s.active = :active) " +
           "ORDER BY s.name ASC")
    List<Supplier> findByActiveFilter(@Param("active") Boolean active);
}
