# FixAround — System Architecture

## Overview

FixAround is a three-tier web application connecting customers with verified local service professionals for everyday and emergency repairs.

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT TIER                               │
│                                                                   │
│  React 18 + Vite + Tailwind CSS                                  │
│  ├── Public Pages (Home, Services, Auth)                         │
│  ├── Customer Dashboard (Bookings, Payments, Reviews)            │
│  ├── Technician Dashboard (Jobs, Earnings, Profile)              │
│  └── Admin Dashboard (Users, Analytics, Settings)                │
│                                                                   │
│  Communication: Axios HTTP → REST API                            │
│                 Socket.IO → Real-time updates (optional)         │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                      HTTP / WebSocket
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                       APPLICATION TIER                            │
│                                                                   │
│  Node.js + Express.js                                            │
│  ├── Routes → Controllers → Services → Repositories             │
│  ├── Middleware (Auth, RBAC, Validation, Rate Limiting)          │
│  ├── Background Jobs (node-cron assignment expiry)               │
│  └── Socket.IO Server (optional real-time)                       │
│                                                                   │
│  Security: JWT, Helmet, CORS, bcrypt, parameterized SQL         │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                    mysql2 connection pool
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                        DATA TIER                                  │
│                                                                   │
│  MySQL 8.0+                                                      │
│  ├── 22 normalized tables                                        │
│  ├── Foreign keys, indexes, constraints                          │
│  ├── DECIMAL(12,2) for monetary values                           │
│  ├── UTC timestamps                                              │
│  ├── Transactions for critical operations                        │
│  └── Haversine distance queries for location                     │
└─────────────────────────────────────────────────────────────────┘
```

## Request Flow

```
Client Request
    → Nginx/Vite Proxy
    → Express Middleware Stack
        → CORS check
        → Helmet security headers
        → Rate limiting
        → Body parser (size limited)
        → Morgan logging
    → Route matching (/api/v1/*)
    → Auth middleware (JWT verification)
    → Role authorization
    → Input validation (express-validator)
    → Controller (thin request handler)
    → Service (business logic, validation)
    → Repository (parameterized SQL queries)
    → MySQL (connection pool)
    → Response (consistent JSON format)
```

## Booking State Machine

```
                    ┌──────────────────────────┐
                    │        REQUESTED          │
                    │   (Customer creates)      │
                    └─────┬──────────┬──────────┘
                          │          │
                   assign │          │ cancel
                          ▼          ▼
                    ┌──────────┐ ┌──────────┐
                    │ ASSIGNED  │ │CANCELLED │
                    │(Tech gets)│ └──────────┘
                    └──┬───┬───┘
                 accept│   │reject/expire
                       ▼   ▼
              ┌──────────┐ ┌──────────────────────┐
              │ ACCEPTED  │ │REJECTED/EXPIRED       │
              │           │ │→ Next tech or          │
              └────┬──────┘ │  NO_TECH_AVAILABLE    │
                   │        └──────────────────────┘
                   ▼
              ┌──────────┐
              │ON_THE_WAY│
              └────┬─────┘
                   ▼
              ┌──────────┐
              │ ARRIVED   │
              └────┬──────┘
                   ▼
              ┌──────────────┐
              │ IN_PROGRESS   │
              └────┬──────────┘
                   ▼
              ┌───────────────────┐
              │AWAITING_APPROVAL  │
              │(Estimate approval)│
              └────┬──────────────┘
                   ▼
              ┌──────────┐
              │COMPLETED │──── → DISPUTED (warranty claim)
              └──────────┘
```

## Emergency Backup System

```
Customer → Emergency Request
    │
    ▼
Find Nearest Eligible Technician (Haversine + skills + verified + online)
    │
    ▼
Create Assignment (deadline = NOW + timeout_seconds)
    │
    ├── Technician Accepts → Booking ACCEPTED → Normal flow
    │
    ├── Technician Rejects → Find next tech → New assignment
    │
    └── Deadline Expires (checked by node-cron every 30s)
        │
        ├── attempts < max → Find next tech → New assignment
        │
        └── attempts >= max → NO_TECHNICIAN_AVAILABLE
```

## Data Flow — Payment

```
Booking COMPLETED
    → Customer initiates payment
    → Payment record created (PENDING)
    → [Dev] Sandbox simulation / [Prod] Gateway redirect
    → Server verifies payment (webhook/callback)
    → Transaction:
        ├── Update payment → SUCCESS
        ├── Generate invoice
        ├── Calculate commission (configurable %)
        ├── Create technician earnings record
        ├── Update booking totals
        └── Send notifications
```

## Security Layers

| Layer | Mechanism |
|-------|-----------|
| Transport | HTTPS (production) |
| Headers | Helmet (CSP, HSTS, XSS filter) |
| Rate Limiting | express-rate-limit per IP |
| Authentication | JWT with bcrypt password hashing |
| Authorization | Role-based middleware (customer/technician/admin) |
| Input Validation | express-validator on all endpoints |
| SQL Injection | Parameterized queries (mysql2 ? placeholders) |
| CORS | Configurable origin whitelist |
| Data | No PII in JWT, no plaintext passwords, DECIMAL for money |
| Audit | Immutable audit_logs and booking_status_history tables |
