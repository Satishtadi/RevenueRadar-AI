package com.revenueradar.shared.api;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ApiResponseTest {

    @Test
    @DisplayName("Success envelope carries data and message")
    void successEnvelope() {
        ApiResponse<String> response = ApiResponse.of("482000", "Revenue at risk");

        assertThat(response.success()).isTrue();
        assertThat(response.data()).isEqualTo("482000");
        assertThat(response.message()).isEqualTo("Revenue at risk");
        assertThat(response.timestamp()).isNotNull();
    }

    @Test
    @DisplayName("Error envelope never reports success")
    void errorEnvelope() {
        ApiErrorResponse error = ApiErrorResponse.of("LEAD_NOT_FOUND", "Lead not found");

        assertThat(error.success()).isFalse();
        assertThat(error.errorCode()).isEqualTo("LEAD_NOT_FOUND");
        assertThat(error.message()).isEqualTo("Lead not found");
        assertThat(error.timestamp()).isNotNull();
        assertThat(error.errors()).isNull();
    }

    @Test
    @DisplayName("Paged response computes total pages")
    void pagedResponseMath() {
        PagedResponse<String> page = PagedResponse.of(java.util.List.of("a", "b"), 0, 2, 5);

        assertThat(page.totalPages()).isEqualTo(3);
        assertThat(page.content()).hasSize(2);
        assertThat(page.totalElements()).isEqualTo(5);
    }
}
