/* eslint-disable camelcase */
// Caminho: api/src/db/migrations/xxxxxxxxxxxxx_adicionar-tabela-auditoria.js

exports.shorthands = undefined;

exports.up = pgm => {
  pgm.createTable('auditoria_logs', {
    id: 'id',
    usuario_id: {
      type: 'integer',
      references: '"usuarios"',
      onDelete: 'SET NULL'
    },
    usuario_nome: { type: 'varchar(100)' },
    acao: { type: 'varchar(255)', notNull: true },
    detalhes: { type: 'jsonb' },
    criado_em: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });
};

exports.down = pgm => {
  pgm.dropTable('auditoria_logs');
};
