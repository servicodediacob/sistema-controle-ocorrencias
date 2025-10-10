// Migration: create auditoria_logs table
/* eslint-disable @typescript-eslint/no-var-requires */

/** @type {import('node-pg-migrate').MigrationBuilder} */
exports.up = (pgm) => {
  pgm.createTable('auditoria_logs', {
    id: 'id',
    usuario_id: { type: 'integer' },
    usuario_nome: { type: 'varchar(100)' },
    acao: { type: 'varchar(120)', notNull: true },
    detalhes: { type: 'jsonb', notNull: true, default: pgm.func(`'{}'::jsonb`) },
    criado_em: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
};

/** @type {import('node-pg-migrate').MigrationBuilder} */
exports.down = (pgm) => {
  pgm.dropTable('auditoria_logs');
};

