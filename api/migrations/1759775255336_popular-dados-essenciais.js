/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  // Usamos ON CONFLICT DO NOTHING para garantir que, se os dados já existirem,
  // o script não falhe. Ele simplesmente não fará nada.
  pgm.sql(`
    -- Inserindo CRBMs
    INSERT INTO crbms (nome) VALUES
    ('1º CRBM'), ('2º CRBM'), ('3º CRBM'), ('4º CRBM'), ('5º CRBM'),
    ('6º CRBM'), ('7º CRBM'), ('8º CRBM'), ('9º CRBM')
    ON CONFLICT (nome) DO NOTHING;

    -- Inserindo OBMs
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

    -- ======================= INÍCIO DA CORREÇÃO =======================
    -- Inserindo TODAS as Naturezas de Ocorrência
    INSERT INTO naturezas_ocorrencia (grupo, subgrupo, abreviacao) VALUES
      ('Resgate', 'Resgate', 'RESGATE'),
      ('Incêndio', 'Incêndio - Outros', 'INC. OUT.'),
      ('Incêndio', 'Incêndio em Edificação', 'INC. EDIF'),
      ('Incêndio', 'Incêndio em Vegetação', 'INC. VEG'),
      ('Busca e Salvamento', 'Busca de Cadáver', 'B. CADÁVER'),
      ('Busca e Salvamento', 'Busca e Salvamento - Diversos', 'B. SALV.'),
      ('Ações Preventivas', 'Eventos', 'AP. EVE'),
      ('Ações Preventivas', 'Folders / Panfletos', 'AP. FOL'),
      ('Ações Preventivas', 'Outros', 'AP. OUT'),
      ('Ações Preventivas', 'Palestras', 'AP. PAL'),
      ('Atividades Técnicas', 'Análise de Projetos', 'AN. PROJ'),
      ('Atividades Técnicas', 'Inspeções', 'AT. INS'),
      ('Atividades Técnicas', 'Atividades Técnicas - Outros', 'AT. OUT'),
      ('Produtos Perigosos', 'Outros / Diversos', 'PPO'),
      ('Produtos Perigosos', 'Vazamentos', 'PPV'),
      ('Defesa Civil', 'De Resposta', 'DC RESP.'),
      ('Defesa Civil', 'Preventiva', 'DC PREV.'),
      ('Relatório de Óbitos', 'ACIDENTE DE TRÂNSITO', NULL),
      ('Relatório de Óbitos', 'AFOGAMENTO OU CADÁVER', NULL),
      ('Relatório de Óbitos', 'ARMA DE FOGO/BRANCA/AGRESSÃO', NULL),
      ('Relatório de Óbitos', 'AUTO EXTÉRMÍNIO', NULL),
      ('Relatório de Óbitos', 'MAL SÚBITO', NULL),
      ('Relatório de Óbitos', 'ACIDENTES COM VIATURAS', NULL),
      ('Relatório de Óbitos', 'OUTROS', NULL)
    ON CONFLICT (grupo, subgrupo) DO NOTHING;
    -- ======================= FIM DA CORREÇÃO =======================
  `);
};

exports.down = pgm => {
  // A função 'down' agora também remove as naturezas para manter a consistência.
  pgm.sql(\`
    DELETE FROM naturezas_ocorrencia;
    DELETE FROM obms;
    DELETE FROM crbms;
  \`);
};
