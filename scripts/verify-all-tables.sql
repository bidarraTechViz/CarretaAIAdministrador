-- Verificar todas as tabelas existentes
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Verificar a estrutura da tabela trucks
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'trucks';

-- Verificar a estrutura da tabela projects
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'projects';

-- Verificar a estrutura da tabela trips
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'trips';

-- Verificar a estrutura da tabela clients
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'clients';

-- Criar tabela trucks se não existir
CREATE TABLE IF NOT EXISTS trucks (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  plate_number TEXT,
  operator TEXT NOT NULL,
  current_project TEXT,
  project_id INTEGER,
  load_volume INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela projects se não existir
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  client TEXT NOT NULL,
  client_id INTEGER,
  address TEXT NOT NULL,
  estimated_volume INTEGER,
  transported_volume INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_client FOREIGN KEY (client_id) REFERENCES clients(id)
);

-- Criar tabela trips se não existir
CREATE TABLE IF NOT EXISTS trips (
  id SERIAL PRIMARY KEY,
  truck_id INTEGER,
  project_id INTEGER,
  material TEXT NOT NULL,
  volume INTEGER NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'ongoing',
  photo_url TEXT,
  coordinates TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_truck FOREIGN KEY (truck_id) REFERENCES trucks(id),
  CONSTRAINT fk_project FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Criar tabela clients se não existir
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar client_id aos projetos se não existir
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'client_id') THEN
    -- Atualizar client_id baseado no nome do cliente para registros existentes
    UPDATE projects p
    SET client_id = c.id
    FROM clients c
    WHERE p.client = c.name AND p.client_id IS NULL;
  END IF;
END $$;

-- Criar função get_daily_volume se não existir
CREATE OR REPLACE FUNCTION get_daily_volume(days_count INTEGER DEFAULT 7)
RETURNS TABLE (
  date DATE,
  total_volume INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(
      current_date - ((days_count - 1) * INTERVAL '1 day'),
      current_date,
      INTERVAL '1 day'
    )::date AS series_date
  )
  SELECT
    ds.series_date AS date,
    COALESCE(SUM(t.volume), 0)::INTEGER AS total_volume
  FROM
    date_series ds
  LEFT JOIN
    trips t ON DATE(t.end_time) = ds.series_date AND t.status = 'completed'
  GROUP BY
    ds.series_date
  ORDER BY
    ds.series_date;
END;
$$;

-- Inserir dados de exemplo se as tabelas estiverem vazias
DO $$
BEGIN
  -- Inserir clientes se não existirem
  IF NOT EXISTS (SELECT 1 FROM clients LIMIT 1) THEN
    INSERT INTO clients (name, username)
    VALUES 
      ('Cliente A', 'clienteA'),
      ('Cliente B', 'clienteB'),
      ('Cliente C', 'clienteC');
  END IF;

  -- Inserir projetos se não existirem
  IF NOT EXISTS (SELECT 1 FROM projects LIMIT 1) THEN
    INSERT INTO projects (name, client, address, estimated_volume, transported_volume, status, client_id)
    VALUES 
      ('Projeto X', 'Cliente A', 'Rua Principal, 123', 10000, 7500, 'active', (SELECT id FROM clients WHERE name = 'Cliente A')),
      ('Projeto Y', 'Cliente A', 'Rua Elm, 456', 15000, 6000, 'active', (SELECT id FROM clients WHERE name = 'Cliente A')),
      ('Projeto Z', 'Cliente B', 'Rua Carvalho, 789', 20000, 18000, 'active', (SELECT id FROM clients WHERE name = 'Cliente B')),
      ('Projeto Concluído 1', 'Cliente C', 'Rua Antiga, 100', 5000, 5000, 'completed', (SELECT id FROM clients WHERE name = 'Cliente C')),
      ('Projeto Concluído 2', 'Cliente B', 'Avenida Central, 200', 8000, 8000, 'completed', (SELECT id FROM clients WHERE name = 'Cliente B')),
      ('Projeto Concluído 3', 'Cliente A', 'Rua das Flores, 300', 12000, 12000, 'completed', (SELECT id FROM clients WHERE name = 'Cliente A'));
  END IF;

  -- Inserir caminhões se não existirem
  IF NOT EXISTS (SELECT 1 FROM trucks LIMIT 1) THEN
    INSERT INTO trucks (name, plate_number, operator, current_project, load_volume)
    VALUES 
      ('Caminhão 001', 'ABC-1234', 'joao.silva', 'Projeto X', 20),
      ('Caminhão 002', 'DEF-5678', 'maria.santos', 'Projeto Y', 25),
      ('Caminhão 003', 'GHI-9012', 'pedro.oliveira', NULL, 18);
  END IF;

  -- Inserir viagens se não existirem
  IF NOT EXISTS (SELECT 1 FROM trips LIMIT 1) THEN
    INSERT INTO trips (truck_id, project_id, material, volume, start_time, end_time, status, photo_url, coordinates)
    VALUES 
      (1, 1, 'Areia', 20, NOW() - INTERVAL '2 hours', NULL, 'ongoing', '/placeholder.svg?height=100&width=150', '41.40338, 2.17403'),
      (2, 2, 'Terra', 25, NOW() - INTERVAL '1 hour', NULL, 'ongoing', '/placeholder.svg?height=100&width=150', '41.40338, 2.17403'),
      (1, 1, 'Areia', 20, NOW() - INTERVAL '1 day', NOW() - INTERVAL '23 hours', 'completed', '/placeholder.svg?height=100&width=150', '41.40338, 2.17403'),
      (2, 2, 'Terra', 25, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day 23 hours', 'completed', '/placeholder.svg?height=100&width=150', '41.40338, 2.17403'),
      (3, 3, 'Cascalho', 18, NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days 23 hours', 'completed', '/placeholder.svg?height=100&width=150', '41.40338, 2.17403');
  END IF;
END $$;

