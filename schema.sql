-- Client Requests Table
CREATE TABLE IF NOT EXISTS client_requests (
  id TEXT PRIMARY KEY,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  neighbourhood TEXT,
  pet_type TEXT,
  pet_name TEXT,
  breed TEXT,
  behavioral_traits TEXT,
  medical_conditions TEXT,
  exercise_needs TEXT,
  service_type TEXT,
  start_date TEXT,
  end_date TEXT,
  outdoor_space TEXT,
  experience_level TEXT
);

-- Sitters Roster Table
CREATE TABLE IF NOT EXISTS sitters (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  neighbourhood TEXT NOT NULL,
  experience_years INTEGER DEFAULT 1,
  vet_tech_background BOOLEAN DEFAULT 0,
  accepted_pet_types TEXT NOT NULL,
  can_handle_anxiety BOOLEAN DEFAULT 1,
  can_handle_medication BOOLEAN DEFAULT 0,
  has_outdoor_space BOOLEAN DEFAULT 0,
  nightly_rate_usd REAL NOT NULL,
  is_active BOOLEAN DEFAULT 1
);

-- Seed Initial Sitters into Cloudflare D1
INSERT INTO sitters (id, full_name, neighbourhood, experience_years, vet_tech_background, accepted_pet_types, can_handle_anxiety, can_handle_medication, has_outdoor_space, nightly_rate_usd) 
VALUES 
  ('sitter-1', 'Elena Rostova', 'Brickell', 5, 1, 'Dog,Cat', 1, 1, 1, 85.00),
  ('sitter-2', 'Marcus Vance', 'Coconut Grove', 4, 0, 'Dog', 1, 0, 1, 65.00),
  ('sitter-3', 'Sophia Chen', 'South Beach', 3, 0, 'Cat', 1, 0, 0, 70.00);
