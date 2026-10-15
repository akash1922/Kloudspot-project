package com.kohort.ems.dto;

public class LoginResponseDTO {
    private String token;
    private String type = "Bearer";
    private String username;
    private String role;

    public LoginResponseDTO() {
    }

    public LoginResponseDTO(String token, String type, String username, String role) {
        this.token = token;
        this.type = type != null ? type : "Bearer";
        this.username = username;
        this.role = role;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String token;
        private String type = "Bearer";
        private String username;
        private String role;

        public Builder token(String token) { this.token = token; return this; }
        public Builder type(String type) { this.type = type; return this; }
        public Builder username(String username) { this.username = username; return this; }
        public Builder role(String role) { this.role = role; return this; }

        public LoginResponseDTO build() {
            return new LoginResponseDTO(token, type, username, role);
        }
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}
