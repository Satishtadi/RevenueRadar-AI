package com.revenueradar.organization.api;

import com.revenueradar.organization.domain.Organization;
import com.revenueradar.organization.infra.OrganizationRepository;
import com.revenueradar.shared.api.ApiResponse;
import com.revenueradar.shared.exception.ResourceNotFoundException;
import com.revenueradar.shared.security.AuthenticatedUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * Minimal organization writes required by the onboarding wizard.
 * Identity is enforced against the JWT principal: no token or a different
 * tenant yields 404 (existence is never revealed across tenants).
 */
@RestController
@RequestMapping("${app.api-base-path}/organizations")
@Tag(name = "Organizations")
public class OrganizationController {

    private final OrganizationRepository organizationRepository;

    public OrganizationController(OrganizationRepository organizationRepository) {
        this.organizationRepository = organizationRepository;
    }

    public record UpdateOrganizationRequest(String businessType, List<String> goals) {
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Update onboarding details for the caller's organization")
    public ApiResponse<Organization> update(@PathVariable UUID id,
                                            @RequestBody UpdateOrganizationRequest request,
                                            @AuthenticationPrincipal AuthenticatedUser principal) {
        if (principal == null || !id.equals(principal.organizationId())) {
            throw new ResourceNotFoundException("Organization not found");
        }
        Organization organization = organizationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        if (request.businessType() != null && !request.businessType().isBlank()) {
            organization.setBusinessType(request.businessType().trim().substring(0,
                    Math.min(request.businessType().trim().length(), 60)));
        }
        if (request.goals() != null && !request.goals().isEmpty()) {
            String joined = String.join(", ", request.goals());
            organization.setGoals(joined.substring(0, Math.min(joined.length(), 500)));
        }
        organization.setOnboarded(true);
        return ApiResponse.ok(organizationRepository.save(organization));
    }
}
