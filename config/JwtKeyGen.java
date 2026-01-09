package com.studenttrack.config;

import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

import java.util.Base64;

public class JwtKeyGen {
    public static void main(String[] args) {
        var key = Keys.secretKeyFor(SignatureAlgorithm.HS512);
        System.out.println(Base64.getEncoder().encodeToString(key.getEncoded()));
    }
}

