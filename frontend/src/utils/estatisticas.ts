// frontend/src/utils/estatisticas.ts

import { IDataApoio, IRelatorioRow } from '../services/api';

const CRBM_LIST = [
  '1º CRBM',
  '2º CRBM',
  '3º CRBM',
  '4º CRBM',
  '5º CRBM',
  '6º CRBM',
  '7º CRBM',
  '8º CRBM',
  '9º CRBM',
] as const;

const FIELDS_TO_STRING: Array<keyof IRelatorioRow> = [
  'diurno',
  'noturno',
  'total_capital',
  ...CRBM_LIST,
  'total_geral',
];

const GRUPO_ORDER = [
  'Resgate',
  'Incêndio',
  'Busca e Salvamento',
  'Ações Preventivas',
  'Atividades Técnicas',
  'Produtos Perigosos',
  'Defesa Civil',
];

const collator = new Intl.Collator('pt-BR', { sensitivity: 'accent' });

const sanitize = (value?: string | null): string => (value ?? '').trim();

const naturezaKey = (grupo?: string | null, subgrupo?: string | null): string => {
  const grupoSanitized = sanitize(grupo);
  const subgrupoSanitized = sanitize(subgrupo);
  return `${grupoSanitized.toLocaleLowerCase('pt-BR')}|${subgrupoSanitized.toLocaleLowerCase('pt-BR')}`;
};

const ensureStringFields = (row: IRelatorioRow): IRelatorioRow => {
  const result: Record<string, string> = {
    grupo: sanitize(row.grupo) || 'N/A',
    subgrupo: sanitize(row.subgrupo) || 'N/A',
  };

  FIELDS_TO_STRING.forEach((field) => {
    const rawValue = (row as Record<string, unknown>)[field];
    result[field] = rawValue === undefined || rawValue === null ? '0' : String(rawValue);
  });

  return result as IRelatorioRow;
};

const buildEmptyRow = (natureza: IDataApoio): IRelatorioRow => {
  const grupo = sanitize(natureza.grupo) || 'N/A';
  const subgrupo = sanitize(natureza.subgrupo) || 'N/A';

  const baseValues: Record<string, string> = {};
  FIELDS_TO_STRING.forEach((field) => {
    baseValues[field] = '0';
  });

  return {
    grupo,
    subgrupo,
    ...baseValues,
  } as IRelatorioRow;
};

const sortRows = (rows: IRelatorioRow[]): IRelatorioRow[] => {
  return [...rows].sort((a, b) => {
    const indexA = GRUPO_ORDER.indexOf(a.grupo);
    const indexB = GRUPO_ORDER.indexOf(b.grupo);

    const safeIndexA = indexA === -1 ? GRUPO_ORDER.length : indexA;
    const safeIndexB = indexB === -1 ? GRUPO_ORDER.length : indexB;

    if (safeIndexA !== safeIndexB) return safeIndexA - safeIndexB;

    const grupoComparison = collator.compare(a.grupo, b.grupo);
    if (grupoComparison !== 0) return grupoComparison;

    return collator.compare(a.subgrupo, b.subgrupo);
  });
};

export const mergeEstatisticasWithNaturezas = (
  estatisticas: IRelatorioRow[],
  naturezas: IDataApoio[],
): IRelatorioRow[] => {
  const map = new Map<string, IRelatorioRow>();

  estatisticas.forEach((row) => {
    if (!row?.grupo || !row?.subgrupo) return;
    map.set(naturezaKey(row.grupo, row.subgrupo), ensureStringFields(row));
  });

  naturezas
    .filter((natureza) => {
      const grupo = sanitize(natureza.grupo);
      const subgrupo = sanitize(natureza.subgrupo);
      return grupo.length > 0 && subgrupo.length > 0 && grupo !== 'Relatório de Óbitos';
    })
    .forEach((natureza) => {
      const key = naturezaKey(natureza.grupo, natureza.subgrupo);
      if (!map.has(key)) {
        map.set(key, buildEmptyRow(natureza));
      }
    });

  return sortRows(Array.from(map.values()));
};

export const CRBM_HEADERS: Array<keyof IRelatorioRow> = [...CRBM_LIST];

