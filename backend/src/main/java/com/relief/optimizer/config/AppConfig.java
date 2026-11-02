package com.relief.optimizer.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class AppConfig {

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                        .allowedOrigins(
                                "https://arjundombara.github.io",
                                "http://localhost:3000",
                                "http://localhost:5173",
                                "http://127.0.0.1:5173",
                                "http://127.0.0.1:3000"
                        )
                        .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(true)
                        .maxAge(3600);
            }
        };
    }

    @Bean
    public OpenAPI disasterReliefOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Disaster Relief Supply Chain Optimizer API")
                        .description(
                                "REST API for the Disaster Relief Supply Chain Optimizer. " +
                                "Implements Edmonds-Karp maximum flow and Dinic's algorithm for optimizing " +
                                "humanitarian aid distribution from central depots to disaster-affected zones."
                        )
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Relief Operations Team")
                                .email("ops@relief-optimizer.example")
                        )
                        .license(new License().name("MIT").url("https://opensource.org/licenses/MIT"))
                );
    }
}
