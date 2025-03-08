-- Verificar a estrutura atual da tabela trucks
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'trucks';

-- Adicionar coluna current_project se não existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trucks' AND column_name = 'current_project') THEN
      ALTER TABLE trucks ADD COLUMN current_project TEXT;
      
      -- Se project_id existir, copiar os valores para current_project
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trucks' AND column_name = 'project_id') THEN
          UPDATE trucks 
          SET current_project = CAST(project_id AS TEXT) 
          WHERE project_id IS NOT NULL;
      END IF;
  END IF;
END $$;

-- Adicionar coluna project_id se não existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trucks' AND column_name = 'project_id') THEN
      ALTER TABLE trucks ADD COLUMN project_id INTEGER;
      
      -- Se current_project existir, tentar converter para project_id quando possível
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trucks' AND column_name = 'current_project') THEN
          UPDATE trucks 
          SET project_id = CAST(current_project AS INTEGER)
          WHERE current_project ~ '^[0-9]+$';
      END IF;
  END IF;
END $$;

-- Adicionar coluna load_volume se não existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trucks' AND column_name = 'load_volume') THEN
      -- Verificar se loadVolume existe
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trucks' AND column_name = 'loadvolume') THEN
          -- Renomear loadVolume para load_volume
          ALTER TABLE trucks RENAME COLUMN loadvolume TO load_volume;
      ELSE
          -- Adicionar nova coluna load_volume
          ALTER TABLE trucks ADD COLUMN load_volume INTEGER;
      END IF;
  END IF;
END $$;

-- Verificar a estrutura atualizada
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'trucks';

