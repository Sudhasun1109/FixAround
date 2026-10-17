-- ============================================================
-- FixAround — Seed Data for Development
-- Run AFTER schema.sql
-- ============================================================
-- Passwords are all 'Password123!' hashed with bcrypt (10 rounds)
-- Hash: $2a$10$8K1p/a0dR1xqM8k7HQwHmeEz0cLMbKPBKFM2KVrmC5JL3OX2DPmiy

USE fixaround_db;

-- ============================================================
-- Users
-- ============================================================
INSERT INTO users (id, email, phone, password_hash, first_name, last_name, role, is_active, email_verified) VALUES
-- Admin
(1, 'admin@fixaround.com', '9000000001', '$2a$10$ICeWvZbSUyPLNMFVDRcwIOtiaEhaL/8hCmQAuGeh4L3LVzfY5jOsi', 'Arjun', 'Kapoor', 'admin', 1, 1),
-- Customers
(2, 'priya.sharma@example.com', '9100000001', '$2a$10$ICeWvZbSUyPLNMFVDRcwIOtiaEhaL/8hCmQAuGeh4L3LVzfY5jOsi', 'Priya', 'Sharma', 'customer', 1, 1),
(3, 'rahul.verma@example.com', '9100000002', '$2a$10$ICeWvZbSUyPLNMFVDRcwIOtiaEhaL/8hCmQAuGeh4L3LVzfY5jOsi', 'Rahul', 'Verma', 'customer', 1, 1),
(4, 'anita.desai@example.com', '9100000003', '$2a$10$ICeWvZbSUyPLNMFVDRcwIOtiaEhaL/8hCmQAuGeh4L3LVzfY5jOsi', 'Anita', 'Desai', 'customer', 1, 1),
-- Technicians
(5, 'suresh.electrician@example.com', '9200000001', '$2a$10$ICeWvZbSUyPLNMFVDRcwIOtiaEhaL/8hCmQAuGeh4L3LVzfY5jOsi', 'Suresh', 'Kumar', 'technician', 1, 1),
(6, 'ravi.plumber@example.com', '9200000002', '$2a$10$ICeWvZbSUyPLNMFVDRcwIOtiaEhaL/8hCmQAuGeh4L3LVzfY5jOsi', 'Ravi', 'Patel', 'technician', 1, 1),
(7, 'mohan.ac@example.com', '9200000003', '$2a$10$ICeWvZbSUyPLNMFVDRcwIOtiaEhaL/8hCmQAuGeh4L3LVzfY5jOsi', 'Mohan', 'Singh', 'technician', 1, 1),
(8, 'deepak.mechanic@example.com', '9200000004', '$2a$10$ICeWvZbSUyPLNMFVDRcwIOtiaEhaL/8hCmQAuGeh4L3LVzfY5jOsi', 'Deepak', 'Yadav', 'technician', 1, 1),
(9, 'amit.carpenter@example.com', '9200000005', '$2a$10$ICeWvZbSUyPLNMFVDRcwIOtiaEhaL/8hCmQAuGeh4L3LVzfY5jOsi', 'Amit', 'Joshi', 'technician', 1, 1);

-- ============================================================
-- Customer Profiles
-- ============================================================
INSERT INTO customer_profiles (user_id, preferred_language) VALUES
(2, 'en'),
(3, 'en'),
(4, 'hi');

-- ============================================================
-- Technician Profiles
-- ============================================================
INSERT INTO technician_profiles (user_id, bio, experience_years, verification_status, is_available, is_online, latitude, longitude, service_radius_km, service_city, service_pincode, completed_jobs, avg_rating, review_count) VALUES
(5, 'Experienced electrician specializing in residential wiring, fan installations, and switchboard repairs. Available for emergencies 24/7.', 8, 'approved', 1, 1, 28.6139, 77.2090, 15.0, 'New Delhi', '110001', 156, 4.6, 89),
(6, 'Professional plumber with expertise in pipe fitting, leakage repair, and bathroom installations. Quick response guaranteed.', 6, 'approved', 1, 1, 28.6280, 77.2195, 12.0, 'New Delhi', '110002', 98, 4.4, 52),
(7, 'AC repair specialist. Certified in all major brands including LG, Samsung, Daikin, and Voltas. Gas refilling and compressor repair.', 10, 'approved', 1, 0, 28.5921, 77.2290, 10.0, 'New Delhi', '110003', 210, 4.8, 134),
(8, 'Bike and scooter mechanic. Expert in Honda, Hero, Bajaj, TVS. Roadside assistance available for emergencies.', 5, 'approved', 1, 1, 28.6353, 77.2250, 20.0, 'New Delhi', '110004', 74, 4.3, 38),
(9, 'Skilled carpenter for furniture repair, door fitting, and custom woodwork. Also handles painting and wall work.', 12, 'pending', 0, 0, 28.6100, 77.2300, 8.0, 'New Delhi', '110005', 0, 0.0, 0);

