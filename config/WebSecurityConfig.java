package com.studenttrack.config;

import com.studenttrack.security.AuthEntryPointJwt;
import com.studenttrack.security.AuthTokenFilter;
import com.studenttrack.security.UserDetailsServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
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

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class WebSecurityConfig {
    @Autowired
    UserDetailsServiceImpl userDetailsService;

    @Autowired
    private AuthEntryPointJwt unauthorizedHandler;

    @Bean
    public AuthTokenFilter authenticationJwtTokenFilter() {
        return new AuthTokenFilter();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(passwordEncoder());
        authProvider.setUserDetailsService(userDetailsService);
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

//    @Bean
//    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
//        http.cors(cors -> cors.configurationSource(corsConfigurationSource()))
//            .csrf(csrf -> csrf.disable())
//            .exceptionHandling(exception -> exception.authenticationEntryPoint(unauthorizedHandler))
//            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
//            .authorizeHttpRequests(auth -> 
//                auth.requestMatchers("/api/feedback/**").permitAll()
//                .requestMatchers("/api/auth/**").permitAll()
//                    .requestMatchers("/api/test/**").permitAll()
//                    .requestMatchers("/api/submissions/**").permitAll()
//                    .requestMatchers("/api/tasks/**").permitAll()
//                    .requestMatchers("/api/users/**").permitAll()
//                    .anyRequest().authenticated()
//            );
//
//        http.authenticationProvider(authenticationProvider());
//        http.addFilterBefore(authenticationJwtTokenFilter(), UsernamePasswordAuthenticationFilter.class);
//
//        return http.build();
//    }
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .exceptionHandling(exception -> exception.authenticationEntryPoint(unauthorizedHandler))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> 
                auth.requestMatchers("/api/auth/**").permitAll()
                    .requestMatchers("/api/test/**").permitAll()
                    .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                    .requestMatchers("/ws/**").permitAll()  // WebSocket endpoint public
                    .requestMatchers("/api/users/profile", "/api/users/profile/**").authenticated()
                    .requestMatchers("/api/users/**").hasAnyRole("HOD", "FACULTY")
                    .requestMatchers("/api/reports/**").hasAnyRole("HOD", "FACULTY")
                    .requestMatchers(HttpMethod.GET, "/api/marks/my").hasRole("STUDENT")
                    .requestMatchers("/api/marks/*/approve").hasRole("HOD")
                    .requestMatchers("/api/marks/**").hasAnyRole("HOD", "FACULTY")
                    .requestMatchers("/api/feedback/**").hasAnyRole("HOD", "FACULTY", "STUDENT")
                    .requestMatchers("/api/submissions/**").hasAnyRole("HOD", "FACULTY", "STUDENT")
                    .requestMatchers("/api/tasks/**").hasAnyRole("HOD", "FACULTY", "STUDENT")
                    .anyRequest().authenticated()
            );

        http.authenticationProvider(authenticationProvider());
        http.addFilterBefore(authenticationJwtTokenFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.asList("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}