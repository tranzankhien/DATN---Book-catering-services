package com.banquethub.modules.attendance.dto;

import com.banquethub.modules.attendance.entity.AttendanceStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RecordAttendanceRequest(
        @NotNull(message = "Trạng thái chấm công không được để trống")
        AttendanceStatus attendanceStatus,

        @Size(max = 255, message = "Ghi chú không vượt quá 255 ký tự")
        String note
) {
}
