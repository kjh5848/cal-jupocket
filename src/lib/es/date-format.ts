/**
 * 날짜 계산기 스페인판(/es/tools/date-diff/) 표기 — 계산은 date-calc.ts 그대로, 말만 스페인어.
 * Intl 은 Node·브라우저 ICU 판마다 약어·쉼표가 달라질 수 있어 요일·월 이름을 손으로 붙인다.
 *
 *   martes, 20 de octubre de 2026 · 1 año, 2 meses y 3 días · dentro de 12 días / hoy / hace 3 días
 *
 * 숫자는 src/lib/es/number.ts 표기(다섯 자리 이상이면 세 자리마다 공백 — RD 2032/2009 Anexo III 2.9).
 */
import { fromDay, weekday, type Span } from "../date-calc";
import { formatNumberEs } from "./number";

export const WEEKDAYS_ES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"] as const;
export const MONTHS_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
] as const;

/** 단수·복수 — 'mes' 처럼 -es 로 끝나는 말이 있어 두 꼴을 다 받는다. */
export function pluralEs(v: number, one: string, many: string): string {
  return `${formatNumberEs(v)} ${v === 1 ? one : many}`;
}

export const daysEs = (v: number) => pluralEs(v, "día", "días");
export const weeksEs = (v: number) => pluralEs(v, "semana", "semanas");

/** 'martes, 20 de octubre de 2026' */
export function labelEs(n: number): string {
  const [y, m, d] = fromDay(n).split("-").map(Number);
  return `${WEEKDAYS_ES[weekday(n)]}, ${d} de ${MONTHS_ES[m - 1]} de ${y}`;
}

/** '1 año, 2 meses y 3 días' — 0인 칸은 뺀다. 전부 0이면 '0 días' */
export function spanTextEs(s: Pick<Span, "years" | "months" | "restDays">): string {
  const parts: string[] = [];
  if (s.years) parts.push(pluralEs(s.years, "año", "años"));
  if (s.months) parts.push(pluralEs(s.months, "mes", "meses"));
  if (s.restDays || parts.length === 0) parts.push(daysEs(s.restDays));
  return parts.length > 1 ? `${parts.slice(0, -1).join(", ")} y ${parts[parts.length - 1]}` : parts[0];
}

/** 'N semanas y M días' */
export function weekTextEs(s: Pick<Span, "weeks" | "weekRest">): string {
  return `${weeksEs(s.weeks)} y ${daysEs(s.weekRest)}`;
}

/** 오늘과의 차이 → 'dentro de 12 días' · 'hoy' · 'hace 3 días' */
export function ddayEs(target: number, today: number): string {
  const d = target - today;
  if (d === 0) return "hoy";
  return d > 0 ? `dentro de ${daysEs(d)}` : `hace ${daysEs(-d)}`;
}

/**
 * 디데이 남은 시간 — '64 días, 3 horas y 5 minutos' · 하루 미만이면 '3 horas, 5 minutos y 9 segundos'.
 * 숫자는 formatNumberEs(다섯 자리부터 공백), 1만 단수.
 */
export function durationTextEs(sec: number): string {
  const s = Math.abs(Math.trunc(sec));
  const day = Math.floor(s / 86_400);
  const h = Math.floor((s % 86_400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const hours = pluralEs(h, "hora", "horas");
  const mins = pluralEs(m, "minuto", "minutos");
  if (day > 0) return `${daysEs(day)}, ${hours} y ${mins}`;
  return `${hours}, ${mins} y ${pluralEs(s % 60, "segundo", "segundos")}`;
}