-- ============================================================
-- Service Categories
-- ============================================================
INSERT INTO service_categories (id, name, slug, description, icon, min_price, max_price, inspection_charge, warranty_period_days, is_active, sort_order) VALUES
(1,  'Electrician',              'electrician',              'Electrical repairs, wiring, fan installation, switchboard work, inverter setup', 'Zap', 100.00, 5000.00, 99.00, 7, 1, 1),
(2,  'Plumber',                  'plumber',                  'Pipe fitting, leakage repair, tap installation, bathroom fixtures, drainage', 'Droplets', 150.00, 4000.00, 99.00, 7, 1, 2),
(3,  'AC Repair',                'ac-repair',                'AC servicing, gas refilling, compressor repair, installation, annual maintenance', 'Snowflake', 300.00, 8000.00, 149.00, 15, 1, 3),
(4,  'Appliance Repair',         'appliance-repair',         'Washing machine, refrigerator, microwave, geyser, and other home appliance repairs', 'Settings', 200.00, 6000.00, 149.00, 10, 1, 4),
(5,  'Bike & Scooter Mechanic',  'bike-scooter-mechanic',    'Two-wheeler repair, servicing, puncture, brake, engine, and roadside assistance', 'Bike', 100.00, 5000.00, 0.00, 3, 1, 5),
(6,  'Car Mechanic',             'car-mechanic',             'Car servicing, engine repair, oil change, battery, brake, and towing assistance', 'Car', 300.00, 15000.00, 199.00, 7, 1, 6),
(7,  'Carpenter',                'carpenter',                'Furniture repair, door fitting, cabinet work, custom woodwork, polishing', 'Hammer', 200.00, 8000.00, 99.00, 7, 1, 7),
(8,  'House Cleaning',           'house-cleaning',           'Deep cleaning, bathroom cleaning, kitchen cleaning, sofa cleaning, pest control', 'SprayCan', 500.00, 5000.00, 0.00, 1, 1, 8),
(9,  'Painting',                 'painting',                 'Interior painting, exterior painting, texture painting, waterproofing', 'Paintbrush', 1000.00, 25000.00, 199.00, 15, 1, 9),
(10, 'Locksmith',                'locksmith',                'Lock repair, key duplication, digital lock installation, safe opening', 'KeyRound', 150.00, 3000.00, 0.00, 3, 1, 10),
(11, 'Computer & Laptop Repair', 'computer-laptop-repair',   'Hardware repair, software installation, virus removal, data recovery, networking', 'Monitor', 200.00, 5000.00, 149.00, 7, 1, 11),
(12, 'Other Local Services',     'other-local-services',     'General handyman, moving help, installation services, and other local tasks', 'Wrench', 100.00, 10000.00, 0.00, 3, 1, 12);

-- ============================================================
-- Technician Skills
-- ============================================================
INSERT INTO technician_skills (technician_id, category_id, years_experience) VALUES
-- Suresh (electrician) - tech profile id 1
(1, 1, 8),   -- Electrician
(1, 4, 3),   -- Appliance Repair
-- Ravi (plumber) - tech profile id 2
(2, 2, 6),   -- Plumber
-- Mohan (AC) - tech profile id 3
(3, 3, 10),  -- AC Repair
(3, 4, 5),   -- Appliance Repair
-- Deepak (mechanic) - tech profile id 4
(4, 5, 5),   -- Bike & Scooter
(4, 6, 3),   -- Car Mechanic
-- Amit (carpenter) - tech profile id 5
(5, 7, 12),  -- Carpenter
(5, 9, 4);   -- Painting

