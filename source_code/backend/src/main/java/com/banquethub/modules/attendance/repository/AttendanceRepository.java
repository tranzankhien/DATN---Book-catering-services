package com.banquethub.modules.attendance.repository;

import com.banquethub.modules.attendance.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    @Query("SELECT a FROM Attendance a LEFT JOIN FETCH a.employee WHERE a.employee.id = :employeeId AND a.workDate = :workDate")
    Optional<Attendance> findByEmployeeIdAndWorkDate(@Param("employeeId") Long employeeId, @Param("workDate") LocalDate workDate);

    @Query("SELECT a FROM Attendance a LEFT JOIN FETCH a.employee WHERE a.employee.id = :employeeId AND a.workDate BETWEEN :startDate AND :endDate ORDER BY a.workDate ASC")
    List<Attendance> findByEmployeeIdAndWorkDateBetweenOrderByWorkDateAsc(
            @Param("employeeId") Long employeeId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query("SELECT a FROM Attendance a LEFT JOIN FETCH a.employee WHERE a.workDate BETWEEN :startDate AND :endDate ORDER BY a.employee.id ASC, a.workDate ASC")
    List<Attendance> findByWorkDateBetweenOrderByWorkDateAsc(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query("SELECT a FROM Attendance a LEFT JOIN FETCH a.employee WHERE a.workDate = :workDate ORDER BY a.employee.id ASC")
    List<Attendance> findByWorkDate(@Param("workDate") LocalDate workDate);

    @Query("SELECT CASE WHEN COUNT(a) > 0 THEN TRUE ELSE FALSE END FROM Attendance a WHERE a.employee.id = :employeeId AND a.workDate = :workDate")
    boolean existsByEmployeeIdAndWorkDate(@Param("employeeId") Long employeeId, @Param("workDate") LocalDate workDate);
}
