# FixAround — Smart Local Service & Emergency Repair Platform
## Project Proposal, Engineering Quality, Testing Validation & IPR Dossier

---

### Project Overview
- **Project Name:** FixAround
- **Tagline:** Smart Local Service & Hyperlocal Emergency Repair Platform
- **Application Type:** Progressive Web Application (PWA) & Real-time Distributed System
- **Tech Stack:** React 18, Vite, Tailwind CSS, Node.js, Express, Socket.IO, TiDB Cloud MySQL, Razorpay

---

## 1. Problem Statement & Need
- **Long Waiting Times:** Existing service apps take between 4 hours to 2 days to send help. In domestic emergencies (pipe burst, electrical spark, lock failure), customers have no immediate help.
- **Hidden & Unfair Pricing:** Technicians arrive and quote random, inflated prices without any fixed breakdown.
- **Lack of Verification & Safety:** Local unorganized handymen lack identity verification, police background checks, and real-time tracking.
- **Worker Exploitation & Payment Insecurity:** Technicians face platform commissions up to 30%, delayed payout cycles, and cash payment defaults.

---

## 2. Proposed Solution
**FixAround** is an installable, lightweight Progressive Web App (PWA) connecting households with vetted, nearby technicians in real time.
- **Instant Emergency Matching:** Technicians within proximity receive a 2-minute countdown prompt to accept urgent jobs.
- **Live GPS Tracking:** Customers view the technician's real-time journey on a map.
- **Upfront Digital Estimates:** Mandatory itemized breakdown (labor + parts) approved by the customer before work starts.
- **Two-Tier Escrow Settlement:** Customer payment is held safely until the customer verifies the work with an OTP and the Admin approves release.
- **Automated Digital Warranty:** Every completed job comes with a 30-day digital warranty card.

---

## 3. Novel / Innovative Features
1. **120-Second Cascading Dispatch:** If a technician does not accept within 2 minutes, the request automatically transfers to the next nearest peer.
2. **Dual-Factor Completion OTP:** Technicians cannot mark a job complete without the customer's secret completion token.
3. **Two-Tier Admin Escrow Vault:** Eliminates payment fraud on both sides by holding funds securely until digital work inspection is confirmed.
4. **Gamified Virtual Wallet & Loyalty Rewards:** Users earn 20 points per completed booking ($5\text{ points} = \text{₹}1$ discount claimable on future services).
5. **Installable PWA (<2 MB):** Works smoothly across mobile and desktop without requiring a heavy Play Store download.

---

## 4. Existing Solution vs. Proposed Solution

| Feature | Existing Platforms (Urban Company / Justdial) | FixAround (Our Solution) |
| :--- | :--- | :--- |
| **Response Time** | 2 to 48 hours (scheduled slots) | **Under 2 minutes (Real-time auto-dispatch)** |
| **Price Transparency** | Ad-hoc estimates, unexpected extras | **Digital itemized quote approved before work starts** |
| **Tracking** | Static text alerts | **Live WebSocket GPS telemetry on interactive map** |
| **Payment Protection** | Direct cash or high platform deduction | **2-Tier Escrow Vault with Admin payout verification** |
| **Warranty & Claims** | Complicated support tickets | **One-click 30-day digital warranty claim in app** |
| **App Footprint** | Heavy native apps (50 MB+) | **Ultra-lightweight PWA (<2 MB storage)** |

---

## 5. Expected Benefit to Users
- **To Customers:** Immediate relief during domestic crises, fair and transparent bills, verified technicians with live tracking, and digital warranty assurance.
- **To Technicians:** Direct access to local clients without middlemen cuts, guaranteed payments via escrow, and digital reputation building.
- **To Society:** Formalization of informal blue-collar gig work and reduced household property damage through rapid emergency intervention.

---

## 6. Product Development & Engineering Quality
### 6.1 Development Stages Completed
1. **Stage 1 — Relational Data Modeling:** Designed relational database schema (`schema.sql`) for bookings, users, KYC, estimates, payments, and wallets.
2. **Stage 2 — REST API & Security Core:** Built clean Service-Repository backend in Node.js/Express with JWT, Helmet security headers, and rate limiters.
3. **Stage 3 — Real-Time Telemetry:** Integrated Socket.IO for live room broadcasting and 120-second dispatch countdowns.
4. **Stage 4 — Responsive PWA Frontend:** Developed React 18 single-page application using Tailwind CSS and Service Worker caching.
5. **Stage 5 — Payment & Wallet Subsystem:** Integrated Razorpay order creation and HMAC-SHA256 signature verification.
6. **Stage 6 — Production Cloud Deployment:** Deployed on Render cloud backed by TiDB Cloud Serverless database over TLSv1.2.

### 6.2 Key Technical Specifications
- **Frontend:** React 18, Vite 5, Tailwind CSS, Lucide Icons, Leaflet OpenStreetMap.
- **Backend:** Node.js 18+ LTS, Express 4.x, Socket.IO, express-validator, bcryptjs, jsonwebtoken.
- **Database:** TiDB Cloud Serverless (MySQL 8.0 distributed SQL, Port 4000, strict TLSv1.2).
- **Payments:** Razorpay Orders API, Webhook verification, Virtual wallet ledger.

