-- ============================================================
-- FixAround — Complete Database Schema
-- MySQL 8+
-- ============================================================

CREATE DATABASE IF NOT EXISTS fixaround_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE fixaround_db;

-- ============================================================
-- 1. users — Authentication, role, contact, account status
-- ============================================================
CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role ENUM('customer','technician','admin') NOT NULL DEFAULT 'customer',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  email_verified TINYINT(1) NOT NULL DEFAULT 0,
  avatar_url VARCHAR(500) DEFAULT NULL,
  google_id VARCHAR(100) DEFAULT NULL,
  auth_provider VARCHAR(50) NOT NULL DEFAULT 'local',
  last_login_at DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_google_id (google_id),
  INDEX idx_users_role (role),
  INDEX idx_users_active (is_active)
) ENGINE=InnoDB;

-- ============================================================
-- 2. customer_profiles — Customer-specific data
-- ============================================================
CREATE TABLE customer_profiles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  default_address_id INT UNSIGNED DEFAULT NULL,
  preferred_language VARCHAR(10) DEFAULT 'en',
  notes TEXT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_customer_user (user_id),
  CONSTRAINT fk_cp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 3. technician_profiles — Professional profile, verification
-- ============================================================
CREATE TABLE technician_profiles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  bio TEXT DEFAULT NULL,
  experience_years TINYINT UNSIGNED DEFAULT 0,
  verification_status ENUM('pending','approved','rejected','suspended') NOT NULL DEFAULT 'pending',
  verified_at DATETIME DEFAULT NULL,
  verified_by INT UNSIGNED DEFAULT NULL,
  is_available TINYINT(1) NOT NULL DEFAULT 0,
  is_online TINYINT(1) NOT NULL DEFAULT 0,
  latitude DECIMAL(10,7) DEFAULT NULL,
  longitude DECIMAL(10,7) DEFAULT NULL,
  service_radius_km DECIMAL(5,1) NOT NULL DEFAULT 10.0,
  service_city VARCHAR(100) DEFAULT NULL,
  service_pincode VARCHAR(10) DEFAULT NULL,
  completed_jobs INT UNSIGNED NOT NULL DEFAULT 0,
  avg_rating DECIMAL(2,1) NOT NULL DEFAULT 0.0,
  review_count INT UNSIGNED NOT NULL DEFAULT 0,
  total_earnings DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_tech_user (user_id),
  CONSTRAINT fk_tp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_tp_verifier FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_tp_verification (verification_status),
  INDEX idx_tp_available (is_available, is_online),
  INDEX idx_tp_location (latitude, longitude),
  INDEX idx_tp_city (service_city)
) ENGINE=InnoDB;

-- ============================================================
-- 4. service_categories — Admin-managed categories
-- ============================================================
CREATE TABLE service_categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(120) NOT NULL,
  description TEXT DEFAULT NULL,
  icon VARCHAR(50) DEFAULT 'Wrench',
  image_url VARCHAR(500) DEFAULT NULL,
  min_price DECIMAL(12,2) DEFAULT 0.00,
  max_price DECIMAL(12,2) DEFAULT 0.00,
  inspection_charge DECIMAL(12,2) DEFAULT 0.00,
  warranty_period_days INT UNSIGNED NOT NULL DEFAULT 7,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_sc_slug (slug),
  INDEX idx_sc_active (is_active, sort_order)
) ENGINE=InnoDB;

-- ============================================================
-- 5. technician_skills — M:N technician ↔ category
-- ============================================================
CREATE TABLE technician_skills (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  technician_id INT UNSIGNED NOT NULL,
  category_id INT UNSIGNED NOT NULL,
  years_experience TINYINT UNSIGNED DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_ts_tech_cat (technician_id, category_id),
  CONSTRAINT fk_ts_tech FOREIGN KEY (technician_id) REFERENCES technician_profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_ts_cat FOREIGN KEY (category_id) REFERENCES service_categories(id) ON DELETE CASCADE,
  INDEX idx_ts_category (category_id)
) ENGINE=InnoDB;

