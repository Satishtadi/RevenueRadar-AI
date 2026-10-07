package com.revenueradar.shared.api;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.boot.info.BuildProperties;
import org.springframework.core.env.Environment;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Unauthenticated meta endpoints used for smoke tests and deployment verification.
 * Exposes no tenant data.
 */
@RestController
@RequestMapping("${app.api-base-path}/meta")
@Tag(name = "Meta", description = "Service metadata (no authentication, no tenant data)")
public class MetaController {

    private final BuildProperties buildProperties;
    private final Environment environment;

    public MetaController(BuildProperties buildProperties, Environment environment) {
        this.buildProperties = buildProperties;
        this.environment = environment;
    }

    @GetMapping("/version")
    @Operation(summary = "Build version and active environment")
    public ApiResponse<Map<String, String>> version() {
        return ApiResponse.ok(Map.of(
                "name", "RevenueRadar AI",
                "version", buildProperties.getVersion(),
                "env", environment.getProperty("app.env", "unknown"),
                "activeProfiles", String.join(",", environment.getActiveProfiles().length == 0
                        ? new String[]{"default"}
                        : environment.getActiveProfiles())
        ));
    }
}
