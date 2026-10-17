# FixAround — Entity Relationship Diagram

```mermaid
erDiagram
    users {
        INT id PK
        VARCHAR email UK
        VARCHAR phone
        VARCHAR password_hash
        VARCHAR first_name
        VARCHAR last_name
        ENUM role
        BOOLEAN is_active
        DATETIME created_at
    }

    customer_profiles {
        INT id PK
        INT user_id FK
        INT default_address_id FK
        VARCHAR preferred_language
        DATETIME created_at
    }

    technician_profiles {
        INT id PK
        INT user_id FK
        TEXT bio
        TINYINT experience_years
        ENUM verification_status
        BOOLEAN is_available
        BOOLEAN is_online
        DECIMAL latitude
        DECIMAL longitude
        DECIMAL service_radius_km
        VARCHAR service_city
        INT completed_jobs
        DECIMAL avg_rating
    }

    service_categories {
        INT id PK
        VARCHAR name
        VARCHAR slug UK
        TEXT description
        VARCHAR icon
        DECIMAL min_price
        DECIMAL max_price
        DECIMAL inspection_charge
        INT warranty_period_days
        BOOLEAN is_active
    }

    technician_skills {
        INT id PK
        INT technician_id FK
        INT category_id FK
        TINYINT years_experience
    }

    addresses {
        INT id PK
        INT user_id FK
        VARCHAR label
        VARCHAR address_line1
        VARCHAR city
        VARCHAR pincode
        DECIMAL latitude
        DECIMAL longitude
        BOOLEAN is_default
    }

    technician_service_areas {
        INT id PK
        INT technician_id FK
        VARCHAR area_name
        VARCHAR city
        DECIMAL latitude
        DECIMAL longitude
        DECIMAL radius_km
    }

    bookings {
        INT id PK
        VARCHAR booking_number UK
        INT customer_id FK
        INT category_id FK
        INT technician_id FK
        INT address_id FK
        VARCHAR title
        BOOLEAN is_emergency
        ENUM status
        ENUM urgency
        DECIMAL estimated_total
        DECIMAL final_total
        INT assignment_attempts
        DATETIME created_at
    }

    booking_assignments {
        INT id PK
        INT booking_id FK
        INT technician_id FK
        INT attempt_number
        ENUM status
        DATETIME deadline
        DATETIME responded_at
    }

    booking_status_history {
        INT id PK
        INT booking_id FK
        VARCHAR from_status
        VARCHAR to_status
        INT changed_by FK
        VARCHAR actor_role
        DATETIME created_at
    }

    price_estimates {
        INT id PK
        INT booking_id FK
        INT technician_id FK
        INT revision_number
        DECIMAL labor_charge
        DECIMAL material_charge
        DECIMAL inspection_charge
        DECIMAL total_estimate
        ENUM status
        DATETIME approved_at
    }

    payments {
        INT id PK
        VARCHAR payment_number UK
        INT booking_id FK
        INT customer_id FK
        DECIMAL amount
        ENUM payment_method
        ENUM status
        VARCHAR gateway_payment_id
        BOOLEAN is_sandbox
        DATETIME paid_at
    }

    refunds {
        INT id PK
        VARCHAR refund_number UK
        INT payment_id FK
        INT booking_id FK
        DECIMAL amount
        ENUM status
        INT approved_by FK
    }

    invoices {
        INT id PK
        VARCHAR invoice_number UK
        INT booking_id FK
        INT customer_id FK
        INT technician_id FK
        INT payment_id FK
        DECIMAL total_amount
        ENUM status
        DATETIME issued_at
    }

    reviews {
        INT id PK
        INT booking_id FK
        INT customer_id FK
        INT technician_id FK
        TINYINT rating
        TEXT comment
        BOOLEAN is_visible
    }

    warranty_claims {
        INT id PK
        VARCHAR claim_number UK
        INT booking_id FK
        INT customer_id FK
        INT technician_id FK
        TEXT issue_description
        ENUM status
        ENUM resolution_type
        DATETIME warranty_expires_at
    }

    notifications {
        INT id PK
        INT user_id FK
        VARCHAR type
        VARCHAR title
        TEXT message
        BOOLEAN is_read
        DATETIME created_at
    }

    technician_documents {
        INT id PK
        INT technician_id FK
        ENUM document_type
        VARCHAR document_name
        ENUM status
    }

    platform_settings {
        INT id PK
        VARCHAR setting_key UK
        TEXT setting_value
        VARCHAR description
        ENUM data_type
    }

    audit_logs {
        INT id PK
        INT actor_id FK
        VARCHAR action
        VARCHAR entity_type
        INT entity_id
        JSON details
        DATETIME created_at
    }

    service_attachments {
        INT id PK
        INT booking_id FK
        INT uploaded_by FK
        ENUM attachment_type
        VARCHAR file_name
        VARCHAR file_path
    }

    technician_earnings {
        INT id PK
        INT technician_id FK
        INT booking_id FK
        INT payment_id FK
        DECIMAL gross_amount
        DECIMAL commission_amount
        DECIMAL net_amount
        ENUM settlement_status
    }

    %% Relationships
    users ||--o| customer_profiles : "has"
    users ||--o| technician_profiles : "has"
    users ||--o{ addresses : "has"
    users ||--o{ notifications : "receives"
    users ||--o{ audit_logs : "performs"

    customer_profiles ||--o| addresses : "default"

    technician_profiles ||--o{ technician_skills : "has"
    technician_profiles ||--o{ technician_service_areas : "covers"
    technician_profiles ||--o{ technician_documents : "submits"

    service_categories ||--o{ technician_skills : "linked"

    users ||--o{ bookings : "creates as customer"
    users ||--o{ bookings : "assigned as technician"
    service_categories ||--o{ bookings : "categorizes"
    addresses ||--o{ bookings : "service location"

    bookings ||--o{ booking_assignments : "has"
    bookings ||--o{ booking_status_history : "tracks"
    bookings ||--o{ price_estimates : "quoted"
    bookings ||--o{ payments : "paid via"
    bookings ||--o| reviews : "reviewed"
    bookings ||--o{ warranty_claims : "claimed"
    bookings ||--o{ service_attachments : "attached"
    bookings ||--o| technician_earnings : "earns"
    bookings ||--o| invoices : "invoiced"

    payments ||--o{ refunds : "refunded"
    payments ||--o| invoices : "generates"
```