-- ============================================================
-- 6. addresses — Customer service addresses
-- ============================================================
CREATE TABLE addresses (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  label VARCHAR(50) DEFAULT 'Home',
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255) DEFAULT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  pincode VARCHAR(10) NOT NULL,
  latitude DECIMAL(10,7) DEFAULT NULL,
  longitude DECIMAL(10,7) DEFAULT NULL,
  is_default TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_addr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_addr_user (user_id),
  INDEX idx_addr_location (latitude, longitude)
) ENGINE=InnoDB;

-- ============================================================
-- 7. technician_service_areas — Coverage zones
-- ============================================================
CREATE TABLE technician_service_areas (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  technician_id INT UNSIGNED NOT NULL,
  area_name VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  pincode VARCHAR(10) DEFAULT NULL,
  latitude DECIMAL(10,7) DEFAULT NULL,
  longitude DECIMAL(10,7) DEFAULT NULL,
  radius_km DECIMAL(5,1) DEFAULT 10.0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tsa_tech FOREIGN KEY (technician_id) REFERENCES technician_profiles(id) ON DELETE CASCADE,
  INDEX idx_tsa_tech (technician_id),
  INDEX idx_tsa_city (city)
) ENGINE=InnoDB;

-- ============================================================
-- 8. bookings — Core booking record
-- ============================================================
CREATE TABLE bookings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_number VARCHAR(20) NOT NULL,
  customer_id INT UNSIGNED NOT NULL,
  category_id INT UNSIGNED NOT NULL,
  technician_id INT UNSIGNED DEFAULT NULL,
  address_id INT UNSIGNED DEFAULT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  is_emergency TINYINT(1) NOT NULL DEFAULT 0,
  status ENUM(
    'REQUESTED','ASSIGNED','ACCEPTED','ON_THE_WAY','ARRIVED',
    'IN_PROGRESS','AWAITING_APPROVAL','COMPLETED',
    'CANCELLED','REJECTED','NO_TECHNICIAN_AVAILABLE','EXPIRED','DISPUTED'
  ) NOT NULL DEFAULT 'REQUESTED',
  urgency ENUM('normal','urgent','emergency') NOT NULL DEFAULT 'normal',
  customer_latitude DECIMAL(10,7) DEFAULT NULL,
  customer_longitude DECIMAL(10,7) DEFAULT NULL,
  customer_address TEXT DEFAULT NULL,
  scheduled_at DATETIME DEFAULT NULL,
  accepted_at DATETIME DEFAULT NULL,
  started_at DATETIME DEFAULT NULL,
  completed_at DATETIME DEFAULT NULL,
  cancelled_at DATETIME DEFAULT NULL,
  cancellation_reason TEXT DEFAULT NULL,
  cancelled_by ENUM('customer','technician','admin','system') DEFAULT NULL,
  estimated_total DECIMAL(12,2) DEFAULT NULL,
  final_total DECIMAL(12,2) DEFAULT NULL,
  commission_amount DECIMAL(12,2) DEFAULT NULL,
  technician_payout DECIMAL(12,2) DEFAULT NULL,
  assignment_attempts INT UNSIGNED NOT NULL DEFAULT 0,
  notes TEXT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_booking_number (booking_number),
  CONSTRAINT fk_bk_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_bk_category FOREIGN KEY (category_id) REFERENCES service_categories(id) ON DELETE RESTRICT,
  CONSTRAINT fk_bk_technician FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_bk_address FOREIGN KEY (address_id) REFERENCES addresses(id) ON DELETE SET NULL,
  INDEX idx_bk_customer (customer_id, status),
  INDEX idx_bk_technician (technician_id, status),
  INDEX idx_bk_category (category_id),
  INDEX idx_bk_status (status),
  INDEX idx_bk_emergency (is_emergency, status),
  INDEX idx_bk_created (created_at)
) ENGINE=InnoDB;

