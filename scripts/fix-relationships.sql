-- Verificar se a coluna client_id existe na tabela projects
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'client_id') THEN
    -- Adicionar coluna client_id se não existir
    ALTER TABLE projects ADD COLUMN client_id INTEGER;
    
    -- Atualizar client_id baseado no nome do cliente
    UPDATE projects p
    SET client_id = c.id
    FROM clients c
    WHERE p.client = c.name;
    
    -- Adicionar chave estrangeira
    ALTER TABLE projects 
    ADD CONSTRAINT fk_projects_client 
    FOREIGN KEY (client_id) 
    REFERENCES clients(id);
  END IF;
END $$;

-- Verificar se a relação foi criada corretamente
SELECT
    tc.table_schema, 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='projects';

