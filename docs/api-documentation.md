# FixAround — API Documentation

Base URL: `http://localhost:3000/api/v1`

All responses follow the format:
```json
{
  "success": true|false,
  "data": { ... },
  "message": "Human-readable message",
  "errors": []  // Only on validation errors
}
```

Paginated responses:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

## Authentication

All protected endpoints require the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

---

## Auth Endpoints

### POST /auth/register
Create a new user account.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "9100000000",
  "role": "customer"  // or "technician"
}
```

For technician registration, additional fields:
```json
{
  "bio": "Professional plumber...",
  "experienceYears": 5,
  "skills": [1, 2],  // category IDs
  "serviceCity": "New Delhi",
  "servicePincode": "110001",
  "serviceRadiusKm": 10,
  "latitude": 28.6139,
  "longitude": 77.2090
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "user": { "id": 1, "email": "...", "role": "customer", ... },
    "token": "eyJhbGciOi..."
  },
  "message": "Registration successful"
}
```

### POST /auth/login
**Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Response:** `200 OK` with user object and JWT token.

### GET /auth/me
**Auth:** Required

**Response:** `200 OK` with current user profile.

---

## Service Endpoints

### GET /services
List all active service categories.

**Query:** `?search=plumber&page=1&limit=10`

**Response:** `200 OK` with array of categories including price ranges.

### GET /services/:id
Get service category details.

### POST /services (Admin)
Create a new service category.

**Body:**
```json
{
  "name": "Electrician",
  "slug": "electrician",
  "description": "Electrical repairs...",
  "icon": "Zap",
  "minPrice": 100,
  "maxPrice": 5000,
  "inspectionCharge": 99,
  "warrantyPeriodDays": 7
}
```

### PUT /services/:id (Admin)
Update a service category.

### PATCH /services/:id/status (Admin)
Activate/deactivate a category. Body: `{ "isActive": false }`

---

## Technician Endpoints

### GET /technicians
List verified technicians with pagination and filters.

**Query:** `?category=1&city=New+Delhi&page=1&limit=10&sortBy=rating`

### GET /technicians/nearby
Find nearby technicians using Haversine distance.

**Query:** `?latitude=28.6139&longitude=77.2090&radiusKm=10&categoryId=1`

**Response:** `200 OK` with technicians sorted by distance.

### GET /technicians/:id
Public technician profile with computed stats.

### PATCH /technicians/profile (Technician)
Update own profile.

### PATCH /technicians/availability (Technician)
Toggle availability. Body: `{ "isAvailable": true, "isOnline": true }`

### POST / PATCH /technicians/:id/verify (Admin)
Verify or reject technician. Body: `{ "status": "approved", "notes": "..." }`

---

## Booking Endpoints

### POST /bookings (Customer)
Create a new booking.

**Body:**
```json
{
  "categoryId": 1,
  "title": "Fan not working",
  "description": "Ceiling fan stopped spinning...",
  "isEmergency": false,
  "urgency": "normal",
  "addressId": 1,
  "customerLatitude": 28.6468,
  "customerLongitude": 77.1215,
  "customerAddress": "42 Rajouri Garden, New Delhi",
  "scheduledAt": "2026-10-20T10:00:00Z"
}
```

**Response:** `201 Created` with booking object including `bookingNumber`.

### GET /bookings
List bookings for current user (customer sees own, technician sees assigned).

**Query:** `?status=COMPLETED&page=1&limit=10`

### GET /bookings/:id
Booking details with authorization check.

### POST /bookings/:id/cancel (Customer/Admin)
**Body:** `{ "reason": "Found another technician" }`

### POST /bookings/:id/accept (Technician)
Accept a booking assignment.

### POST /bookings/:id/reject (Technician)
**Body:** `{ "reason": "Too far away" }`

### PATCH /bookings/:id/status (Technician/Admin)
Update booking status. Only valid transitions allowed.

**Body:** `{ "status": "ON_THE_WAY", "notes": "Leaving now" }`

### GET /bookings/:id/timeline
Booking status history timeline.

---

## Estimate Endpoints

### POST /bookings/:id/estimates (Technician)
Submit a price estimate.

**Body:**
```json
{
  "laborCharge": 200.00,
  "materialCharge": 150.00,
  "inspectionCharge": 99.00,
  "additionalCharge": 0.00,
  "breakdownNotes": "Labor: Capacitor replacement\nMaterial: New capacitor"
}
```

### GET /bookings/:id/estimates
List estimates for a booking.

### POST /bookings/:id/estimates/:estimateId/approve (Customer)
Approve an estimate.

### POST /bookings/:id/estimates/:estimateId/reject (Customer)
**Body:** `{ "reason": "Too expensive" }`

---

## Payment Endpoints

### POST /bookings/:id/payments (Customer)
Initiate payment.

**Body:**
```json
{
  "paymentMethod": "ONLINE"  // CASH, ONLINE, UPI, SANDBOX
}
```

**Response:** `201` with payment record. In sandbox mode, includes simulated gateway response.

### POST /payments/:id/verify (Customer)
Verify sandbox payment (development only).

### POST /payments/webhook
Payment gateway webhook (signature verified server-side).

### GET /my-payments (Customer)
Payment history.

---

## Invoice Endpoints

### GET /invoices/:id
View invoice details.

### GET /my-invoices (Customer)
Customer's invoice history.

### GET /bookings/:id/invoice
Invoice for a specific booking.

---

## Review Endpoints

### POST /bookings/:id/reviews (Customer)
Submit a review for a completed booking.

**Body:**
```json
{
  "rating": 5,
  "title": "Excellent work!",
  "comment": "Very professional and quick."
}
```

Constraints:
- Booking must be COMPLETED
- One review per booking per customer
- Rating must be 1-5

### GET /technicians/:id/reviews
Public reviews for a technician.

### GET /my-reviews
Current user's reviews (customer: submitted, technician: received).

---

## Warranty Claim Endpoints

### POST /bookings/:id/claims (Customer)
Create a warranty claim.

**Body:**
```json
{
  "issueDescription": "Same problem recurred within 24 hours",
  "evidenceNotes": "Photo attached showing the issue"
}
```

Constraints:
- Booking must be COMPLETED
- Must be within warranty period

### GET /my-claims (Customer)
Customer's claim history.

### PATCH /claims/:id/respond (Technician)
Technician response to claim.

### PATCH /claims/:id/resolve (Admin)
Resolve a claim.

**Body:**
```json
{
  "status": "APPROVED",
  "resolutionType": "RE_SERVICE",
  "resolutionNotes": "Approved for free re-service within 48 hours"
}
```

---

## Notification Endpoints

### GET /notifications
List user's notifications. Query: `?page=1&limit=20`

### PATCH /notifications/:id/read
Mark a notification as read.

### PATCH /notifications/read-all
Mark all notifications as read.

### GET /notifications/unread-count
Get unread notification count.

---

## Earnings Endpoints (Technician)

### GET /my-earnings
Earnings history with settlement status.

### GET /my-earnings/summary
Earnings summary: total earned, pending, settled.

---

## Admin Endpoints

### GET /admin/dashboard
Platform statistics.

### GET /admin/users
User management with search and filters. Query: `?role=technician&status=active&page=1`

### PATCH /admin/users/:id/status
Activate/suspend user. Body: `{ "isActive": false }`

### GET /admin/bookings
All bookings with admin filters.

### POST /admin/bookings/:id/reassign
Manual technician reassignment. Body: `{ "technicianId": 5 }`

### GET /admin/payments
Payment reports with date filters.

### GET /admin/settings
All platform settings.

### PUT /admin/settings/:key
Update a setting. Body: `{ "value": "300" }`

### GET /admin/audit-logs
Audit log with filters. Query: `?action=VERIFY_TECHNICIAN&page=1`

---

## Error Codes

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient role) |
| 404 | Not Found |
| 409 | Conflict (duplicate resource) |
| 422 | Unprocessable Entity |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |
