-- Crear tabla de usuarios para gestión local
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  openproject_id INTEGER UNIQUE,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  api_token VARCHAR(255), -- Token de API de OpenProject para cada usuario
  roles VARCHAR(255),
  last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_openproject_id ON users(openproject_id);

-- Cambiar roles de TEXT[] a VARCHAR(255) si es necesario
-- Nota: Ejecutar manualmente si la tabla ya existe
-- ALTER TABLE users ALTER COLUMN roles TYPE VARCHAR(255);
-- UPDATE users SET roles = '' WHERE roles IS NULL OR roles = '[]';