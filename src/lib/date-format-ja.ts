/**
 * 날짜 계산기 일본어판(/ja/tools/date-diff/) 표기 — 계산은 date-calc.ts 그대로, 말만 일본어.
 * 한국어판 label·spanText·dday 는 한국어를 내서 고치지 않고 여기 따로 둔다.
 *
 *   2026年10月19日（月） · 1年2か月3日 · あと12日 / 今日 / 3日前
 *
 * 和暦(令和) 표기는 넣지 않았다 — 元号 정령 원문을 아직 확인하지 않았다.
 */
import { fromDay, weekday, type Span } from "./date-calc";

export const WEEKDAYS_JA = ["日", "月", "火", "水", "木", "金", "土"] as const;

/** '2026年10月19日（月）' */
export function labelJa(n: number): string {
  const [y, m, d] = fromDay(n).split("-").map(Number);
  return `${y}年${m}月${d}日（${WEEKDAYS_JA[weekday(n)]}）`;
}

/** '1年2か月3日' — 0인 칸은 뺀다. 전부 0이면 '0日' */
export function spanTextJa(s: Pick<Span, "years" | "months" | "restDays">): string {
  const parts: string[] = [];
  if (s.years) parts.push(`${s.years}年`);
  if (s.months) parts.push(`${s.months}か月`);
  if (s.restDays || parts.length === 0) parts.push(`${s.restDays}日`);
  return parts.join("");
}

/** 오늘과의 차이 → 'あと12日' · '今日' · '3日前' */
export function ddayJa(target: number, today: number): string {
  const d = target - today;
  if (d === 0) return "今日";
  return d > 0 ? `あと${d.toLocaleString("ja-JP")}日` : `${(-d).toLocaleString("ja-JP")}日前`;
}
