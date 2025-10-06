import { endOfDay, parseISO, startOfDay } from "date-fns";
import { format as formatTz, fromZonedTime, toZonedTime } from "date-fns-tz";

// Timezone padrão - pode ser configurado dinamicamente baseado na localização do usuário
export const DEFAULT_TIMEZONE = "America/Sao_Paulo";

/**
 * Converte uma data local para UTC mantendo o horário local
 * Útil para salvar no banco de dados
 */
export function toUTC(
  date: Date | string,
  timezone: string = DEFAULT_TIMEZONE
): Date {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return fromZonedTime(dateObj, timezone);
}

/**
 * Converte uma data UTC para o timezone local
 * Útil para exibir datas vindas do banco
 */
export function fromUTC(
  date: Date | string,
  timezone: string = DEFAULT_TIMEZONE
): Date {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return toZonedTime(dateObj, timezone);
}

/**
 * Cria uma data no início do dia no timezone especificado
 */
export function startOfDayInTimezone(
  date: Date,
  timezone: string = DEFAULT_TIMEZONE
): Date {
  const zonedDate = toZonedTime(date, timezone);
  const startOfDayZoned = startOfDay(zonedDate);
  return fromZonedTime(startOfDayZoned, timezone);
}

/**
 * Cria uma data no final do dia no timezone especificado
 */
export function endOfDayInTimezone(
  date: Date,
  timezone: string = DEFAULT_TIMEZONE
): Date {
  const zonedDate = toZonedTime(date, timezone);
  const endOfDayZoned = endOfDay(zonedDate);
  return fromZonedTime(endOfDayZoned, timezone);
}

/**
 * Formata uma data para exibição no timezone local
 */
export function formatInTimezone(
  date: Date | string,
  formatStr: string,
  timezone: string = DEFAULT_TIMEZONE
): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return formatTz(dateObj, formatStr, { timeZone: timezone });
}

/**
 * Converte uma data para ISO string no timezone correto
 * Útil para enviar para APIs
 */
export function toISOStringInTimezone(
  date: Date,
  timezone: string = DEFAULT_TIMEZONE
): string {
  return toUTC(date, timezone).toISOString();
}

/**
 * Cria uma data a partir de uma string ISO considerando o timezone
 */
export function fromISOStringInTimezone(
  isoString: string,
  timezone: string = DEFAULT_TIMEZONE
): Date {
  return fromUTC(isoString, timezone);
}

/**
 * Obtém o timezone do usuário automaticamente
 * Para o backend, usamos o timezone padrão ou podemos receber via header
 */
export function getUserTimezone(request?: any): string {
  // Se tivermos acesso ao request, podemos extrair o timezone do header
  if (request?.headers?.["x-timezone"]) {
    return request.headers["x-timezone"];
  }

  try {
    // Fallback para o timezone padrão
    return DEFAULT_TIMEZONE;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

/**
 * Normaliza qualquer entrada de data para UTC
 * Lida com diferentes formatos: Date, string ISO, string com timezone, etc.
 */
export function normalizeToUTC(date: Date | string): Date {
  if (typeof date === "string") {
    // Se for string, tenta fazer parse ISO primeiro
    const parsed = parseISO(date);
    // Se o parse falhou ou resultou em data inválida, tenta Date constructor
    if (isNaN(parsed.getTime())) {
      const fallback = new Date(date);
      if (isNaN(fallback.getTime())) {
        throw new Error(`Data inválida: ${date}`);
      }
      return fallback;
    }
    return parsed;
  }

  // Se já for Date, retorna como está (assumindo que já está em UTC ou será tratado)
  return date;
}

/**
 * Cria uma data "limpa" (sem horário) no timezone local
 * Útil para comparações de data
 */
export function createCleanDate(
  year: number,
  month: number,
  day: number,
  timezone: string = DEFAULT_TIMEZONE
): Date {
  const localDate = new Date(year, month - 1, day);
  return startOfDayInTimezone(localDate, timezone);
}

/**
 * Verifica se duas datas são do mesmo dia no timezone especificado
 */
export function isSameDayInTimezone(
  date1: Date | string,
  date2: Date | string,
  timezone: string = DEFAULT_TIMEZONE
): boolean {
  const d1 = fromUTC(date1, timezone);
  const d2 = fromUTC(date2, timezone);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Processa datas recebidas do frontend
 * Converte qualquer formato de data para UTC primeiro, depois para o timezone do usuário
 */
export function processIncomingDate(
  date: Date | string,
  timezone: string = DEFAULT_TIMEZONE
): Date {
  // 1. Normalizar qualquer entrada para UTC
  const utcDate = normalizeToUTC(date);

  // 2. Converter de UTC para o timezone do usuário
  return toZonedTime(utcDate, timezone);
}

/**
 * Processa datas para envio ao frontend (converte para UTC)
 */
export function processOutgoingDate(
  date: Date,
  timezone: string = DEFAULT_TIMEZONE
): Date {
  // Converte a data local para UTC antes de enviar ao frontend
  return toUTC(date, timezone);
}
