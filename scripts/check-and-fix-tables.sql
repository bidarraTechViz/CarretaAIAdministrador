-- Verificar a estrutura atual da tabela trucks
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'trucks';

-- Adicionar coluna current_project se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trucks' AND column_name = 'current_project') THEN
        ALTER TABLE trucks ADD COLUMN current_project TEXT;
    END IF;
END $$;

-- Adicionar coluna project_id se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trucks' AND column_name = 'project_id') THEN
        ALTER TABLE trucks ADD COLUMN project_id INTEGER;
    END IF;
END $$;

-- Adicionar coluna plate_number se não existir (e renomear plateNumber se existir)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trucks' AND column_name = 'plate_number') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trucks' AND column_name = 'platenumber') THEN
            ALTER TABLE trucks RENAME COLUMN platenumber TO plate_number;
        ELSE
            ALTER TABLE trucks ADD COLUMN plate_number TEXT;
        END IF;
    END IF;
END $$;

-- Adicionar coluna load_volume se não existir (e renomear loadVolume se existir)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trucks' AND column_name = 'load_volume') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trucks' AND column_name = 'loadvolume') THEN
            ALTER TABLE trucks RENAME COLUMN loadvolume TO load_volume;
        ELSE
            ALTER TABLE trucks ADD COLUMN load_volume INTEGER;
        END IF;
    END IF;
END $$;

-- Verificar a estrutura atualizada
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'trucks';

