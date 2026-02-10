# FocusFlow - Structured Learning Platform

## 🚀 Project Status: Beta
**Current Version:** 0.8.0 | **Last Updated:** February 2025  
*This platform is currently in active development and not yet released to public users.*

## 📋 Table of Contents
- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Solution](#solution)
- [Core Features](#core-features)
- [System Architecture](#system-architecture)
- [Microservices Breakdown](#microservices-breakdown)
- [Frontend Application](#frontend-application)
- [DevOps & Infrastructure](#devops--infrastructure)
- [Diagrams & Documentation](#diagrams--documentation)
- [Development Setup](#development-setup)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)

## Overview

**FocusFlow** is a structured learning platform designed to help learners, students, and professionals create and follow distraction-free learning paths. The platform provides a centralized environment where users can organize courses, track progress, and maintain focus without the distractions of traditional learning platforms.

### Problem Statement
Modern learners face constant distractions across multiple platforms, lack structured progress tracking, and struggle to maintain consistent learning routines. Existing platforms often mix social features, recommendations, and unrelated content that disrupts the "flow state" essential for deep learning.

### Solution
FocusFlow provides:
- **Structured Course Management**: Create custom learning paths with clear progression
- **Minimalist Interface**: Distraction-free environment optimized for learning
- **Progress Tracking**: Visual indicators and completion metrics
- **Integrated Resources**: Attach various course materials (videos, articles, documents) to courses
- **Cross-Platform Access**: Web and mobile applications with synchronized progress

## ✨ Core Features

### 1. Course Management Service
**Goal:** Create a comprehensive course feature with centralized, structured course management and progress tracking.

| Feature | Description | Status |
|---------|-------------|--------|
| Course Creation | Create structured courses with modules and lessons | ✅ Implemented |
| Progress Tracking | Track completion status and learning milestones | ✅ Implemented |
| Course Organization | Categorize and filter courses by topic, difficulty, etc. | ✅ Implemented |
| Flow State Timer | Integrated Pomodoro-style focus timer | 🚧 In Progress |

**Success Metrics:**
- ⏱️ **Performance:** Course creation within 30 seconds
- 🔒 **Security:** Full ownership and access control for course creators
- 👤 **UX:** Intuitive interface with <1 minute course setup

### 2. Course Material Service
**Goal:** Enable users to attach various learning materials to their courses.

| Feature | Description | Status |
|---------|-------------|--------|
| YouTube Integration | Attach videos via YouTube API | ✅ Implemented |
| PDF/Document Upload | Upload and view learning materials | 🚧 In Progress |
| Link Management | Save external resources with preview | ✅ Implemented |
| Material Organization | Categorize materials by type and relevance | ✅ Implemented |

**Why This Matters:**  
This feature directly supports our objective of creating structured learning spaces by allowing users to curate and organize all relevant materials in one place, reducing context-switching and maintaining focus.

### 3. Authentication Service
**Goal:** Secure, performant authentication for web and mobile applications.

| Feature | Description | Status |
|---------|-------------|--------|
| Email/Password Auth | Traditional login with secure password handling | ✅ Implemented |
| OAuth Integration | Social login options | 🚧 Planned |
| Password Reset | Secure password recovery flow | ✅ Implemented |
| Session Management | JWT-based session handling with Laravel Sanctum | ✅ Implemented |
| CSRF Protection | Full CSRF protection coverage | ✅ Implemented |

**Performance Target:** Login authentication within 100ms

## 🏗️ System Architecture

### Microservices Architecture


## 📦 Microservices Breakdown

### 1. Auth Service
**Repository:** [focusflow-auth](https://github.com/yourusername/focusflow-auth)  
**Version:** 1.2.0  
**Tech Stack:** Laravel 10, Laravel Sanctum, PostgreSQL, Inertia.js

**Key Responsibilities:**
- User registration and authentication
- Session management and token handling
- Password reset functionality
- User profile management
- Inertia.js integration for server-side rendering

**API Endpoints:**

POST /api/auth/register # Register new user
POST /api/auth/login # User login
POST /api/auth/logout # User logout
POST /api/auth/forgot-password # Password reset request
POST /api/auth/reset-password # Complete password reset
GET /api/auth/user # Get current user data


### 3. Course Material Service
**Repository:** [focusflow-material](https://github.com/yourusername/focusflow-material)  
**Version:** 1.0.8  
**Tech Stack:** Go 1.21, Gin Web Framework, PostgreSQL, YouTube Data API v3

**Key Responsibilities:**
- YouTube video integration and metadata fetching
- Learning material attachment and organization
- External resource management
- Content categorization and tagging
- S3 file storage integration

**API Endpoints:**

POST /api/materials/youtube # Attach YouTube video
POST /api/materials/upload # Upload document
GET /api/courses/{id}/materials # Get course materials
DELETE /api/materials/{id} # Remove material
GET /api/materials/search # Search materials


## 💻 Frontend Application

### Nuxt.js Frontend
**Repository:** [focusflow-frontend](https://github.com/yourusername/focusflow-frontend)  
**Version:** 1.0.3  
**Tech Stack:** Nuxt.js 3, Vue.js 3, TypeScript, Tailwind CSS, Axios

**Key Features:**
- Server-side rendering (SSR) for optimal SEO and performance
- Progressive Web App (PWA) capabilities
- Responsive design for desktop and mobile
- Real-time progress updates
- Interactive course management interface
- YouTube video player integration

  
## 🔧 DevOps & Infrastructure

### Infrastructure as Code (Terraform)
**Repository:** [focusflow-infra](https://github.com/yourusername/focusflow-infra)  
**Version:** 1.0.0

**AWS Infrastructure Components:**
```hcl
# Main Infrastructure
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  # VPC configuration for microservices
}

module "ec2" {
  source = "./modules/ec2"
  # EC2 instances for microservices deployment
  instance_count = 4
  instance_type  = "t3.medium"
}

module "rds" {
  source = "./modules/rds"
  # PostgreSQL RDS instances
  database_name = "focusflow_db"
  engine_version = "14.7"
}

module "s3" {
  source = "./modules/s3"
  # S3 buckets for static assets and file storage
  buckets = ["focusflow-assets", "focusflow-materials"]
}

module "elasticache" {
  source = "./modules/elasticache"
  # Redis cache for session and data caching
  node_type = "cache.t3.micro"
}

```
**CI/CD Pipeline Architecture**

**Containerization Strategy**

Each service is containerized with optimized Docker configurations:


**Monitoring & Observability Stack**

AWS CloudWatch: Centralized logging and metrics collection

Prometheus & Grafana: Custom dashboards for service metrics

Health Endpoints: /health endpoints on all services

Application Performance Monitoring: Structured logging with request IDs

Error Tracking: Sentry integration for real-time error monitoring


## 🔍 Monitoring & Observability Stack

We utilize a robust suite of tools to ensure system health and performance:

* **AWS CloudWatch:** Centralized logging and metrics collection.
* **Prometheus & Grafana:** Custom dashboards for service metrics.
* **Health Endpoints:** `/health` endpoints implemented on all services.
* **Application Performance Monitoring (APM):** Structured logging with unique Request IDs for distributed tracing.
* **Error Tracking:** Sentry integration for real-time error monitoring and alerting.

---

## 📊 Diagrams & Documentation

| # | Type | Description | Link |
| :--- | :--- | :--- | :--- |
| 1 | **System Architecture** | High-level overview of FocusFlow microservices, databases, and infra. | [View Diagram](https://docs/diagrams/system-architecture.png) |
| 2 | **Component Diagram** | Detailed view of system components and internal interactions. | [View Diagram](https://docs/diagrams/component-diagram.png) |
| 3 | **Use Case Diagram** | User interactions, actors, and functional requirements. | [View Diagram](https://docs/diagrams/use-case-diagram.png) |
| 4 | **Sequence Diagrams** | Step-by-step logic for Course Creation, Auth Flow, and Material Attachment. | [Folder](https://docs/diagrams/) |
| 5 | **Entity Relationship (ERD)** | Complete database schema, tables, and constraints. | [View Diagram](https://docs/diagrams/erd-diagram.png) |
| 6 | **Deployment Architecture** | AWS layout (EC2, RDS, S3, and VPC Networking). | [View Diagram](https://docs/diagrams/deployment-architecture.png) |
| 7 | **Infrastructure as Code** | Visual representation of Terraform-managed resources. | [View Diagram](https://docs/diagrams/terraform-infrastructure.png) |
| 8 | **CI/CD Pipeline** | End-to-end workflow from commit to production. | [View Diagram](https://docs/diagrams/cicd-pipeline.png) |
| 9 | **Microservices Comm.** | Communication via API Gateway and Service Discovery. | [View Diagram](https://docs/diagrams/microservices-communication.png) |
| 10 | **Monitoring Architecture** | Setup for CloudWatch, Prometheus, and Grafana. | [View Diagram](https://docs/diagrams/monitoring-architecture.png) |

---

## 🛠️ Development Setup

### Prerequisites
Ensure you have the following versions (or higher) installed:
* **Go 1.21+** (Backend services)
* **PHP 8.2+** with **Composer** (Auth service)
* **Node.js 18+** and **npm** (Nuxt.js frontend)
* **Docker & Docker Compose** (Containerization)
* **PostgreSQL 14+** (Primary database)
* **Redis 7+** (Caching)
* **AWS CLI** & **Terraform 1.5+** (Infrastructure management)

### Local Development Environment
```bash
# Clone all repositories
git clone [https://github.com/yourusername/focusflow-auth.git](https://github.com/yourusername/focusflow-auth.git)
git clone [https://github.com/yourusername/focusflow-course.git](https://github.com/yourusername/focusflow-course.git)
git clone [https://github.com/yourusername/focusflow-material.git](https://github.com/yourusername/focusflow-material.git)
git clone [https://github.com/yourusername/focusflow-frontend.git](https://github.com/yourusername/focusflow-frontend.git)
git clone [https://github.com/yourusername/focusflow-infra.git](https://github.com/yourusername/focusflow-infra.git)

# Start development environment
cd focusflow-infra/docker
docker-compose -f docker-compose.dev.yml up -d 