## Table Relationship Summary

| Parent | Child | Relationship | FK Rule |
|--------|-------|-------------|---------|
| users | customer_profiles | 1:1 | CASCADE |
| users | technician_profiles | 1:1 | CASCADE |
| users | addresses | 1:N | CASCADE |
| users | bookings (customer) | 1:N | RESTRICT |
| users | bookings (technician) | 1:N | SET NULL |
| users | notifications | 1:N | CASCADE |
| service_categories | bookings | 1:N | RESTRICT |
| service_categories | technician_skills | 1:N | CASCADE |
| technician_profiles | technician_skills | 1:N | CASCADE |
| technician_profiles | technician_service_areas | 1:N | CASCADE |
| technician_profiles | technician_documents | 1:N | CASCADE |
| bookings | booking_assignments | 1:N | CASCADE |
| bookings | booking_status_history | 1:N | CASCADE |
| bookings | price_estimates | 1:N | CASCADE |
| bookings | payments | 1:N | RESTRICT |
| bookings | invoices | 1:1 | RESTRICT |
| bookings | reviews | 1:1 | RESTRICT |
| bookings | warranty_claims | 1:N | RESTRICT |
| bookings | service_attachments | 1:N | CASCADE |
| bookings | technician_earnings | 1:1 | RESTRICT |
| payments | refunds | 1:N | RESTRICT |
| payments | invoices | 1:1 | SET NULL |
