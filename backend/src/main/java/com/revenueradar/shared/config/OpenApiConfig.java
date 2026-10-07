package com.revenueradar.shared.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * OpenAPI metadata. Bearer scheme documented so every secured endpoint is testable from Swagger.
 */
@Configuration
public class OpenApiConfig {

    private static final String BEARER = "bearerAuth";

    @Bean
    public OpenAPI revenueRadarOpenApi(
            ObjectProvider<org.springframework.boot.info.BuildProperties> buildProperties,
            @Value("${app.env}") String env) {

        String version = buildProperties.getIfAvailable() != null
                ? buildProperties.getIfAvailable().getVersion()
                : "development";

        return new OpenAPI()
                .info(new Info()
                        .title("RevenueRadar AI API")
                        .description("""
                                Find the customers you're losing. Recover them before they're gone.

                                Multi-tenant SaaS API for revenue recovery. Every tenant-owned resource \
                                is scoped to the organization in the JWT — `organizationId` supplied by \
                                clients is always ignored.
                                """)
                        .version(version)
                        .contact(new Contact().name("RevenueRadar AI").email("support@revenueradar.example")))
                .servers(List.of(new Server().url("/").description("Current host (" + env + ")")))
                .components(new Components()
                        .addSecuritySchemes(BEARER, new SecurityScheme()
                                .name(BEARER)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Access token from POST /api/v1/auth/login")))
                .addSecurityItem(new SecurityRequirement().addList(BEARER));
    }
}
