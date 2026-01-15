// api/src/utils/date.ts

export class BadRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BadRequestError';
  }
}

/**
 * Aceita datas em:
 *  - ISO somente data: YYYY-MM-DD
 *  - ISO completa: 2025-10-08T00:00:00Z (ou similar)
 *  - Formato brasileiro: DD/MM/YYYY
 *  - Variação com barra ou hífen: DD-MM-YYYY, YYYY/MM/DD
 * Retorna um objeto Date (no horário local) ou lança BadRequestError se inválida.
 */
export function parseDateParam(value: unknown, paramName = 'data'): Date {
  if (typeof value !== 'string' || !value.trim()) {
    throw new BadRequestError(`O parâmetro "${paramName}" é obrigatório.`);
  }

  const raw = value.trim();

  // DD/MM/YYYY ou DD-MM-YYYY
  const brMatch = raw.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
  if (brMatch) {
    const [, ddStr, mmStr, yyyyStr] = brMatch;
    const dd = Number(ddStr);
    const mm = Number(mmStr);
    const yyyy = Number(yyyyStr);
    if (!isValidYMD(yyyy, mm, dd)) {
      throw new BadRequestError(
        `Formato de data inválido em "${paramName}". Use YYYY-MM-DD ou DD/MM/YYYY.`
      );
    }
    return new Date(yyyy, mm - 1, dd);
  }

  // YYYY-MM-DD ou YYYY/MM/DD
  const isoDateOnly = raw.match(/^(\d{4})[\/\-](\d{2})[\/\-](\d{2})$/);
  if (isoDateOnly) {
    const [, yyyyStr, mmStr, ddStr] = isoDateOnly;
    const dd = Number(ddStr);
    const mm = Number(mmStr);
    const yyyy = Number(yyyyStr);
    if (!isValidYMD(yyyy, mm, dd)) {
      throw new BadRequestError(
        `Formato de data inválido em "${paramName}". Use YYYY-MM-DD ou DD/MM/YYYY.`
      );
    }
    return new Date(yyyy, mm - 1, dd);
  }

  // Tenta parse nativo (ISO completo etc.)
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    throw new BadRequestError(
      `Formato de data inválido em "${paramName}". Use YYYY-MM-DD ou DD/MM/YYYY.`
    );
  }
  return d;
}

function isValidYMD(y: number, m: number, d: number): boolean {
  if (y < 1900 || m < 1 || m > 12 || d < 1 || d > 31) return false;
  const test = new Date(y, m - 1, d);
  return (
    test.getFullYear() === y &&
    test.getMonth() === m - 1 &&
    test.getDate() === d
  );
}