-- ============================================================
-- Addresses
-- ============================================================
INSERT INTO addresses (id, user_id, label, address_line1, address_line2, city, state, pincode, latitude, longitude, is_default) VALUES
(1, 2, 'Home', '42 Rajouri Garden', 'Near Metro Station', 'New Delhi', 'Delhi', '110027', 28.6468, 77.1215, 1),
(2, 2, 'Office', '15 Connaught Place', 'Block B, 3rd Floor', 'New Delhi', 'Delhi', '110001', 28.6315, 77.2167, 0),
(3, 3, 'Home', '78 Lajpat Nagar', 'Main Market Road', 'New Delhi', 'Delhi', '110024', 28.5700, 77.2400, 1),
(4, 4, 'Home', '23 Dwarka Sector 10', 'Near Community Centre', 'New Delhi', 'Delhi', '110075', 28.5823, 77.0500, 1);

-- Update customer profiles with default address
UPDATE customer_profiles SET default_address_id = 1 WHERE user_id = 2;
UPDATE customer_profiles SET default_address_id = 3 WHERE user_id = 3;
UPDATE customer_profiles SET default_address_id = 4 WHERE user_id = 4;

-- ============================================================
-- Technician Service Areas
-- ============================================================
INSERT INTO technician_service_areas (technician_id, area_name, city, pincode, latitude, longitude, radius_km) VALUES
(1, 'Central Delhi',  'New Delhi', '110001', 28.6139, 77.2090, 15.0),
(2, 'North Delhi',    'New Delhi', '110002', 28.6280, 77.2195, 12.0),
(3, 'South Delhi',    'New Delhi', '110003', 28.5921, 77.2290, 10.0),
(4, 'East Delhi',     'New Delhi', '110004', 28.6353, 77.2250, 20.0),
(5, 'West Delhi',     'New Delhi', '110005', 28.6100, 77.2300, 8.0);

-- ============================================================
-- Platform Settings
-- ============================================================
INSERT INTO platform_settings (setting_key, setting_value, description, data_type) VALUES
('technician_response_timeout_seconds', '300', 'Time in seconds before a technician assignment expires', 'number'),
('max_assignment_attempts', '3', 'Maximum number of technicians to try before marking booking as no-technician-available', 'number'),
('platform_commission_percent', '15', 'Platform commission percentage on completed bookings', 'number'),
('default_search_radius_km', '10', 'Default radius in kilometers for nearby technician search', 'number'),
('default_warranty_period_days', '7', 'Default warranty period in days after service completion', 'number'),
('min_cancellation_notice_minutes', '30', 'Minimum notice in minutes for free cancellation', 'number'),
('enable_cash_payment', 'true', 'Whether cash payment method is enabled', 'boolean'),
('enable_emergency_services', 'true', 'Whether emergency service mode is enabled', 'boolean'),
('sandbox_payment_mode', 'true', 'Whether payment gateway runs in sandbox/test mode', 'boolean'),
('max_review_days_after_completion', '30', 'Maximum days after completion to submit a review', 'number'),
('gst_rate_percent', '18', 'GST rate percentage for invoices', 'number'),
('support_email', 'support@fixaround.com', 'Customer support email address', 'string'),
('support_phone', '1800-FIXAROUND', 'Customer support phone number', 'string');

