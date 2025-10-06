// api/src/db/migrations/<timestamp>_inserir-naturezas-obitos.js
/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    INSERT INTO naturezas_ocorrencia (grupo, subgrupo, abreviacao) VALUES
      ('Relatório de Óbitos', 'ACIDENTE DE TRÂNSITO', NULL),
      ('Relatório de Óbitos', 'AFOGAMENTO OU CADÁVER', NULL),
      ('Relatório de Óbitos', 'ARMA DE FOGO/BRANCA/AGRESSÃO', NULL),
      ('Relatório de Óbitos', 'AUTO EXTÉRMÍNIO', NULL),
      ('Relatório de Óbitos', 'MAL SÚBITO', NULL),
      ('Relatório de Óbitos', 'ACIDENTES COM VIATURAS', NULL),
      ('Relatório de Óbitos', 'OUTROS', NULL)
    ON CONFLICT (grupo, subgrupo) DO NOTHING;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DELETE FROM naturezas_ocorrencia WHERE grupo = 'Relatório de Óbitos';
  `);
};
