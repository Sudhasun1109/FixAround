# FixAround — Smart Local Service & Emergency Repair Platform

A complete full-stack web application connecting customers with verified local service professionals for everyday repairs and emergency services.

## 🚀 Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v6, Axios, Lucide React, React Hook Form |
| **Backend** | Node.js, Express.js, REST API, JWT, bcrypt, Socket.IO |
| **Database** | MySQL 8+, mysql2 driver, 22 normalized tables |
| **Testing** | Jest, Supertest |
| **Docs** | Swagger/OpenAPI, Postman |

## 📋 Features

- **Customer Portal**: Service search, booking, estimates, payments, reviews, warranty claims
- **Technician Portal**: Profile management, job requests, estimates, earnings tracking
- **Admin Dashboard**: User management, verification, analytics, platform settings
- **Emergency Service**: Automatic technician backup with configurable response timers
- **Transparent Pricing**: Indicative ranges, detailed estimates, customer approval workflow
- **Booking State Machine**: 13-state lifecycle with validated transitions and audit trail
- **Digital Payments**: Sandbox payment integration with invoice generation
- **Location-based Search**: Haversine distance calculation for nearby technicians
- **Real-time Notifications**: In-app notification system with database backing

## 🛠️ Prerequisites

- **Node.js** 18+ (LTS recommended)
- **MySQL** 8.0+
- **npm** 9+
- **Git**

## ⚡ Quick Start

### 1. Clone and install

```bash
git clone <repository-url>
cd fixaround
npm run install:all
```

### 2. Set up MySQL database

Open MySQL Workbench or command line:

```sql
-- Create the database and tables
SOURCE database/schema.sql;

-- Load development seed data
SOURCE database/seed.sql;
```

Or use the npm scripts:
```bash
# Create a .env file in /server first (see step 3)
npm run db:schema
npm run db:seed
```

### 3. Configure environment

```bash
# Server environment
cp .env.example server/.env
```

Edit `server/.env` with your MySQL credentials:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=fixaround_db
JWT_SECRET=your-secret-key-change-this-in-production
```

### 4. Start development servers

```bash
# Start both frontend and backend
npm run dev

# Or start separately:
npm run dev:server   # Backend on http://localhost:3000
npm run dev:client   # Frontend on http://localhost:5173
```

### 5. Access the application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api/v1
- **API Docs**: http://localhost:3000/api/v1/docs

### 6. Test accounts (seed data)

All passwords are: `Password123!`

| Role | Email | Purpose |
|------|-------|---------|
| Admin | admin@fixaround.com | Platform administration |
| Customer | priya.sharma@example.com | Customer with booking history |
| Customer | rahul.verma@example.com | Customer with completed booking |
| Customer | anita.desai@example.com | Customer with emergency request |
| Technician | suresh.electrician@example.com | Verified electrician |
| Technician | ravi.plumber@example.com | Verified plumber |
| Technician | mohan.ac@example.com | Verified AC technician |
| Technician | deepak.mechanic@example.com | Verified mechanic |
| Technician | amit.carpenter@example.com | Pending verification |

## 📁 Project Structure

```
fixaround/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── context/           # React context providers
│   │   ├── hooks/             # Custom hooks
│   │   ├── layouts/           # Page layouts
│   │   ├── pages/             # Route pages
│   │   ├── routes/            # Router configuration
│   │   ├── services/          # API service layer
│   │   └── utils/             # Utilities and constants
│   └── package.json
├── server/                    # Express backend
│   ├── src/
│   │   ├── config/            # Database and env config
│   │   ├── controllers/       # Request handlers
│   │   ├── jobs/              # Background cron jobs
│   │   ├── middleware/        # Auth, validation, error handling
│   │   ├── repositories/     # Database queries
│   │   ├── routes/            # API route definitions
│   │   ├── services/          # Business logic
│   │   ├── utils/             # Helpers and constants
│   │   ├── validators/        # Input validation rules
│   │   ├── app.js             # Express app setup
│   │   └── server.js          # Server entry point
│   └── package.json
├── database/                  # Database files
│   ├── schema.sql             # Complete DDL (22 tables)
│   ├── seed.sql               # Development seed data
│   └── er-diagram.md          # Mermaid ER diagram
├── docs/                      # Documentation
│   ├── architecture.md
│   ├── api-documentation.md
│   └── deployment-guide.md
├── .env.example
├── .gitignore
├── package.json               # Root workspace
└── README.md
```

## 🧪 Testing

```bash
cd server
npm test                              # Run all tests
npm test -- --testPathPattern=auth    # Auth tests only
npm test -- --testPathPattern=booking # Booking tests only
```

## 🔑 API Overview

Base URL: `http://localhost:3000/api/v1`

| Group | Endpoints | Auth |
|-------|----------|------|
| Auth | `/auth/register`, `/auth/login`, `/auth/me` | Public / JWT |
| Services | `/services`, `/services/:id` | Public / Admin |
| Technicians | `/technicians`, `/technicians/nearby` | Public / JWT |
| Bookings | `/bookings`, `/bookings/:id` | JWT |
| Estimates | `/bookings/:id/estimates` | JWT |
| Payments | `/bookings/:id/payments` | JWT |
| Invoices | `/invoices/:id`, `/my-invoices` | JWT |
| Reviews | `/bookings/:id/reviews` | JWT |
| Claims | `/bookings/:id/claims` | JWT |
| Notifications | `/notifications` | JWT |
| Admin | `/admin/dashboard`, `/admin/users` | Admin JWT |

Full API documentation available at `/api/v1/docs` (Swagger UI).

## 🔒 Security

- JWT authentication with bcrypt password hashing
- Role-based access control (Customer, Technician, Admin)
- Parameterized SQL queries (no SQL injection)
- Helmet security headers
- Rate limiting on auth and API endpoints
- CORS configuration via environment variables
- Server-side validation on all inputs
- No secrets in code or version control

## 💰 Currency

All monetary values use **INR (₹)** stored as `DECIMAL(12,2)` in MySQL.

## 🚨 Emergency Service

The emergency backup system uses server-side timers:
1. Customer requests emergency service
2. System finds nearest eligible technician
3. Technician has 5 minutes (configurable) to respond
4. If no response → system automatically assigns next eligible technician
5. Up to 3 attempts (configurable) before marking as "No Technician Available"

Timer enforcement runs via `node-cron` background job every 30 seconds.

## 📄 License

MIT
