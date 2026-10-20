/**
 * 날짜 계산기 프랑스어판(/fr/tools/date-diff/) 표기 — 계산은 date-calc.ts 그대로, 말만 프랑스어.
 *
 *   mar. 20 octobre 2026 · 1 an, 2 mois et 3 jours · dans 12 jours / aujourd'hui / il y a 3 jours
 *
 * 하루 번호는 UTC 자정이라 timeZone "UTC" 필수(없으면 서쪽 시간대 방문자에게 하루 앞 날짜가 보인다).
 * 복수: 프랑스어는 0·1 이 단수(0 jour, 1 jour), 2 부터 복수. mois 는 단복수 같음.
 */
import type { Span } from "../date-calc";

/** 정수 → '1 234' (fr-FR, 천 단위 좁은 공백) */
export const nFr = (v: number) => v.toLocaleString("fr-FR");

/** 'mar. 20 octobre 2026' */
export function labelFr(d: number): string {
  return new Date(d * 86_400_000).toLocaleDateString("fr-FR", {
    timeZone: "UTC",
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** 3 → '3 jours', 1 → '1 jour', 0 → '0 jour' */
export function pluralFr(v: number, one: string, many = `${one}s`): string {
  return `${nFr(v)} ${Math.abs(v) < 2 ? one : many}`;
}

export const joursFr = (v: number) => pluralFr(v, "jour");
export const semainesFr = (v: number) => pluralFr(v, "semaine");

/** '1 an, 2 mois et 3 jours' — 0인 칸은 뺀다. 전부 0이면 '0 jour' */
export function spanTextFr(s: Pick<Span, "years" | "months" | "restDays">): string {
  const parts: string[] = [];
  if (s.years) parts.push(pluralFr(s.years, "an"));
  if (s.months) parts.push(pluralFr(s.months, "mois", "mois"));
  if (s.restDays || parts.length === 0) parts.push(joursFr(s.restDays));
  return parts.length > 1 ? `${parts.slice(0, -1).join(", ")} et ${parts[parts.length - 1]}` : parts[0];
}

/** 오늘과의 차이 → 'dans 12 jours' · "aujourd'hui" · 'il y a 3 jours' */
export function ddayFr(target: number, today: number): string {
  const d = target - today;
  if (d === 0) return "aujourd’hui";
  return d > 0 ? `dans ${joursFr(d)}` : `il y a ${joursFr(-d)}`;
}
