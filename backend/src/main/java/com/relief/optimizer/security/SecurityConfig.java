package com.relief.optimizer.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableGlobalMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    private final UserDetailsServiceImpl userDetailsService;
    private final JwtAuthEntryPoint unauthorizedHandler;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Value("${app.cors.allowed-origins:http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000,https://*.github.io}")
    private String allowedOrigins;

    @Autowired
    public SecurityConfig(UserDetailsServiceImpl userDetailsService,
                          JwtAuthEntryPoint unauthorizedHandler,
                          JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.userDetailsService = userDetailsService;
        this.unauthorizedHandler = unauthorizedHandler;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        List<String> origins = Arrays.asList(allowedOrigins.split(","));
        configuration.setAllowedOriginPatterns(origins);
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With", "Accept"));
        configuration.setExposedHeaders(Arrays.asList("Authorization"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors().configurationSource(corsConfigurationSource()).and()
            .csrf().disable()
            .exceptionHandling().authenticationEntryPoint(unauthorizedHandler).and()
            .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS).and()
            .headers().frameOptions().sameOrigin().and() // For H2 console
            .authorizeRequests()
                // Public authentication and status endpoints
                .antMatchers("/api/auth/**").permitAll()
                .antMatchers("/api/health").permitAll()
                // Documentation & H2 console
                .antMatchers("/swagger-ui/**", "/swagger-ui.html", "/api-docs/**", "/v3/api-docs/**").permitAll()
                .antMatchers("/h2-console/**").permitAll()
                // Public read endpoints for dashboard / overview
                .antMatchers(HttpMethod.GET, "/api/dashboard/**").permitAll()
                .antMatchers(HttpMethod.GET, "/api/depots/**").permitAll()
                .antMatchers(HttpMethod.GET, "/api/distribution-points/**").permitAll()
                .antMatchers(HttpMethod.GET, "/api/routes/**").permitAll()
                .antMatchers(HttpMethod.GET, "/api/disasters/**").permitAll()
                // Demo endpoints (allowed for sandbox testing)
                .antMatchers("/api/dashboard/demo/**").permitAll()
                // Admin specific management endpoints
                .antMatchers(HttpMethod.POST, "/api/depots/**", "/api/distribution-points/**", "/api/routes/**", "/api/disasters/**").hasRole("ADMIN")
                .antMatchers(HttpMethod.PUT, "/api/depots/**", "/api/distribution-points/**", "/api/routes/**", "/api/disasters/**").hasRole("ADMIN")
                .antMatchers(HttpMethod.DELETE, "/api/depots/**", "/api/distribution-points/**", "/api/routes/**", "/api/disasters/**").hasRole("ADMIN")
                .antMatchers(HttpMethod.PATCH, "/api/depots/**/inventory").hasRole("ADMIN")
                .antMatchers("/api/flow/**", "/api/allocations/run").hasRole("ADMIN")
                .antMatchers("/api/approvals/**").hasRole("ADMIN")
                .antMatchers("/api/users/**").hasRole("ADMIN")
                .antMatchers("/api/instructions/create", "/api/instructions/*/publish", "/api/instructions/*/withdraw").hasRole("ADMIN")
                // All other endpoints require authentication
                .anyRequest().authenticated();

        http.authenticationProvider(authenticationProvider());
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}