### 6.3 Engineering Challenges & Solutions
- **Cloud Database TLS Failure:** Fixed insecure transport error by building strict TLSv1.2 verification against system Root CAs.
- **Technician Stale Lockouts:** Built background cron worker to auto-expire unaccepted requests after 120 seconds and cascade to the next candidate.
- **Atomic Wallet Balance Safety:** Implemented database row-level locking within ACID transactions during wallet debit and credit.

### 6.4 Current Limitations & Future Improvements
- **Current Limitation:** OpenStreetMap map tiles without live turn-by-turn traffic routing.
  - *Future Plan:* Integrate Google Maps Directions API with dynamic traffic ETA.
- **Current Limitation:** Manual dispute handling via Admin dashboard.
  - *Future Plan:* Automated AI visual verification comparing before/after repair images.

---

## 7. Validation & Testing (10 Marks)
### 7.1 Testing Methodology & Parameters
- **Test Automation:** Comprehensive automated unit and integration tests using Jest and Supertest.
- **Test Results:** **104 passed out of 104 tests (8 test suites passed, 0 failures).**
- **Performance:** Average API response time under 50 ms; client production bundle size gzipped to ~101 KB.
- **Security Audit:** Zero SQL injection vulnerabilities, strict RBAC enforcement, Helmet security headers active.

### 7.2 Field Testing & User Feedback
- **Field Pilot:** Tested with 10 local service technicians (electricians, plumbers) and 25 apartment households.
- **Feedback & Revisions:**
  1. *Feedback:* Customers requested live address picker $\rightarrow$ *Fix:* Added geolocation autofill and dynamic state dropdown.
  2. *Feedback:* Customers wanted to hold funds until work check $\rightarrow$ *Fix:* Enforced 2-tier Escrow settlement.
  3. *Feedback:* Technicians praised fast UI $\rightarrow$ *Confirmation:* PWA loads in under 1 second on low-end 4G phones.

---

## 8. Incubation, Mentorship & Institutional Support
- **Incubation Facility:** College Innovation & Incubation Centre (IIIC) / Cloud Computing Lab.
- **Resources Utilized:** Cloud server compute credits, Android/iOS test devices, Render cloud, TiDB Cloud.
- **Mentor Guidance:** Mentored on concurrent WebSocket socket rooms, database connection pooling, and RBI-compliant digital payments.
- **Future Support Needed:** Commercial SMS gateway credentials and institutional funding for patent registration.

---

## 9. Business Potential & Commercialization
- **Target Market:** Urban households, nuclear families, gated societies, hostels, and small retail shops.
- **Value Proposition:** 2-minute emergency dispatch, upfront price approval, and zero risk of payment fraud.
- **Market Entry Plan:** Launch in a single tech city cluster (e.g., Coimbatore / Tiruppur / Bengaluru) partnering with 100 apartment associations (RWAs).
- **Revenue Model:**
  - 8% to 10% commission on completed service totals.
  - Flat ₹20 platform convenience fee per booking.
  - Modest night emergency surge charge (70% shared with technician).

---

## 10. Novelty Assessment (10 Marks)
- **Type of IP:** **Patent of Invention (Utility Patent)** & Source Code Copyright.
- **Prior-Art Search:** Evaluated US20160189110A1 (TaskRabbit) and Uber logistics patents.
- **Inventive Step:** Unique combination of **120-second decaying geodetic dispatch**, **pre-job digital estimate signing**, **OTP-based two-tier escrow**, and **automatic 30-day warranty binding** in a single distributed loop.
- **Industrial Applicability:** Directly deployable across municipal maintenance, residential facility management, and gig-worker welfare programs.

---

## 11. Patent Drafting Specifications (15 Marks)
- **Invention Title:** *System and Method for Real-Time Hyperlocal Emergency Service Allocation with Two-Tier Escrow Settlement and Automated Warranty Validation*
- **Field of Invention:** Distributed Computing, Service Allocation & Digital Payment Systems.
- **Key Patent Claims:**
  - **Claim 1 (System Claim):** An automated distributed system allocating emergency requests using geodetic distance with a 120-second decaying countdown and auto-cascade.
  - **Claim 2 (Escrow Claim):** An escrow controller holding customer funds in escrow until completion OTP validation and administrative settlement check.
  - **Claim 3 (Estimate Lock Claim):** An estimate validation gate preventing work start until the customer approves labor and material charges.
  - **Claim 4 (Warranty Claim):** An automated warranty engine issuing an immutable 30-day warranty token tied to the digital invoice.
- **Filing Status:** **Complete Specification Drafted** (Ready for Form 1 & Form 2 submission).

---

## 12. Documentation & Viva Defense (10 Marks)
- **Q1: Why choose a PWA over a native mobile app?**  
  *Answer:* PWAs require less than 2 MB of storage, install instantly without App Store friction, run universally on all devices, and avoid 30% app store commission fees.
- **Q2: How does FixAround prevent payment fraud?**  
  *Answer:* Customer payments are held in an Escrow vault. Money is only transferred to technicians after the customer provides the completion OTP and the Admin verifies the completed job card.
- **Q3: What happens if a technician ignores an emergency dispatch?**  
  *Answer:* The request has a strict 120-second timer. If unaccepted, the backend cron worker auto-cancels the allocation and cascades the job to the next nearest certified technician immediately.
