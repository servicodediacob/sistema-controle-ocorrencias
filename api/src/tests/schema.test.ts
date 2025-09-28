// api/src/tests/schema.test.ts

import db from '../db'; // <<< GARANTA QUE ESTA LINHA ESTEJA ASSIM

interface IColumnSchema {
  column_name: string;
  data_type: string;
  is_nullable: 'YES' | 'NO';
}

const getTableSchema = async (tableName: string): Promise<IColumnSchema[]> => {
  const { rows } = await db.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = $1
    ORDER BY ordinal_position;
  `, [tableName]);
  return rows;
};

describe('Database Schema Integrity', () => {
  it('deve ter a estrutura correta para a tabela "usuarios"', async () => {
    const expectedSchema: IColumnSchema[] = [
      { column_name: 'id', data_type: 'integer', is_nullable: 'NO' },
      { column_name: 'nome', data_type: 'character varying', is_nullable: 'NO' },
      { column_name: 'email', data_type: 'character varying', is_nullable: 'NO' },
      { column_name: 'senha_hash', data_type: 'character varying', is_nullable: 'NO' },
      { column_name: 'role', data_type: 'character varying', is_nullable: 'NO' },
      { column_name: 'obm_id', data_type: 'integer', is_nullable: 'YES' },
      { column_name: 'criado_em', data_type: 'timestamp with time zone', is_nullable: 'YES' },
    ];
    const actualSchema = await getTableSchema('usuarios');
    expect(actualSchema).toEqual(expectedSchema);
  });

  it('deve ter a estrutura correta para a tabela "ocorrencias_detalhadas"', async () => {
    const expectedSchema: IColumnSchema[] = [
        { column_name: 'id', data_type: 'integer', is_nullable: 'NO' },
        { column_name: 'numero_ocorrencia', data_type: 'character varying', is_nullable: 'YES' },
        { column_name: 'natureza_id', data_type: 'integer', is_nullable: 'NO' },
        { column_name: 'endereco', data_type: 'text', is_nullable: 'YES' },
        { column_name: 'bairro', data_type: 'character varying', is_nullable: 'YES' },
        { column_name: 'cidade_id', data_type: 'integer', is_nullable: 'NO' },
        { column_name: 'viaturas', data_type: 'text', is_nullable: 'YES' },
        { column_name: 'veiculos_envolvidos', data_type: 'text', is_nullable: 'YES' },
        { column_name: 'dados_vitimas', data_type: 'text', is_nullable: 'YES' },
        { column_name: 'resumo_ocorrencia', data_type: 'text', is_nullable: 'YES' },
        { column_name: 'data_ocorrencia', data_type: 'date', is_nullable: 'NO' },
        { column_name: 'horario_ocorrencia', data_type: 'time without time zone', is_nullable: 'YES' },
        { column_name: 'usuario_id', data_type: 'integer', is_nullable: 'YES' },
        { column_name: 'criado_em', data_type: 'timestamp with time zone', is_nullable: 'YES' },
    ];
    const actualSchema = await getTableSchema('ocorrencias_detalhadas');
    expect(actualSchema).toEqual(expectedSchema);
  });
  
  it('deve ter a estrutura correta para a tabela "obms"', async () => {
    const expectedSchema: IColumnSchema[] = [
      { column_name: 'id', data_type: 'integer', is_nullable: 'NO' },
      { column_name: 'nome', data_type: 'character varying', is_nullable: 'NO' },
      { column_name: 'crbm_id', data_type: 'integer', is_nullable: 'NO' },
    ];
    const actualSchema = await getTableSchema('obms');
    expect(actualSchema).toEqual(expectedSchema);
  });
});