-- ============================================================
-- 9. booking_assignments — Technician offer tracking
-- ============================================================
CREATE TABLE booking_assignments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id INT UNSIGNED NOT NULL,
  technician_id INT UNSIGNED NOT NULL,
  attempt_number INT UNSIGNED NOT NULL DEFAULT 1,
  status ENUM('PENDING','ACCEPTED','REJECTED','EXPIRED') NOT NULL DEFAULT 'PENDING',
  assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deadline DATETIME NOT NULL,
  responded_at DATETIME DEFAULT NULL,
  rejection_reason TEXT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ba_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  CONSTRAINT fk_ba_tech FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_ba_booking (booking_id, status),
  INDEX idx_ba_tech (technician_id, status),
  INDEX idx_ba_deadline (status, deadline),
  INDEX idx_ba_pending_deadline (status, deadline)
) ENGINE=InnoDB;

-- ============================================================
-- 10. booking_status_history — Immutable audit trail
-- ============================================================
CREATE TABLE booking_status_history (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id INT UNSIGNED NOT NULL,
  from_status VARCHAR(30) DEFAULT NULL,
  to_status VARCHAR(30) NOT NULL,
  changed_by INT UNSIGNED DEFAULT NULL,
  actor_role VARCHAR(20) DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_bsh_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  CONSTRAINT fk_bsh_actor FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_bsh_booking (booking_id, created_at)
) ENGINE=InnoDB;

-- ============================================================
-- 11. price_estimates — Technician quotes & customer approval
-- ============================================================
CREATE TABLE price_estimates (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id INT UNSIGNED NOT NULL,
  technician_id INT UNSIGNED NOT NULL,
  revision_number INT UNSIGNED NOT NULL DEFAULT 1,
  labor_charge DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  material_charge DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  inspection_charge DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  additional_charge DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total_estimate DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  breakdown_notes TEXT DEFAULT NULL,
  status ENUM('SUBMITTED','APPROVED','REJECTED','REVISED','SUPERSEDED') NOT NULL DEFAULT 'SUBMITTED',
  approved_at DATETIME DEFAULT NULL,
  approved_by INT UNSIGNED DEFAULT NULL,
  rejected_at DATETIME DEFAULT NULL,
  rejection_reason TEXT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pe_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  CONSTRAINT fk_pe_tech FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_pe_approver FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_pe_booking (booking_id, status),
  INDEX idx_pe_tech (technician_id)
) ENGINE=InnoDB;

-- ============================================================
-- 12. payments — Payment attempts and status
-- ============================================================
CREATE TABLE payments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  payment_number VARCHAR(30) NOT NULL,
  booking_id INT UNSIGNED NOT NULL,
  customer_id INT UNSIGNED NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL DEFAULT 'ONLINE',
  status ENUM('PENDING','INITIATED','SUCCESS','FAILED','REFUND_PENDING','PARTIALLY_REFUNDED','REFUNDED') NOT NULL DEFAULT 'PENDING',
  gateway_order_id VARCHAR(255) DEFAULT NULL,
  gateway_payment_id VARCHAR(255) DEFAULT NULL,
  gateway_signature VARCHAR(500) DEFAULT NULL,
  gateway_response JSON DEFAULT NULL,
  is_sandbox TINYINT(1) NOT NULL DEFAULT 0,
  paid_at DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_payment_number (payment_number),
  CONSTRAINT fk_pay_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE RESTRICT,
  CONSTRAINT fk_pay_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_pay_booking (booking_id),
  INDEX idx_pay_customer (customer_id, status),
  INDEX idx_pay_status (status)
) ENGINE=InnoDB;

