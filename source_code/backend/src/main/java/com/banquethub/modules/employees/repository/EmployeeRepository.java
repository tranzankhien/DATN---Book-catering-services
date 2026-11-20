package com.banquethub.modules.employees.repository;

import com.banquethub.modules.employees.entity.Employee;
import com.banquethub.modules.employees.entity.EmployeeStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long>, JpaSpecificationExecutor<Employee> {

    boolean existsByEmployeeCode(String employeeCode);

    Optional<Employee> findByEmployeeCode(String employeeCode);

    @Query("SELECT e FROM Employee e LEFT JOIN FETCH e.user WHERE e.id = :id")
    Optional<Employee> findByIdWithUser(@Param("id") Long id);

    @Query("SELECT e FROM Employee e LEFT JOIN FETCH e.user WHERE e.user.id = :userId")
    Optional<Employee> findByUserId(@Param("userId") Long userId);

    @Query("SELECT CASE WHEN COUNT(e) > 0 THEN TRUE ELSE FALSE END FROM Employee e WHERE e.user.id = :userId AND e.id <> :id")
    boolean existsByUserIdAndIdNot(@Param("userId") Long userId, @Param("id") Long id);

    @Query("SELECT CASE WHEN COUNT(e) > 0 THEN TRUE ELSE FALSE END FROM Employee e WHERE e.user.id = :userId")
    boolean existsByUserId(@Param("userId") Long userId);

    Optional<Employee> findByEmailIgnoreCase(String email);

    List<Employee> findByUserIsNull();

    List<Employee> findByStatus(EmployeeStatus status);

    long countByStatus(EmployeeStatus status);

    @Query("SELECT MAX(e.id) FROM Employee e")
    Long findMaxId();
}
