-- CareLens AI Schema Blueprint
-- Core Principle: Authorize -> Retrieve -> Generate -> Cite

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'doctor',
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS staff_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL,
    department VARCHAR(100) DEFAULT 'Internal Medicine',
    license_number VARCHAR(100) DEFAULT 'MD-CL-2026',
    FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS patients (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    date_of_birth VARCHAR(50) NOT NULL,
    gender VARCHAR(20) DEFAULT 'Unknown',
    mrn VARCHAR(50) UNIQUE NOT NULL,
    metadata_json TEXT DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS patient_grants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    patient_id VARCHAR(50) NOT NULL,
    permissions VARCHAR(255) DEFAULT 'read,write,query,reconcile',
    granted_by VARCHAR(100) DEFAULT 'system_admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(patient_id) REFERENCES patients(id)
);

CREATE TABLE IF NOT EXISTS documents (
    id VARCHAR(100) PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    hash VARCHAR(64) NOT NULL,
    version INTEGER DEFAULT 1,
    status VARCHAR(50) DEFAULT 'processed',
    uploaded_by VARCHAR(100) DEFAULT 'system',
    cycle_label VARCHAR(50) DEFAULT 'Cycle 1',
    document_type VARCHAR(50) DEFAULT 'Consultation Note',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(patient_id) REFERENCES patients(id)
);

CREATE TABLE IF NOT EXISTS chunks (
    id VARCHAR(100) PRIMARY KEY,
    document_id VARCHAR(100) NOT NULL,
    patient_id VARCHAR(50) NOT NULL,
    page_number INTEGER NOT NULL DEFAULT 1,
    chunk_index INTEGER NOT NULL DEFAULT 0,
    content TEXT NOT NULL,
    embedding_json TEXT,
    metadata_json TEXT DEFAULT '{}',
    FOREIGN KEY(document_id) REFERENCES documents(id),
    FOREIGN KEY(patient_id) REFERENCES patients(id)
);

CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id VARCHAR(50) NOT NULL,
    document_id VARCHAR(100),
    cycle_label VARCHAR(50) DEFAULT 'Cycle 1',
    event_type VARCHAR(100) NOT NULL,
    event_date VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    source_page INTEGER DEFAULT 1,
    FOREIGN KEY(patient_id) REFERENCES patients(id)
);

CREATE TABLE IF NOT EXISTS test_requests (
    id VARCHAR(100) PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL,
    document_id VARCHAR(100),
    cycle_label VARCHAR(50) DEFAULT 'Cycle 1',
    test_name VARCHAR(200) NOT NULL,
    requested_date VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    requesting_physician VARCHAR(100) DEFAULT 'Dr. Sarah Miller',
    FOREIGN KEY(patient_id) REFERENCES patients(id)
);

CREATE TABLE IF NOT EXISTS test_results (
    id VARCHAR(100) PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL,
    document_id VARCHAR(100),
    cycle_label VARCHAR(50) DEFAULT 'Cycle 1',
    test_name VARCHAR(200) NOT NULL,
    result_date VARCHAR(50) NOT NULL,
    result_data TEXT NOT NULL,
    reference_range VARCHAR(100),
    is_abnormal BOOLEAN DEFAULT 0,
    FOREIGN KEY(patient_id) REFERENCES patients(id)
);

CREATE TABLE IF NOT EXISTS conflicts (
    id VARCHAR(100) PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL,
    cycle_label VARCHAR(50) DEFAULT 'Cycle 2',
    conflict_type VARCHAR(100) DEFAULT 'Procedure Date Discrepancy',
    fact_a TEXT NOT NULL,
    fact_b TEXT NOT NULL,
    source_a_doc VARCHAR(255) NOT NULL,
    source_a_page INTEGER DEFAULT 1,
    source_b_doc VARCHAR(255) NOT NULL,
    source_b_page INTEGER DEFAULT 1,
    status VARCHAR(50) DEFAULT 'Needs Review',
    reviewed_by VARCHAR(100),
    resolution_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(patient_id) REFERENCES patients(id)
);

CREATE TABLE IF NOT EXISTS audit_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    patient_id VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(50) DEFAULT '127.0.0.1',
    metadata_json TEXT DEFAULT '{}',
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(patient_id) REFERENCES patients(id)
);