-- ============================================================
-- 13. refunds — Refund requests
-- ============================================================
CREATE TABLE refunds (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  refund_number VARCHAR(30) NOT NULL,
  payment_id INT UNSIGNED NOT NULL,
  booking_id INT UNSIGNED NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  reason TEXT DEFAULT NULL,
  status ENUM('REQUESTED','APPROVED','PROCESSING','COMPLETED','REJECTED') NOT NULL DEFAULT 'REQUESTED',
  approved_by INT UNSIGNED DEFAULT NULL,
  gateway_refund_id VARCHAR(255) DEFAULT NULL,
  processed_at DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_refund_number (refund_number),
  CONSTRAINT fk_ref_payment FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE RESTRICT,
  CONSTRAINT fk_ref_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE RESTRICT,
  CONSTRAINT fk_ref_approver FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_ref_payment (payment_id),
  INDEX idx_ref_status (status)
) ENGINE=InnoDB;

-- ============================================================
-- 14. invoices — Generated invoices
-- ============================================================
CREATE TABLE invoices (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  invoice_number VARCHAR(30) NOT NULL,
  booking_id INT UNSIGNED NOT NULL,
  customer_id INT UNSIGNED NOT NULL,
  technician_id INT UNSIGNED DEFAULT NULL,
  payment_id INT UNSIGNED DEFAULT NULL,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  line_items JSON DEFAULT NULL,
  status ENUM('DRAFT','ISSUED','PAID','CANCELLED') NOT NULL DEFAULT 'DRAFT',
  issued_at DATETIME DEFAULT NULL,
  due_date DATE DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_invoice_number (invoice_number),
  CONSTRAINT fk_inv_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE RESTRICT,
  CONSTRAINT fk_inv_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_inv_tech FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_inv_payment FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL,
  INDEX idx_inv_booking (booking_id),
  INDEX idx_inv_customer (customer_id)
) ENGINE=InnoDB;

-- ============================================================
-- 15. reviews — Customer ratings and feedback
-- ============================================================
CREATE TABLE reviews (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id INT UNSIGNED NOT NULL,
  customer_id INT UNSIGNED NOT NULL,
  technician_id INT UNSIGNED NOT NULL,
  rating TINYINT UNSIGNED NOT NULL,
  title VARCHAR(200) DEFAULT NULL,
  comment TEXT DEFAULT NULL,
  is_visible TINYINT(1) NOT NULL DEFAULT 1,
  admin_notes TEXT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_review_booking_customer (booking_id, customer_id),
  CONSTRAINT fk_rev_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE RESTRICT,
  CONSTRAINT fk_rev_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_rev_tech FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT chk_rating CHECK (rating >= 1 AND rating <= 5),
  INDEX idx_rev_tech (technician_id, rating),
  INDEX idx_rev_customer (customer_id)
) ENGINE=InnoDB;

-- ============================================================
-- 16. warranty_claims — Repair failure reports
-- ============================================================
CREATE TABLE warranty_claims (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  claim_number VARCHAR(30) NOT NULL,
  booking_id INT UNSIGNED NOT NULL,
  customer_id INT UNSIGNED NOT NULL,
  technician_id INT UNSIGNED NOT NULL,
  issue_description TEXT NOT NULL,
  evidence_notes TEXT DEFAULT NULL,
  status ENUM('OPEN','UNDER_REVIEW','APPROVED','REJECTED','RESOLVED') NOT NULL DEFAULT 'OPEN',
  resolution_type ENUM('RE_SERVICE','PARTIAL_REFUND','FULL_REFUND','REJECTED','OTHER') DEFAULT NULL,
  resolution_notes TEXT DEFAULT NULL,
  resolved_by INT UNSIGNED DEFAULT NULL,
  resolved_at DATETIME DEFAULT NULL,
  warranty_expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_claim_number (claim_number),
  CONSTRAINT fk_wc_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE RESTRICT,
  CONSTRAINT fk_wc_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_wc_tech FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_wc_resolver FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_wc_booking (booking_id),
  INDEX idx_wc_status (status),
  INDEX idx_wc_customer (customer_id)
) ENGINE=InnoDB;

