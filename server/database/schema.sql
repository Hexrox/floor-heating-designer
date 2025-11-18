-- Floor Heating Designer Database Schema

-- Drop tables if exist
DROP TABLE IF EXISTS drawings CASCADE;
DROP TABLE IF EXISTS floor_plans CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Floor plans (uploaded images)
CREATE TABLE floor_plans (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  image_path VARCHAR(500) NOT NULL,
  original_name VARCHAR(255),
  width INTEGER,
  height INTEGER,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id)
);

-- Drawing data (canvas state, parameters, loops)
CREATE TABLE drawings (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  canvas_data JSONB,
  parameters JSONB,
  loops_data JSONB,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id)
);

-- Indexes for performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_updated_at ON projects(updated_at DESC);
CREATE INDEX idx_floor_plans_project_id ON floor_plans(project_id);
CREATE INDEX idx_drawings_project_id ON drawings(project_id);

-- Example data (optional)
-- INSERT INTO users (email, password_hash, name)
-- VALUES ('demo@example.com', '$2b$10$demoHashedPassword', 'Demo User');
