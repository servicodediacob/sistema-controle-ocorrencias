/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  // Usamos ON CONFLICT DO NOTHING para garantir que, se os dados já existirem,
  // o script não falhe. Ele simplesmente não fará nada.
  // Isso torna a migração segura para ser executada múltiplas vezes.
  pgm.sql(`
    -- Inserindo CRBMs
    INSERT INTO crbms (nome) VALUES
    ('1º CRBM'), ('2º CRBM'), ('3º CRBM'), ('4º CRBM'), ('5º CRBM'),
    ('6º CRBM'), ('7º CRBM'), ('8º CRBM'), ('9º CRBM')
    ON CONFLICT (nome) DO NOTHING;

    -- Inserindo OBMs
    -- Usamos subconsultas para garantir que os IDs de CRBM estejam corretos.
    INSERT INTO obms (nome, crbm_id) VALUES
    ('Goiânia - Diurno', (SELECT id FROM crbms WHERE nome = '1º CRBM')),
    ('Goiânia - Noturno', (SELECT id FROM crbms WHERE nome = '1º CRBM')),
    ('Rio Verde', (SELECT id FROM crbms WHERE nome = '2º CRBM')),
    ('Jataí', (SELECT id FROM crbms WHERE nome = '2º CRBM')),
    ('Anápolis', (SELECT id FROM crbms WHERE nome = '3º CRBM')),
    ('Pirenópolis', (SELECT id FROM crbms WHERE nome = '3º CRBM')),
    ('Luziânia', (SELECT id FROM crbms WHERE nome = '4º CRBM')),
    ('Águas Lindas', (SELECT id FROM crbms WHERE nome = '4º CRBM')),
    ('Aparecida de Goiânia - Diurno', (SELECT id FROM crbms WHERE nome = '5º CRBM')),
    ('Aparecida de Goiânia - Noturno', (SELECT id FROM crbms WHERE nome = '5º CRBM')),
    ('Goiás', (SELECT id FROM crbms WHERE nome = '6º CRBM')),
    ('Iporá', (SELECT id FROM crbms WHERE nome = '6º CRBM')),
    ('Itumbiara', (SELECT id FROM crbms WHERE nome = '7º CRBM')),
    ('Caldas', (SELECT id FROM crbms WHERE nome = '7º CRBM')),
    ('Porangatu', (SELECT id FROM crbms WHERE nome = '8º CRBM')),
    ('Goianésia', (SELECT id FROM crbms WHERE nome = '8º CRBM')),
    ('Formosa', (SELECT id FROM crbms WHERE nome = '9º CRBM')),
    ('Planaltina', (SELECT id FROM crbms WHERE nome = '9º CRBM'))
    ON CONFLICT (nome) DO NOTHING;
  `);
};

exports.down = pgm => {
  // A migração 'down' deve remover os dados que a 'up' inseriu.
  pgm.sql(`
    DELETE FROM obms WHERE nome IN (
      'Goiânia - Diurno', 'Goiânia - Noturno', 'Rio Verde', 'Jataí', 'Anápolis', 'Pirenópolis',
      'Luziânia', 'Águas Lindas', 'Aparecida de Goiânia - Diurno', 'Aparecida de Goiânia - Noturno',
      'Goiás', 'Iporá', 'Itumbiara', 'Caldas', 'Porangatu', 'Goianésia', 'Formosa', 'Planaltina'
    );
    DELETE FROM crbms WHERE nome IN (
      '1º CRBM', '2º CRBM', '3º CRBM', '4º CRBM', '5º CRBM',
      '6º CRBM', '7º CRBM', '8º CRBM', '9º CRBM'
    );
  `);
};
