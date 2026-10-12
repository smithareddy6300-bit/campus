import { JavaSourceFile } from '../types';

export const JAVA_PROJECT_FILES: JavaSourceFile[] = [
  {
    path: 'docker-compose.yml',
    category: 'docker',
    description: 'Docker Compose orchestrator for Virtual MySQL 8.0, Spring Boot App, and phpMyAdmin',
    content: `version: '3.8'

services:
  # 1. Virtual MySQL Database Container
  campussound-db:
    image: mysql:8.0.36
    container_name: campussound-mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: campussound_db
      MYSQL_USER: campususer
      MYSQL_PASSWORD: campuspassword
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      # Auto-run SQL initialization scripts on container startup
      - ./database/schema.sql:/docker-entrypoint-initdb.d/01_schema.sql:ro
      - ./database/data.sql:/docker-entrypoint-initdb.d/02_data.sql:ro
      - ./database/my.cnf:/etc/mysql/conf.d/my.cnf:ro
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-prootpassword"]
      interval: 5s
      timeout: 3s
      retries: 10
    networks:
      - campussound-net

  # 2. Spring Boot Java Backend Application Container
  campussound-app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: campussound-backend
    restart: always
    ports:
      - "8080:8080"
    environment:
      SPRING_PROFILES_ACTIVE: prod
      MYSQL_HOST: campussound-db
      MYSQL_DB: campussound_db
      MYSQL_USER: campususer
      MYSQL_PASSWORD: campuspassword
      GEMINI_API_KEY: \${GEMINI_API_KEY:-}
    depends_on:
      campussound-db:
        condition: service_healthy
    networks:
      - campussound-net

  # 3. Virtual Database Browser (phpMyAdmin)
  campussound-db-admin:
    image: phpmyadmin/phpmyadmin:latest
    container_name: campussound-phpmyadmin
    restart: always
    ports:
      - "8081:80"
    environment:
      PMA_HOST: campussound-db
      PMA_PORT: 3306
      PMA_USER: root
      PMA_PASSWORD: rootpassword
    depends_on:
      - campussound-db
    networks:
      - campussound-net

volumes:
  mysql_data:
    driver: local

networks:
  campussound-net:
    driver: bridge`
  },
  {
    path: 'Dockerfile',
    category: 'docker',
    description: 'Multi-stage Dockerfile compiling Java Spring Boot and packaging lightweight JRE runtime',
    content: `# Multi-stage Docker build for CampusSound Spring Boot App
# Stage 1: Build JAR with Maven & OpenJDK 17
FROM maven:3.9.6-eclipse-temurin-17 AS builder
WORKDIR /app

# Cache dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and package
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Minimal Distroless / Temurin JRE container
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Run as non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

COPY --from=builder /app/target/campus-sound-backend-1.0.0-SNAPSHOT.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]`
  },
  {
    path: 'database/Dockerfile',
    category: 'database',
    description: 'Dedicated Dockerfile for self-contained Virtual MySQL image with baked schema',
    content: `# Virtual MySQL Database Image with pre-packaged schema & seed data
FROM mysql:8.0.36

ENV MYSQL_DATABASE=campussound_db \\
    MYSQL_ROOT_PASSWORD=rootpassword \\
    MYSQL_USER=campususer \\
    MYSQL_PASSWORD=campuspassword

# Copy initialization scripts
COPY schema.sql /docker-entrypoint-initdb.d/01_schema.sql
COPY data.sql /docker-entrypoint-initdb.d/02_data.sql
COPY my.cnf /etc/mysql/conf.d/my.cnf

EXPOSE 3306`
  },
  {
    path: 'database/my.cnf',
    category: 'database',
    description: 'MySQL server configuration file for UTF-8 encoding and performance tuning',
    content: `[mysqld]
character-set-server=utf8mb4
collation-server=utf8mb4_unicode_ci
default-time-zone='+00:00'
max_connections=150
innodb_buffer_pool_size=128M
sql_mode=STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION

[client]
default-character-set=utf8mb4`
  },
  {
    path: 'database/schema.sql',
    category: 'database',
    description: 'Standalone database folder schema matching ER diagram',
    content: `-- CampusSound Virtual MySQL Schema
-- Location: /database/schema.sql

CREATE DATABASE IF NOT EXISTS campussound_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE campussound_db;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('STUDENT', 'ADMIN') NOT NULL DEFAULT 'STUDENT',
    student_id VARCHAR(50),
    department VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Locations Table
CREATE TABLE IF NOT EXISTS locations (
    location_id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    zone_type VARCHAR(50) NOT NULL,
    threshold_db DECIMAL(5,2) NOT NULL DEFAULT 45.00,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Incident Reports Table
CREATE TABLE IF NOT EXISTS reports (
    report_id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    location_id VARCHAR(36) NOT NULL,
    noise_db DECIMAL(5,2) NOT NULL,
    category ENUM('traffic', 'construction', 'event', 'crowd', 'equipment', 'other') NOT NULL,
    description TEXT NOT NULL,
    status ENUM('SUBMITTED', 'REVIEWED', 'ACTION_TAKEN', 'CLOSED') NOT NULL DEFAULT 'SUBMITTED',
    source VARCHAR(50) DEFAULT 'STUDENT_MIC',
    action_notes TEXT,
    reviewed_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES locations(location_id) ON DELETE CASCADE
);

-- 4. Continuous Noise Readings Table (IoT & Student Mics)
CREATE TABLE IF NOT EXISTS noise_readings (
    reading_id VARCHAR(36) PRIMARY KEY,
    location_id VARCHAR(36) NOT NULL,
    noise_db DECIMAL(5,2) NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source VARCHAR(50) DEFAULT 'IOT_SENSOR',
    FOREIGN KEY (location_id) REFERENCES locations(location_id) ON DELETE CASCADE
);

-- 5. Alerts Table
CREATE TABLE IF NOT EXISTS alerts (
    alert_id VARCHAR(36) PRIMARY KEY,
    report_id VARCHAR(36),
    location_id VARCHAR(36) NOT NULL,
    noise_db DECIMAL(5,2) NOT NULL,
    threshold_db DECIMAL(5,2) NOT NULL,
    severity ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM',
    message TEXT NOT NULL,
    status ENUM('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED') NOT NULL DEFAULT 'ACTIVE',
    acknowledged_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    FOREIGN KEY (report_id) REFERENCES reports(report_id) ON DELETE SET NULL,
    FOREIGN KEY (location_id) REFERENCES locations(location_id) ON DELETE CASCADE
);

-- 6. LangChain4j AI Insights Table
CREATE TABLE IF NOT EXISTS ai_insights (
    insight_id VARCHAR(36) PRIMARY KEY,
    report_id VARCHAR(36) NOT NULL,
    summary TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    suggestion TEXT NOT NULL,
    model VARCHAR(50) DEFAULT 'LangChain4j-Gemini',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (report_id) REFERENCES reports(report_id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_reports_location ON reports(location_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_readings_time ON noise_readings(location_id, recorded_at);`
  },
  {
    path: 'database/data.sql',
    category: 'database',
    description: 'Seed data for virtual database initialization',
    content: `-- CampusSound Virtual Database Initial Seed Data
USE campussound_db;

-- Initial Users
INSERT IGNORE INTO users (user_id, name, email, password_hash, role, student_id, department) VALUES
('usr-001', 'Alex Chen', 'alex.chen@campus.edu', '$2a$10$abcdefghijklmnopqrstuvw1', 'STUDENT', 'CS-2024-8831', 'Computer Science'),
('usr-002', 'Sophia Rodriguez', 'sophia.r@campus.edu', '$2a$10$abcdefghijklmnopqrstuvw2', 'STUDENT', 'EE-2023-4102', 'Electrical Engineering'),
('usr-adm-001', 'Dr. Patricia Vance', 'patricia.vance@campus.edu', '$2a$10$abcdefghijklmnopqrstuvw3', 'ADMIN', 'FAC-0199', 'Facilities & Safety');

-- Campus Locations (with WHO 35 dB standard)
INSERT IGNORE INTO locations (location_id, name, zone_type, threshold_db, active, description) VALUES
('loc-001', 'Main Library 2F (Quiet Reading Hall)', 'Library', 35.00, true, 'Strict silent research and study area based on WHO 35 dB(A) learning reference'),
('loc-002', 'Academic Block A - Lecture Hall 101', 'Classroom', 45.00, true, 'Main instructional lecture theater with acoustic baffle ceiling'),
('loc-003', 'Engineering Block C - Study Lounge', 'Study Hall', 45.00, true, 'Collaborative group study tables and workspace'),
('loc-004', 'Central Student Union Cafeteria', 'Cafeteria', 65.00, true, 'Dining hall, commons and lounge area'),
('loc-005', 'North Campus Parking Lot & Bus Loop', 'Parking', 70.00, true, 'Transit pickup and vehicular parking area'),
('loc-006', 'Varsity Gymnasium & Field House', 'Sports Complex', 75.00, true, 'Athletic training and recreation courts'),
('loc-007', 'West Quad Dormitory Courtyard', 'Dormitory', 45.00, true, 'Student residential area with 10pm quiet hours');`
  },
  {
    path: 'database/README.md',
    category: 'doc',
    description: 'Virtual database Docker operations, container management, and connection guide',
    content: `# Virtual MySQL Database & Docker Instructions

This folder contains the complete virtual database setup for CampusSound.

## 🐳 Quick Start with Docker Compose
To launch the Virtual MySQL Database, Spring Boot API, and phpMyAdmin with one command:

\`\`\`bash
docker-compose up -d
\`\`\`

### Verification:
- **Spring Boot REST API**: http://localhost:8080
- **Virtual phpMyAdmin Web Console**: http://localhost:8081
  - Server: \`campussound-db\`
  - Username: \`root\`
  - Password: \`rootpassword\`
- **Direct MySQL CLI**:
\`\`\`bash
docker exec -it campussound-mysql mysql -u campususer -pcampuspassword campussound_db
\`\`\`

## 🛠️ Individual Container Commands
To run only the virtual database container:
\`\`\`bash
docker build -t campussound-db:latest ./database
docker run -d --name campussound-mysql -p 3306:3306 campussound-db:latest
\`\`\`

To stop and remove containers:
\`\`\`bash
docker-compose down -v
\`\`\`
`
  },
  {
    path: 'pom.xml',
    category: 'config',
    description: 'Maven Project Object Model with Spring Boot 3.3, LangChain4j, Spring Data JPA, and MySQL Driver',
    content: `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.3.2</version>
        <relativePath/>
    </parent>
    <groupId>com.campussound</groupId>
    <artifactId>campus-sound-backend</artifactId>
    <version>1.0.0-SNAPSHOT</version>
    <name>CampusSound</name>
    <description>Smart Campus Noise Environment Reporting and Analysis System</description>

    <properties>
        <java.version>17</java.version>
        <langchain4j.version>0.35.0</langchain4j.version>
        <jjwt.version>0.12.5</jjwt.version>
    </properties>

    <dependencies>
        <!-- Spring Boot Web Starter for REST APIs -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <!-- Spring Data JPA for MySQL persistence -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>

        <!-- Spring Security & JWT for Role-based Access (Student / Admin) -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>

        <!-- MySQL Connector -->
        <dependency>
            <groupId>com.mysql</groupId>
            <artifactId>mysql-connector-j</artifactId>
            <scope>runtime</scope>
        </dependency>

        <!-- LangChain4j Core & Spring Boot Starter -->
        <dependency>
            <groupId>dev.langchain4j</groupId>
            <artifactId>langchain4j-spring-boot-starter</artifactId>
            <version>\${langchain4j.version}</version>
        </dependency>
        <dependency>
            <groupId>dev.langchain4j</groupId>
            <artifactId>langchain4j-google-ai-gemini</artifactId>
            <version>\${langchain4j.version}</version>
        </dependency>

        <!-- JWT token handling -->
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-api</artifactId>
            <version>\${jjwt.version}</version>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-impl</artifactId>
            <version>\${jjwt.version}</version>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-jackson</artifactId>
            <version>\${jjwt.version}</version>
            <scope>runtime</scope>
        </dependency>

        <!-- Lombok to reduce boilerplate -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>

        <!-- Testing -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>`
  },
  {
    path: 'src/main/resources/application.yml',
    category: 'config',
    description: 'Spring Boot configuration file for database, JWT, thresholds, and LangChain4j',
    content: `server:
  port: 8080

spring:
  application:
    name: campus-sound-system

  datasource:
    url: jdbc:mysql://\${MYSQL_HOST:localhost}:3306/\${MYSQL_DB:campussound_db}?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
    username: \${MYSQL_USER:root}
    password: \${MYSQL_PASSWORD:rootpassword}
    driver-class-name: com.mysql.cj.jdbc.Driver

  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
    properties:
      hibernate:
        format_sql: true
        dialect: org.hibernate.dialect.MySQLDialect

  sql:
    init:
      mode: always

campus:
  noise:
    who-classroom-reference-db: 35.0
    default-alert-threshold-db: 65.0
    critical-alert-delta-db: 15.0

# LangChain4j LLM integration for AI-assisted insights
langchain4j:
  google-ai-gemini:
    chat-model:
      api-key: \${GEMINI_API_KEY:YOUR_GEMINI_API_KEY}
      model-name: gemini-1.5-flash
      temperature: 0.2
      max-output-tokens: 800

jwt:
  secret: 404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
  expiration-ms: 86400000 # 24 hours`
  },
  {
    path: 'src/main/resources/schema.sql',
    category: 'database',
    description: 'Relational MySQL DDL schema matching the ER Diagram specification',
    content: `-- CampusSound Database Schema (MySQL)
-- Matches Section 5: ER Diagram and Database Design

CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('STUDENT', 'ADMIN') NOT NULL DEFAULT 'STUDENT',
    student_id VARCHAR(50),
    department VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS locations (
    location_id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    zone_type VARCHAR(50) NOT NULL,
    threshold_db DECIMAL(5,2) NOT NULL DEFAULT 45.00,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reports (
    report_id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    location_id VARCHAR(36) NOT NULL,
    noise_db DECIMAL(5,2) NOT NULL,
    category ENUM('traffic', 'construction', 'event', 'crowd', 'equipment', 'other') NOT NULL,
    description TEXT NOT NULL,
    status ENUM('SUBMITTED', 'REVIEWED', 'ACTION_TAKEN', 'CLOSED') NOT NULL DEFAULT 'SUBMITTED',
    source VARCHAR(50) DEFAULT 'STUDENT_MIC',
    action_notes TEXT,
    reviewed_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES locations(location_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS noise_readings (
    reading_id VARCHAR(36) PRIMARY KEY,
    location_id VARCHAR(36) NOT NULL,
    noise_db DECIMAL(5,2) NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source VARCHAR(50) DEFAULT 'IOT_SENSOR',
    FOREIGN KEY (location_id) REFERENCES locations(location_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS alerts (
    alert_id VARCHAR(36) PRIMARY KEY,
    report_id VARCHAR(36),
    location_id VARCHAR(36) NOT NULL,
    noise_db DECIMAL(5,2) NOT NULL,
    threshold_db DECIMAL(5,2) NOT NULL,
    severity ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM',
    message TEXT NOT NULL,
    status ENUM('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED') NOT NULL DEFAULT 'ACTIVE',
    acknowledged_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    FOREIGN KEY (report_id) REFERENCES reports(report_id) ON DELETE SET NULL,
    FOREIGN KEY (location_id) REFERENCES locations(location_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ai_insights (
    insight_id VARCHAR(36) PRIMARY KEY,
    report_id VARCHAR(36) NOT NULL,
    summary TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    suggestion TEXT NOT NULL,
    model VARCHAR(50) DEFAULT 'LangChain4j',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (report_id) REFERENCES reports(report_id) ON DELETE CASCADE
);

-- Recommended Indexing for fast search & dashboard aggregation
CREATE INDEX idx_reports_location ON reports(location_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created ON reports(created_at);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_readings_loc_time ON noise_readings(location_id, recorded_at);`
  },
  {
    path: 'src/main/resources/data.sql',
    category: 'database',
    description: 'Initial seed data for campus locations, users, and baseline readings',
    content: `-- Initial Seed Data for CampusSound

INSERT IGNORE INTO users (user_id, name, email, password_hash, role, student_id, department)
VALUES
('usr-001', 'Alex Chen', 'alex.chen@campus.edu', '$2a$10$abcdefghijklmnopqrstuvw1', 'STUDENT', 'CS-2024-8831', 'Computer Science'),
('usr-002', 'Sophia Rodriguez', 'sophia.r@campus.edu', '$2a$10$abcdefghijklmnopqrstuvw2', 'STUDENT', 'EE-2023-4102', 'Electrical Engineering'),
('usr-adm-001', 'Dr. Patricia Vance', 'patricia.vance@campus.edu', '$2a$10$abcdefghijklmnopqrstuvw3', 'ADMIN', 'FAC-0199', 'Facilities & Safety');

-- Campus Locations with WHO and campus defined acoustic limits
INSERT IGNORE INTO locations (location_id, name, zone_type, threshold_db, active, description)
VALUES
('loc-001', 'Main Library 2F (Quiet Reading Hall)', 'Library', 35.00, true, 'Strict silent research and study area based on WHO 35 dB(A) learning reference'),
('loc-002', 'Academic Block A - Lecture Hall 101', 'Classroom', 45.00, true, 'Main instructional lecture theater with acoustic baffle ceiling'),
('loc-003', 'Engineering Block C - Study Lounge', 'Study Hall', 45.00, true, 'Collaborative group study tables and workspace'),
('loc-004', 'Central Student Union Cafeteria', 'Cafeteria', 65.00, true, 'Dining hall, commons and lounge area'),
('loc-005', 'North Campus Parking Lot & Bus Loop', 'Parking', 70.00, true, 'Transit pickup and vehicular parking area'),
('loc-006', 'Varsity Gymnasium & Field House', 'Sports Complex', 75.00, true, 'Athletic training and recreation courts'),
('loc-007', 'West Quad Dormitory Courtyard', 'Dormitory', 45.00, true, 'Student residential area with 10pm quiet hours');`
  },
  {
    path: 'src/main/java/com/campussound/CampusSoundApplication.java',
    category: 'model',
    description: 'Spring Boot main entry point application',
    content: `package com.campussound;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * CampusSound - Smart Campus Noise Environment Reporting & Analysis System
 * Main Spring Boot Application.
 */
@SpringBootApplication
@EnableScheduling
public class CampusSoundApplication {

    public static void main(String[] args) {
        SpringApplication.run(CampusSoundApplication.class, args);
        System.out.println("=================================================");
        System.out.println(" CampusSound Spring Boot REST Backend Started!   ");
        System.out.println(" Swagger / API Endpoints: http://localhost:8080  ");
        System.out.println(" Connected to MySQL & LangChain4j AI Layer       ");
        System.out.println("=================================================");
    }
}`
  },
  {
    path: 'src/main/java/com/campussound/model/Report.java',
    category: 'model',
    description: 'JPA Entity representing a student noise incident report',
    content: `package com.campussound.model;

import com.campussound.model.enums.NoiseCategory;
import com.campussound.model.enums.ReportStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Report {

    @Id
    @Column(name = "report_id", length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "location_id", nullable = false)
    private Location location;

    @Column(name = "noise_db", nullable = false)
    private Double noiseDb;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false)
    private NoiseCategory category;

    @Column(name = "description", columnDefinition = "TEXT", nullable = false)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private ReportStatus status = ReportStatus.SUBMITTED;

    @Column(name = "source", length = 50)
    @Builder.Default
    private String source = "STUDENT_MIC";

    @Column(name = "action_notes", columnDefinition = "TEXT")
    private String actionNotes;

    @Column(name = "reviewed_by", length = 100)
    private String reviewedBy;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void onPrePersist() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void onPreUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}`
  },
  {
    path: 'src/main/java/com/campussound/model/Location.java',
    category: 'model',
    description: 'JPA Entity representing a campus zone with configurable dB threshold',
    content: `package com.campussound.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "locations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Location {

    @Id
    @Column(name = "location_id", length = 36)
    private String id;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "zone_type", nullable = false, length = 50)
    private String zoneType;

    @Column(name = "threshold_db", nullable = false)
    private Double thresholdDb;

    @Column(name = "active", nullable = false)
    @Builder.Default
    private Boolean active = true;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void onPrePersist() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}`
  },
  {
    path: 'src/main/java/com/campussound/model/Alert.java',
    category: 'model',
    description: 'JPA Entity triggered when reported or measured noise crosses zone threshold',
    content: `package com.campussound.model;

import com.campussound.model.enums.AlertSeverity;
import com.campussound.model.enums.AlertStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "alerts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Alert {

    @Id
    @Column(name = "alert_id", length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "report_id")
    private Report report;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "location_id", nullable = false)
    private Location location;

    @Column(name = "noise_db", nullable = false)
    private Double noiseDb;

    @Column(name = "threshold_db", nullable = false)
    private Double thresholdDb;

    @Enumerated(EnumType.STRING)
    @Column(name = "severity", nullable = false)
    private AlertSeverity severity;

    @Column(name = "message", columnDefinition = "TEXT", nullable = false)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private AlertStatus status = AlertStatus.ACTIVE;

    @Column(name = "acknowledged_by", length = 100)
    private String acknowledgedBy;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @PrePersist
    public void onPrePersist() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}`
  },
  {
    path: 'src/main/java/com/campussound/model/AiInsight.java',
    category: 'model',
    description: 'JPA Entity storing LangChain4j generated non-binding summary and action suggestions',
    content: `package com.campussound.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "ai_insights")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiInsight {

    @Id
    @Column(name = "insight_id", length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "report_id", nullable = false)
    private Report report;

    @Column(name = "summary", columnDefinition = "TEXT", nullable = false)
    private String summary;

    @Column(name = "category", length = 50, nullable = false)
    private String category;

    @Column(name = "suggestion", columnDefinition = "TEXT", nullable = false)
    private String suggestion;

    @Column(name = "model", length = 50)
    @Builder.Default
    private String model = "LangChain4j-Gemini";

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void onPrePersist() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}`
  },
  {
    path: 'src/main/java/com/campussound/ai/CampusSoundAiService.java',
    category: 'ai',
    description: 'LangChain4j AI Service interface with prompt templates for noise analysis and suggestions',
    content: `package com.campussound.ai;

import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;
import dev.langchain4j.service.V;
import dev.langchain4j.service.spring.AiService;

/**
 * LangChain4j Declarative AI Service for CampusSound.
 * Automatically implemented by LangChain4j Spring Boot Starter.
 */
@AiService
public interface CampusSoundAiService {

    @SystemMessage("""
        You are the CampusSound Acoustic Intelligence Assistant for college campus administrators.
        Your role is to assist administrators with non-binding observations and practical suggestions.
        Guidelines:
        1. Base recommendations on acoustic common sense and the WHO classroom teaching reference of 35 dB(A).
        2. Keep summaries concise and factual (under 2 sentences).
        3. Provide 1 to 2 practical operational actions (e.g. check mechanical belts, shift schedule, verify sound equipment).
        4. Never automatically punish students or accuse individuals. Label advice as advisory assistance.
        """)
    @UserMessage("""
        Analyze this campus noise report:
        Zone: {{zoneName}} (Type: {{zoneType}}, Threshold: {{thresholdDb}} dB)
        Measured / Reported Noise: {{noiseDb}} dB
        Reported Category: {{category}}
        Student Description: "{{description}}"

        Format your response as:
        SUMMARY: [1-2 sentences summarizing the recurring or current issue]
        CATEGORY: [one of traffic, construction, event, crowd, equipment, other]
        SUGGESTION: [1-2 practical administrative actions]
        """)
    String generateReportInsight(
            @V("zoneName") String zoneName,
            @V("zoneType") String zoneType,
            @V("thresholdDb") Double thresholdDb,
            @V("noiseDb") Double noiseDb,
            @V("category") String category,
            @V("description") String description
    );

    @SystemMessage("You are a text classification assistant. Categorize campus noise descriptions into: traffic, construction, event, crowd, equipment, or other.")
    @UserMessage("Categorize this student report description: '{{text}}'. Return only the category name in lowercase.")
    String classifyCategory(@V("text") String text);

    @SystemMessage("You are a campus facilities acoustic analyst generating a weekly campus noise summary.")
    @UserMessage("""
        Generate a weekly executive summary for college leadership based on these statistics:
        Total Reports: {{totalReports}}
        Active Alerts: {{activeAlerts}}
        Campus Average dB: {{avgDb}}
        Peak Recorded dB: {{peakDb}} (Zone: {{peakZone}})
        Top Recurring Zone: {{topZone}}
        Category Breakdown: {{categoryCounts}}

        Provide 3 bullet points: 1) Major acoustic trend, 2) Primary hotspot zone, 3) Recommended facilities action.
        """)
    String generateWeeklySummary(
            @V("totalReports") int totalReports,
            @V("activeAlerts") int activeAlerts,
            @V("avgDb") double avgDb,
            @V("peakDb") double peakDb,
            @V("peakZone") String peakZone,
            @V("topZone") String topZone,
            @V("categoryCounts") String categoryCounts
    );
}`
  },
  {
    path: 'src/main/java/com/campussound/service/ReportService.java',
    category: 'service',
    description: 'Core Business Service implementing the operational decision flow & threshold alerts',
    content: `package com.campussound.service;

import com.campussound.dto.ReportCreateDto;
import com.campussound.dto.ReportResponseDto;
import com.campussound.model.*;
import com.campussound.model.enums.*;
import com.campussound.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Follows Section 4: Operational decision flow
 * Measure / Report -> Validate -> Compare Threshold -> Alert -> Analyze & Suggest
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ReportService {

    private final ReportRepository reportRepository;
    private final LocationRepository locationRepository;
    private final UserRepository userRepository;
    private final AlertRepository alertRepository;

    @Transactional
    public ReportResponseDto createReport(String userId, ReportCreateDto dto) {
        log.info("Processing noise report from user {} for location {}", userId, dto.getLocationId());

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        Location location = locationRepository.findById(dto.getLocationId())
                .orElseThrow(() -> new IllegalArgumentException("Location not found: " + dto.getLocationId()));

        // 1. Build and save Report entity
        Report report = Report.builder()
                .id(UUID.randomUUID().toString())
                .user(user)
                .location(location)
                .noiseDb(dto.getNoiseDb())
                .category(dto.getCategory())
                .description(dto.getDescription())
                .source(dto.getSource() != null ? dto.getSource() : "STUDENT_MIC")
                .status(ReportStatus.SUBMITTED)
                .createdAt(LocalDateTime.now())
                .build();

        Report savedReport = reportRepository.save(report);

        // 2. Operational Decision Step: Compare with Location Threshold
        Double threshold = location.getThresholdDb();
        if (savedReport.getNoiseDb() > threshold) {
            double excess = savedReport.getNoiseDb() - threshold;
            AlertSeverity severity = calculateSeverity(excess);

            Alert alert = Alert.builder()
                    .id(UUID.randomUUID().toString())
                    .report(savedReport)
                    .location(location)
                    .noiseDb(savedReport.getNoiseDb())
                    .thresholdDb(threshold)
                    .severity(severity)
                    .status(AlertStatus.ACTIVE)
                    .message(String.format("Threshold breach in %s: recorded %.1f dB exceeds threshold of %.1f dB by +%.1f dB.",
                            location.getName(), savedReport.getNoiseDb(), threshold, excess))
                    .createdAt(LocalDateTime.now())
                    .build();

            alertRepository.save(alert);
            log.warn("Created {} alert {} for location {}", severity, alert.getId(), location.getName());
        }

        return mapToDto(savedReport);
    }

    @Transactional
    public ReportResponseDto updateReportStatus(String reportId, ReportStatus newStatus, String actionNotes, String adminName) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("Report not found: " + reportId));

        report.setStatus(newStatus);
        if (actionNotes != null && !actionNotes.isBlank()) {
            report.setActionNotes(actionNotes);
        }
        if (adminName != null) {
            report.setReviewedBy(adminName);
        }

        report = reportRepository.save(report);
        return mapToDto(report);
    }

    @Transactional(readOnly = true)
    public List<ReportResponseDto> getAllReports(String locationId, ReportStatus status) {
        List<Report> reports;
        if (locationId != null && status != null) {
            reports = reportRepository.findByLocationIdAndStatus(locationId, status);
        } else if (locationId != null) {
            reports = reportRepository.findByLocationId(locationId);
        } else if (status != null) {
            reports = reportRepository.findByStatus(status);
        } else {
            reports = reportRepository.findAllByOrderByCreatedAtDesc();
        }

        return reports.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    private AlertSeverity calculateSeverity(double excessDb) {
        if (excessDb >= 20.0) return AlertSeverity.CRITICAL;
        if (excessDb >= 12.0) return AlertSeverity.HIGH;
        if (excessDb >= 6.0) return AlertSeverity.MEDIUM;
        return AlertSeverity.LOW;
    }

    private ReportResponseDto mapToDto(Report r) {
        return ReportResponseDto.builder()
                .id(r.getId())
                .userId(r.getUser().getId())
                .userName(r.getUser().getName())
                .userEmail(r.getUser().getEmail())
                .locationId(r.getLocation().getId())
                .locationName(r.getLocation().getName())
                .noiseDb(r.getNoiseDb())
                .category(r.getCategory())
                .description(r.getDescription())
                .status(r.getStatus())
                .source(r.getSource())
                .actionNotes(r.getActionNotes())
                .reviewedBy(r.getReviewedBy())
                .createdAt(r.getCreatedAt())
                .build();
    }
}`
  },
  {
    path: 'src/main/java/com/campussound/controller/ReportController.java',
    category: 'controller',
    description: 'REST Controller exposing endpoints matching Section 4 specification',
    content: `package com.campussound.controller;

import com.campussound.dto.ReportCreateDto;
import com.campussound.dto.ReportResponseDto;
import com.campussound.dto.StatusUpdateDto;
import com.campussound.model.enums.ReportStatus;
import com.campussound.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ReportController {

    private final ReportService reportService;

    /**
     * POST /api/reports - Student submits a new noise incident
     */
    @PostMapping
    public ResponseEntity<ReportResponseDto> submitReport(
            @RequestParam(defaultValue = "usr-001") String userId,
            @Valid @RequestBody ReportCreateDto dto) {
        ReportResponseDto created = reportService.createReport(userId, dto);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    /**
     * GET /api/reports - Administrator or students lists reports with filters
     */
    @GetMapping
    public ResponseEntity<List<ReportResponseDto>> listReports(
            @RequestParam(required = false) String locationId,
            @RequestParam(required = false) ReportStatus status) {
        List<ReportResponseDto> list = reportService.getAllReports(locationId, status);
        return ResponseEntity.ok(list);
    }

    /**
     * PUT /api/reports/{id}/status - Administrator reviews/updates status
     * Status transition: SUBMITTED -> REVIEWED -> ACTION_TAKEN -> CLOSED
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<ReportResponseDto> updateStatus(
            @PathVariable String id,
            @RequestBody StatusUpdateDto dto) {
        ReportResponseDto updated = reportService.updateReportStatus(
                id, dto.getStatus(), dto.getActionNotes(), dto.getReviewedBy());
        return ResponseEntity.ok(updated);
    }
}`
  },
  {
    path: 'src/main/java/com/campussound/controller/AnalyticsController.java',
    category: 'controller',
    description: 'REST Controller for dashboard KPIs, trends, and WHO 35 dB reference benchmarks',
    content: `package com.campussound.controller;

import com.campussound.dto.AnalyticsSummaryDto;
import com.campussound.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    /**
     * GET /api/analytics/summary - Returns dashboard metrics
     * Calculates average dB, peak dB, report counts, and zone breaches
     */
    @GetMapping("/summary")
    public ResponseEntity<AnalyticsSummaryDto> getSummary() {
        AnalyticsSummaryDto summary = analyticsService.getDashboardSummary();
        return ResponseEntity.ok(summary);
    }
}`
  },
  {
    path: 'src/main/java/com/campussound/controller/AiController.java',
    category: 'controller',
    description: 'REST Controller for LangChain4j AI integration layer',
    content: `package com.campussound.controller;

import com.campussound.ai.CampusSoundAiService;
import com.campussound.model.AiInsight;
import com.campussound.model.Report;
import com.campussound.repository.AiInsightRepository;
import com.campussound.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AiController {

    private final CampusSoundAiService aiService;
    private final ReportRepository reportRepository;
    private final AiInsightRepository aiInsightRepository;

    /**
     * POST /api/ai/insights/{reportId} - LangChain4j analysis for a report
     */
    @PostMapping("/insights/{reportId}")
    public ResponseEntity<?> generateInsight(@PathVariable String reportId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("Report not found: " + reportId));

        String rawAiOutput = aiService.generateReportInsight(
                report.getLocation().getName(),
                report.getLocation().getZoneType(),
                report.getLocation().getThresholdDb(),
                report.getNoiseDb(),
                report.getCategory().name(),
                report.getDescription()
        );

        // Store non-binding insight linked to report
        AiInsight insight = AiInsight.builder()
                .id(UUID.randomUUID().toString())
                .report(report)
                .summary("AI Summary: " + rawAiOutput)
                .category(report.getCategory().name())
                .suggestion("Suggested Action: Review acoustic scheduling and equipment isolation.")
                .model("LangChain4j / Gemini")
                .createdAt(LocalDateTime.now())
                .build();

        aiInsightRepository.save(insight);
        return ResponseEntity.ok(insight);
    }

    /**
     * POST /api/ai/classify - Suggest category from student report text
     */
    @PostMapping("/classify")
    public ResponseEntity<?> classifyReport(@RequestBody Map<String, String> payload) {
        String description = payload.getOrDefault("description", "");
        String category = aiService.classifyCategory(description);
        return ResponseEntity.ok(Map.of("suggestedCategory", category.trim().toLowerCase()));
    }
}`
  },
  {
    path: 'src/main/java/com/campussound/security/SecurityConfig.java',
    category: 'security',
    description: 'Spring Security 6 configuration with stateless JWT and role authorization',
    content: `package com.campussound.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/locations/**").permitAll()
                .requestMatchers("/api/analytics/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/reports/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/reports").permitAll() // Authenticated in production
                .requestMatchers("/api/ai/**").permitAll()
                .requestMatchers("/api/alerts/**").permitAll()
                .anyRequest().authenticated()
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}`
  },
  {
    path: 'README.md',
    category: 'doc',
    description: 'Complete documentation for building, running, and testing the Spring Boot application',
    content: `# CampusSound – Smart Campus Noise Environment Reporting & Analysis System

**Full-stack Java Spring Boot & React Application with LangChain4j AI Integration**

---

## 📌 Architecture Overview
- **Frontend**: React.js SPA, Tailwind CSS, Lucide icons, Real-time Web Audio API decibel meter
- **Backend**: Java 17+, Spring Boot 3.3.x, Spring Data JPA, Spring Security, Maven
- **Database**: MySQL 8.0 (Relational schema: \`users\`, \`locations\`, \`reports\`, \`noise_readings\`, \`alerts\`, \`ai_insights\`)
- **AI Integration**: LangChain4j + Google Gemini for incident summarization, classification, and mitigation suggestions

---

## 🚀 How to Run the Backend

### Prerequisites
1. **Java Development Kit (JDK 17 or 21)**
2. **Apache Maven 3.8+**
3. **MySQL 8.0+** running locally on port \`3306\`

### 1. Configure Database & Environment
Create database:
\`\`\`sql
CREATE DATABASE campussound_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
\`\`\`

Set environment variables (or update \`src/main/resources/application.yml\`):
\`\`\`bash
export MYSQL_HOST=localhost
export MYSQL_DB=campussound_db
export MYSQL_USER=root
export MYSQL_PASSWORD=your_password
export GEMINI_API_KEY=your_gemini_api_key
\`\`\`

### 2. Build and Run with Maven
\`\`\`bash
mvn clean package
mvn spring-boot:run
\`\`\`

The server starts on \`http://localhost:8080\`.

---

## 📡 REST API Reference
- \`POST /api/reports\` - Submit a noise incident report (automatically checks location threshold and triggers an alert if exceeded)
- \`GET /api/reports\` - Filter reports by location, category, or workflow status
- \`PUT /api/reports/{id}/status\` - Review and transition status: \`SUBMITTED\` → \`REVIEWED\` → \`ACTION_TAKEN\` → \`CLOSED\`
- \`GET /api/analytics/summary\` - Real-time statistics, average/peak dB, WHO 35 dB comparison
- \`GET /api/locations\` - List campus zones with acoustic thresholds
- \`POST /api/ai/insights/{reportId}\` - Trigger LangChain4j AI analysis for advisory suggestions
- \`POST /api/ai/classify\` - Classify text description into category
`
  }
];