-- ============================================================
-- 17. notifications — User notification records
-- ============================================================
CREATE TABLE notifications (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  data JSON DEFAULT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  read_at DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notif_user (user_id, is_read, created_at),
  INDEX idx_notif_type (type)
) ENGINE=InnoDB;

-- ============================================================
-- 18. technician_documents — Verification doc metadata
-- ============================================================
CREATE TABLE technician_documents (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  technician_id INT UNSIGNED NOT NULL,
  document_type ENUM('ID_PROOF','ADDRESS_PROOF','CERTIFICATION','PHOTO','OTHER') NOT NULL,
  document_name VARCHAR(200) NOT NULL,
  file_path VARCHAR(500) DEFAULT NULL,
  file_url VARCHAR(500) DEFAULT NULL,
  status ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  reviewed_by INT UNSIGNED DEFAULT NULL,
  reviewed_at DATETIME DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_td_tech FOREIGN KEY (technician_id) REFERENCES technician_profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_td_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_td_tech (technician_id, status)
) ENGINE=InnoDB;

-- ============================================================
-- 19. platform_settings — Key-value configuration
-- ============================================================
CREATE TABLE platform_settings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL,
  setting_value TEXT NOT NULL,
  description VARCHAR(500) DEFAULT NULL,
  data_type ENUM('string','number','boolean','json') NOT NULL DEFAULT 'string',
  updated_by INT UNSIGNED DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_setting_key (setting_key),
  CONSTRAINT fk_ps_updater FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- 20. audit_logs — Admin and system action log
-- ============================================================
CREATE TABLE audit_logs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  actor_id INT UNSIGNED DEFAULT NULL,
  actor_role VARCHAR(20) DEFAULT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) DEFAULT NULL,
  entity_id INT UNSIGNED DEFAULT NULL,
  details JSON DEFAULT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  user_agent VARCHAR(500) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_al_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_al_actor (actor_id),
  INDEX idx_al_action (action),
  INDEX idx_al_entity (entity_type, entity_id),
  INDEX idx_al_created (created_at)
) ENGINE=InnoDB;

-- ============================================================
-- 21. service_attachments — Booking photos and evidence
-- ============================================================
CREATE TABLE service_attachments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id INT UNSIGNED NOT NULL,
  uploaded_by INT UNSIGNED NOT NULL,
  attachment_type ENUM('BEFORE_PHOTO','AFTER_PHOTO','EVIDENCE','RECEIPT','OTHER') NOT NULL DEFAULT 'OTHER',
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_url VARCHAR(500) DEFAULT NULL,
  file_size INT UNSIGNED DEFAULT NULL,
  mime_type VARCHAR(100) DEFAULT NULL,
  description VARCHAR(500) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sa_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  CONSTRAINT fk_sa_uploader FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_sa_booking (booking_id)
) ENGINE=InnoDB;

-- ============================================================
-- 22. technician_earnings — Settlement ledger
-- ============================================================
CREATE TABLE technician_earnings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  technician_id INT UNSIGNED NOT NULL,
  booking_id INT UNSIGNED NOT NULL,
  payment_id INT UNSIGNED DEFAULT NULL,
  gross_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  commission_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  net_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  settlement_status ENUM('PENDING','SETTLED','ON_HOLD') NOT NULL DEFAULT 'PENDING',
  settled_at DATETIME DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_te_booking (booking_id),
  CONSTRAINT fk_te_tech FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_te_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE RESTRICT,
  CONSTRAINT fk_te_payment FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL,
  INDEX idx_te_tech (technician_id, settlement_status),
  INDEX idx_te_status (settlement_status)
) ENGINE=InnoDB;

-- Add FK for customer_profiles.default_address_id
ALTER TABLE customer_profiles
  ADD CONSTRAINT fk_cp_default_addr FOREIGN KEY (default_address_id) REFERENCES addresses(id) ON DELETE SET NULL;
