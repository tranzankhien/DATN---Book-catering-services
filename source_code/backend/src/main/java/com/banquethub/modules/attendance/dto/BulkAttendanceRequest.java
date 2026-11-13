package com.banquethub.modules.attendance.dto;

import com.banquethub.modules.attendance.entity.AttendanceStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

public record BulkAttendanceRequest(
        @NotEmpty(message = "Danh sách bản ghi chấm công không được rỗng")
        @Valid
        List<BulkAttendanceItem> items
) {
    public record BulkAttendanceItem(
            @NotNull(message = "ID nhân viên không được để trống")
            Long employeeId,

            @NotNull(message = "Ngày làm việc không được để trống")
            LocalDate workDate,

            @NotNull(message = "Trạng thái chấm công không được để trống")
            AttendanceStatus attendanceStatus,

            @Size(max = 255, message = "Ghi chú không vượt quá 255 ký tự")
            String note
    ) {}
}
