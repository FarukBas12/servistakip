-- Database already selected via connection string

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'technician')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    maps_link TEXT,
    lat DECIMAL(9,6),
    lng DECIMAL(9,6),
    due_date TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    assigned_to INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS photos (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    type VARCHAR(20) CHECK (type IN ('before', 'after', 'completion')),
    gps_lat DECIMAL(9,6),
    gps_lng DECIMAL(9,6),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stores (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    address TEXT NOT NULL
);

-- Seed Data (Optional)
-- Password is '123456' hashed with bcrypt
INSERT INTO users (username, password_hash, role) 
VALUES 
('admin', '$2b$10$sAm9ICo2YCmhwh/17vH86.5/hWz2NbtAr/EtOgVIifFSZiZpkNbW6', 'admin'),
('tech1', '$2b$10$sAm9ICo2YCmhwh/17vH86.5/hWz2NbtAr/EtOgVIifFSZiZpkNbW6', 'technician')
ON CONFLICT (username) DO UPDATE 
SET password_hash = EXCLUDED.password_hash;