-- ============================================================
-- Sample Bookings
-- ============================================================
INSERT INTO bookings (id, booking_number, customer_id, category_id, technician_id, address_id, title, description, is_emergency, status, urgency, customer_latitude, customer_longitude, customer_address, estimated_total, final_total, commission_amount, technician_payout, assignment_attempts, accepted_at, started_at, completed_at) VALUES
(1, 'BK-20261001-001', 2, 1, 5, 1, 'Fan not working', 'Ceiling fan in bedroom stopped spinning. Makes humming noise but blades don''t move.', 0, 'COMPLETED', 'normal', 28.6468, 77.1215, '42 Rajouri Garden, Near Metro Station, New Delhi', 450.00, 450.00, 67.50, 382.50, 1, '2026-10-01 10:30:00', '2026-10-01 11:00:00', '2026-10-01 12:30:00'),
(2, 'BK-20261005-001', 3, 2, 6, 3, 'Kitchen sink leaking', 'Water leaking from under the kitchen sink. Floor is getting wet.', 0, 'COMPLETED', 'urgent', 28.5700, 77.2400, '78 Lajpat Nagar, Main Market Road, New Delhi', 350.00, 350.00, 52.50, 297.50, 1, '2026-10-05 09:15:00', '2026-10-05 10:00:00', '2026-10-05 11:30:00'),
(3, 'BK-20261010-001', 2, 3, 7, 1, 'AC not cooling', 'Split AC in living room is running but not cooling properly. Might need gas refilling.', 0, 'IN_PROGRESS', 'normal', 28.6468, 77.1215, '42 Rajouri Garden, Near Metro Station, New Delhi', 1500.00, NULL, NULL, NULL, 1, '2026-10-10 14:00:00', '2026-10-10 15:00:00', NULL),
(4, 'BK-20261015-001', 4, 5, NULL, 4, 'Bike breakdown', 'Bike won''t start. Stuck on road near Dwarka Sector 10 metro.', 1, 'REQUESTED', 'emergency', 28.5823, 77.0500, '23 Dwarka Sector 10, Near Community Centre, New Delhi', NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL);

-- ============================================================
-- Booking Status History
-- ============================================================
INSERT INTO booking_status_history (booking_id, from_status, to_status, changed_by, actor_role, notes) VALUES
-- Booking 1 lifecycle
(1, NULL, 'REQUESTED', 2, 'customer', 'Booking created'),
(1, 'REQUESTED', 'ASSIGNED', NULL, 'system', 'Assigned to Suresh Kumar'),
(1, 'ASSIGNED', 'ACCEPTED', 5, 'technician', 'Technician accepted the job'),
(1, 'ACCEPTED', 'ON_THE_WAY', 5, 'technician', 'Technician is on the way'),
(1, 'ON_THE_WAY', 'ARRIVED', 5, 'technician', 'Technician has arrived'),
(1, 'ARRIVED', 'IN_PROGRESS', 5, 'technician', 'Service started'),
(1, 'IN_PROGRESS', 'COMPLETED', 5, 'technician', 'Fan capacitor replaced. Working fine now.'),
-- Booking 2 lifecycle
(2, NULL, 'REQUESTED', 3, 'customer', 'Booking created'),
(2, 'REQUESTED', 'ASSIGNED', NULL, 'system', 'Assigned to Ravi Patel'),
(2, 'ASSIGNED', 'ACCEPTED', 6, 'technician', 'Technician accepted the job'),
(2, 'ACCEPTED', 'ARRIVED', 6, 'technician', 'Technician arrived'),
(2, 'ARRIVED', 'IN_PROGRESS', 6, 'technician', 'Fixing the pipe joint'),
(2, 'IN_PROGRESS', 'COMPLETED', 6, 'technician', 'Pipe joint replaced and sealed. No more leaks.'),
-- Booking 3 lifecycle
(3, NULL, 'REQUESTED', 2, 'customer', 'Booking created'),
(3, 'REQUESTED', 'ASSIGNED', NULL, 'system', 'Assigned to Mohan Singh'),
(3, 'ASSIGNED', 'ACCEPTED', 7, 'technician', 'Technician accepted'),
(3, 'ACCEPTED', 'IN_PROGRESS', 7, 'technician', 'Checking AC unit'),
-- Booking 4
(4, NULL, 'REQUESTED', 4, 'customer', 'Emergency booking created');

-- ============================================================
-- Booking Assignments
-- ============================================================
INSERT INTO booking_assignments (booking_id, technician_id, attempt_number, status, deadline, responded_at) VALUES
(1, 5, 1, 'ACCEPTED', '2026-10-01 10:35:00', '2026-10-01 10:28:00'),
(2, 6, 1, 'ACCEPTED', '2026-10-05 09:20:00', '2026-10-05 09:12:00'),
(3, 7, 1, 'ACCEPTED', '2026-10-10 14:05:00', '2026-10-10 14:02:00');

