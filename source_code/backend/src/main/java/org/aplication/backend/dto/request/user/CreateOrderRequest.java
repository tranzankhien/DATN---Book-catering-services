package org.aplication.backend.dto.request.user;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.aplication.backend.common.enums.OrderItemType;
import org.aplication.backend.common.enums.ServiceLocation;

public record CreateOrderRequest(
        UUID hallId,
        @NotNull ServiceLocation serviceLocation,
        @NotNull @Future Instant eventStart,
        @NotNull @Future Instant eventEnd,
        @Min(1) int guestCount,
        @NotBlank @Size(max = 120) String contactName,
        @NotBlank @Size(max = 20) String contactPhone,
        @Size(max = 1000) String eventAddress,
        @Size(max = 2000) String note,
        @NotEmpty List<@Valid OrderItemRequest> items) {
    public record OrderItemRequest(@NotNull OrderItemType itemType, @NotNull UUID referenceId,
                                   @Min(1) int quantity) {}
}
