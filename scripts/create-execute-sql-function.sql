-- Função para executar consultas SQL dinâmicas
-- ATENÇÃO: Esta função deve ser usada com cuidado, pois permite a execução de SQL arbitrário
CREATE OR REPLACE FUNCTION execute_sql(sql_query TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com as permissões do criador da função
AS $$
DECLARE
  result JSONB;
BEGIN
  EXECUTE 'SELECT jsonb_agg(row_to_json(t)) FROM (' || sql_query || ') t' INTO result;
  RETURN COALESCE(result, '[]'::JSONB);
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Erro ao executar consulta SQL: %', SQLERRM;
END;
$$;

-- Configurar permissões para a função
GRANT EXECUTE ON FUNCTION execute_sql TO anon, authenticated, service_role;

-- Comentário para documentação
COMMENT ON FUNCTION execute_sql IS 'Executa uma consulta SQL dinâmica e retorna o resultado como JSONB. Usar com cuidado.';

