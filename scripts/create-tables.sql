-- Criar tabela de caminhões
CREATE TABLE IF NOT EXISTS trucks (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  plate_number TEXT NOT NULL,
  operator TEXT NOT NULL,
  current_project TEXT,
  load_volume INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de clientes
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de projetos
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  client TEXT NOT NULL,
  address TEXT NOT NULL,
  estimated_volume INTEGER NOT NULL,
  transported_volume INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de viagens
CREATE TABLE IF NOT EXISTS trips (
  id SERIAL PRIMARY KEY,
  truck_id INTEGER NOT NULL REFERENCES trucks(id),
  project_id INTEGER NOT NULL REFERENCES projects(id),
  material TEXT NOT NULL,
  volume INTEGER NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'ongoing',
  photo_url TEXT,
  coordinates TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar função para obter volume diário
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