-- ============================================================
-- Price Estimates
-- ============================================================
INSERT INTO price_estimates (booking_id, technician_id, revision_number, labor_charge, material_charge, inspection_charge, additional_charge, total_estimate, breakdown_notes, status, approved_at, approved_by) VALUES
(1, 5, 1, 200.00, 150.00, 99.00, 0.00, 449.00, 'Labor: Ceiling fan repair (capacitor replacement)\nMaterial: New capacitor (2.5 MFD)\nInspection: Standard visit charge', 'APPROVED', '2026-10-01 11:15:00', 2),
(2, 6, 1, 200.00, 100.00, 50.00, 0.00, 350.00, 'Labor: Pipe joint replacement\nMaterial: New PVC joint and sealant\nInspection: Emergency plumbing check', 'APPROVED', '2026-10-05 10:15:00', 3),
(3, 7, 1, 500.00, 800.00, 149.00, 50.00, 1499.00, 'Labor: AC gas refilling and cleaning\nMaterial: R32 refrigerant gas\nInspection: Full AC diagnostic\nAdditional: Filter deep cleaning', 'SUBMITTED', NULL, NULL);

-- ============================================================
-- Payments
-- ============================================================
INSERT INTO payments (payment_number, booking_id, customer_id, amount, payment_method, status, is_sandbox, paid_at) VALUES
('PAY-20261001-001', 1, 2, 450.00, 'ONLINE', 'SUCCESS', 1, '2026-10-01 13:00:00'),
('PAY-20261005-001', 2, 3, 350.00, 'CASH', 'SUCCESS', 0, '2026-10-05 12:00:00');

-- ============================================================
-- Invoices
-- ============================================================
INSERT INTO invoices (invoice_number, booking_id, customer_id, technician_id, payment_id, subtotal, tax_amount, tax_rate, discount_amount, total_amount, line_items, status, issued_at) VALUES
('INV-20261001-001', 1, 2, 5, 1, 381.36, 68.64, 18.00, 0.00, 450.00,
 '[{"description":"Ceiling fan repair - capacitor replacement","amount":200.00},{"description":"Material - New capacitor 2.5 MFD","amount":150.00},{"description":"Inspection charge","amount":99.00}]',
 'PAID', '2026-10-01 13:00:00'),
('INV-20261005-001', 2, 3, 6, 2, 296.61, 53.39, 18.00, 0.00, 350.00,
 '[{"description":"Pipe joint replacement","amount":200.00},{"description":"Material - PVC joint and sealant","amount":100.00},{"description":"Inspection charge","amount":50.00}]',
 'PAID', '2026-10-05 12:00:00');

-- ============================================================
-- Technician Earnings
-- ============================================================
INSERT INTO technician_earnings (technician_id, booking_id, payment_id, gross_amount, commission_rate, commission_amount, net_amount, settlement_status) VALUES
(5, 1, 1, 450.00, 15.00, 67.50, 382.50, 'SETTLED'),
(6, 2, 2, 350.00, 15.00, 52.50, 297.50, 'SETTLED');

-- ============================================================
-- Reviews
-- ============================================================
INSERT INTO reviews (booking_id, customer_id, technician_id, rating, title, comment) VALUES
(1, 2, 5, 5, 'Excellent work!', 'Suresh was very professional and quick. Fixed the fan in under an hour. Very reasonable pricing too. Highly recommend!'),
(2, 3, 6, 4, 'Good service', 'Ravi fixed the leak properly. Came on time. Could have been a bit more thorough with cleaning up after the work.');

-- ============================================================
-- Notifications
-- ============================================================
INSERT INTO notifications (user_id, type, title, message, data, is_read) VALUES
(2, 'BOOKING_COMPLETED', 'Service Completed', 'Your ceiling fan repair has been completed by Suresh Kumar.', '{"booking_id": 1}', 1),
(2, 'PAYMENT_SUCCESS', 'Payment Successful', 'Payment of ₹450.00 for booking BK-20261001-001 was successful.', '{"booking_id": 1, "payment_id": 1}', 1),
(5, 'NEW_BOOKING', 'New Booking Request', 'You have a new booking request for AC Repair from Priya Sharma.', '{"booking_id": 3}', 1),
(4, 'BOOKING_CREATED', 'Emergency Request Created', 'Your emergency bike repair request has been created. Finding a technician...', '{"booking_id": 4}', 0),
(2, 'REVIEW_REMINDER', 'Rate Your Service', 'Please rate your recent AC repair service.', '{"booking_id": 3}', 0);
