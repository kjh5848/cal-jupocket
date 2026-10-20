/**
 * 날짜 계산기 독일어판(/de/tools/date-diff/) 표기 — 계산은 date-calc.ts 그대로, 말만 독일어.
 *
 *   Dienstag, 20. Oktober 2026 · 20.10.2026 · 1 Jahr, 2 Monate und 3 Tage · in 12 Tagen / heute / vor 3 Tagen
 *
 * 날짜 꼴은 독일 법령 원문을 따른다 — BGB 머리 "vom 2. Januar 2002"(긴 꼴)·"Ausfertigungsdatum: 18.08.1896"(숫자 꼴)
 * (https://www.gesetze-im-internet.de/bgb/BJNR001950896.html, 확인 2026-10-21).
 * 천 단위는 percent 와 같이 줄바꿈 없는 공백(§ 32a EStG "12 348 Euro") — Intl de-DE 의 점(1.234)은 쓰지 않는다.
 * Intl 을 쓰지 않아 브라우저마다 요일 줄임말(Di./Di)이 달라지는 일이 없다.
 */
import { fromDay, weekday, type Span } from "../date-calc";

export const WEEKDAYS_DE = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"] as const;
export const MONTHS_DE = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
] as const;

/** 정수 → '12 348' (천 단위 줄바꿈 없는 공백) */
export function intDe(v: number): string {
  const s = String(Math.abs(Math.trunc(v))).replace(/\B(?=(\d{3})+$)/g, " ");
  return v < 0 ? `-${s}` : s;
}

/** 'Dienstag, 20. Oktober 2026' */
export function labelDe(n: number): string {
  const [y, m, d] = fromDay(n).split("-").map(Number);
  return `${WEEKDAYS_DE[weekday(n)]}, ${d}. ${MONTHS_DE[m - 1]} ${y}`;
}

/** '20.10.2026' */
export function shortDe(n: number): string {
  const [y, m, d] = fromDay(n).split("-");
  return `${d}.${m}.${y}`;
}

const FORMS = {
  day: ["Tag", "Tage"],
  week: ["Woche", "Wochen"],
  month: ["Monat", "Monate"],
  year: ["Jahr", "Jahre"],
} as const;
export type UnitDe = keyof typeof FORMS;

/** 1 Tag · 2 Tage · 1 Woche · 3 Monate */
export function countDe(v: number, unit: UnitDe): string {
  return `${intDe(v)} ${FORMS[unit][Math.abs(v) === 1 ? 0 : 1]}`;
}

/** '1 Jahr, 2 Monate und 3 Tage' — 0인 칸은 뺀다. 전부 0이면 '0 Tage' */
export function spanTextDe(s: Pick<Span, "years" | "months" | "restDays">): string {
  const parts: string[] = [];
  if (s.years) parts.push(countDe(s.years, "year"));
  if (s.months) parts.push(countDe(s.months, "month"));
  if (s.restDays || parts.length === 0) parts.push(countDe(s.restDays, "day"));
  return parts.length > 1 ? `${parts.slice(0, -1).join(", ")} und ${parts[parts.length - 1]}` : parts[0];
}

/** '6 Wochen und 2 Tage' · '6 Wochen' · '3 Tage' */
export function weeksTextDe(weeks: number, rest: number): string {
  if (!weeks) return countDe(rest, "day");
  return rest ? `${countDe(weeks, "week")} und ${countDe(rest, "day")}` : countDe(weeks, "week");
}

/** 오늘과의 차이 → 'in 12 Tagen' · 'heute' · 'vor 3 Tagen' (여격 Tagen, 1이면 Tag) */
export function relDe(target: number, today: number): string {
  const d = target - today;
  if (d === 0) return "heute";
  const k = Math.abs(d);
  const w = `${intDe(k)} ${k === 1 ? "Tag" : "Tagen"}`;
  return d > 0 ? `in ${w}` : `vor ${w}`;
}
