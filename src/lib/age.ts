/**
 * 만 나이 계산기(/tools/age/) — 생년월일 · 기준일 → 만 나이 · 연 나이 · 세는 나이 · 개월 수 · 살아온 날.
 *
 * 원문(rates/age-2026.json):
 * - 민법 제158조 — 나이는 출생일을 산입해 만 나이로 계산하고 연수로 표시. 1세 미만은 월수로 표시할 수 있다.
 * - 행정기본법 제7조의2 — 행정에 관한 나이도 같다(다른 법령에 특별한 규정이 있으면 그 규정).
 * - 민법 제160조 ② 연·월로 정한 기간은 마지막 해·달에서 기산일에 해당한 날의 전날로 끝난다.
 *   ③ 마지막 달에 해당일이 없으면 그 달 말일로 끝난다.
 *
 * 정한 규칙(테스트로 고정):
 * - 출생일을 첫날로 세므로 n세 기간은 n번째 생일 전날에 끝난다 → 생일 당일부터 한 살 더.
 * - 2월 29일생은 평년에 2월 28일로 기간이 끝나(제160조 ③) 3월 1일부터 한 살 더. 개월 수도 같은 식(31일생은 30일까지인 달에 다음 달 1일부터).
 * - 연 나이 = 기준 연도 − 출생 연도(청소년 보호법 제2조 제1호처럼 '그 해 1월 1일' 기준으로 쓰는 법이 있다). 세는 나이 = 연 나이 + 1(관습, 법 근거 없음).
 * - 살아온 날 = 기준일 − 출생일. 출생일을 1일째로 세는 날은 + 1.
 */
import { toDay } from "./date-calc";

const DAY_MS = 86_400_000;

function ymd(n: number): [number, number, number] {
  const d = new Date(n * DAY_MS);
  return [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()];
}

function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/**
 * 출생일 d 일인 사람이 y년 m월에 '한 달(한 해) 더 차는 날'.
 * 그 달에 d 일이 있으면 그날, 없으면(제160조 ③ — 말일로 끝남) 다음 달 1일.
 */
function turnDay(y: number, m: number, d: number): number {
  if (d <= daysInMonth(y, m)) return Date.UTC(y, m - 1, d) / DAY_MS;
  return Date.UTC(y, m, 1) / DAY_MS;
}

export interface Age {
  /** 만 나이(세) */
  years: number;
  /** 출생부터 찬 개월 수 전체 */
  totalMonths: number;
  /** 만 나이 뒤에 남는 개월 · 일 (만 3세 4개월 12일) */
  months: number;
  days: number;
  /** 연 나이 = 기준 연도 − 출생 연도 */
  yearAge: number;
  /** 세는 나이 = 연 나이 + 1 */
  koreanAge: number;
  /** 기준일 − 출생일 */
  livedDays: number;
  /** 출생일을 1일째로 센 날 */
  dayCount: number;
  /** 기준일이 한 살 더 먹는 날인가(0세 출생일 제외) */
  turnsToday: boolean;
  /** 다음에 한 살 더 먹는 날(기준일 뒤) · 그때 만 나이 · 남은 날 */
  next: number;
  nextAge: number;
  daysToNext: number;
}

/** 생년월일·기준일(일련번호) → 나이. 출생일이 기준일보다 뒤면 null */
export function age(birth: number, base: number): Age | null {
  if (birth > base) return null;
  const [by, bm, bd] = ymd(birth);
  const [y, m] = ymd(base);

  let years = y - by;
  if (base < turnDay(y, bm, bd)) years--;

  let totalMonths = (y - by) * 12 + (m - bm);
  if (base < turnDay(y, m, bd)) totalMonths--;
  const idx = by * 12 + (bm - 1) + totalMonths; // 마지막으로 한 달 찬 달
  const lastTurn = totalMonths === 0 ? birth : turnDay(Math.floor(idx / 12), (idx % 12) + 1, bd);

  const thisYearTurn = turnDay(y, bm, bd);
  const next = base < thisYearTurn ? thisYearTurn : turnDay(y + 1, bm, bd);

  const yearAge = y - by;
  return {
    years,
    totalMonths,
    months: totalMonths - years * 12,
    days: base - lastTurn,
    yearAge,
    koreanAge: yearAge + 1,
    livedDays: base - birth,
    dayCount: base - birth + 1,
    turnsToday: years > 0 && base === turnDay(y, bm, bd),
    next,
    nextAge: years + 1,
    daysToNext: next - base,
  };
}

/** 만 n세가 되는 날(출생일 기준). 2/29생은 평년이면 3/1 */
export function dayOfAge(birth: number, n: number): number {
  const [by, bm, bd] = ymd(birth);
  return turnDay(by + n, bm, bd);
}

/** 'YYYY-MM-DD' 둘 → 나이. 날짜가 틀리면 null */
export function ageOf(birth: string, base: string): Age | null {
  const b = toDay(birth);
  const t = toDay(base);
  if (b === null || t === null) return null;
  return age(b, t);
}
