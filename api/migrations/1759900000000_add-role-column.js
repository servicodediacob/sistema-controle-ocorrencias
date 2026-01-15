// api/migrations/1759900000000_add-role-column.js
/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    // Adiciona a coluna 'role' à tabela usuarios se ela não existir
    pgm.sql(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'usuarios' AND column_name = 'role'
      ) THEN
        ALTER TABLE usuarios 
        ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user' 
        CHECK (role IN ('user', 'admin'));
      END IF;
    END $$;
  `);
};

exports.down = pgm => {
    pgm.sql(`
    ALTER TABLE usuarios DROP COLUMN IF EXISTS role;
  `);
};
