/**
 * 시간 계산기(/tools/time-calc/) — 시작 일시 ± 일·시간·분, 두 일시 사이 몇 시간.
 *
 * 일시는 전부 '1970-01-01 00:00 부터 센 분' 정수 하나로 다룬다(일 번호 × 1440 + 시 × 60 + 분).
 * 달력 날짜 → 일 번호는 date-calc 의 toDay/fromDay(Date.UTC 기반)를 써서 기기 시간대가 새어 들지 않는다.
 * 서머타임 없는 벽시계 산술 — 한국 표준시(UTC+9 고정, rates/unix-time-2026.json 의 표준시법)와 같은 셈.
 *
 * 정한 규칙(테스트로 고정):
 * - 더하는 기간은 0 이상의 정수 일·시간·분. 시간·분이 넘쳐도 그대로 더한다(30시간 90분 = 1일 7시간 30분).
 * - 결과 범위 1900-01-01 00:00 ~ 9999-12-30 23:59 — 밖이면 오류(날짜 입력 칸에 맞춤).
 * - 두 일시 사이: 끝 − 시작. 끝이 더 이르면 크기는 같게 보여 주고 sign = −1 로 알린다.
 */
import { toDay, fromDay, weekday, WEEKDAYS } from "./date-calc";

export const MIN_PER_DAY = 1440;
export const MIN_AT = (toDay("1900-01-01") as number) * MIN_PER_DAY;
export const MAX_AT = (toDay("9999-12-30") as number) * MIN_PER_DAY + MIN_PER_DAY - 1;

/** 'YYYY-MM-DD' + 'HH:MM'(초가 붙어 있으면 버림) → 분 번호. 없는 날짜·형식 오류·범위 밖이면 null */
export function parseAt(date: string, time: string): number | null {
  const day = toDay(date);
  if (day === null) return null;
  const m = /^(\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/.exec(time.trim());
  if (!m) return null;
  const [h, mi] = [Number(m[1]), Number(m[2])];
  if (h > 23 || mi > 59) return null;
  const at = day * MIN_PER_DAY + h * 60 + mi;
  return at >= MIN_AT && at <= MAX_AT ? at : null;
}

/** 일·시간·분 입력 → 총 분. 빈 칸은 0, 음수·소수·숫자 아님은 null */
export function toMinutes(days: string, hours: string, minutes: string): number | null {
  let total = 0;
  for (const [raw, mul] of [[days, MIN_PER_DAY], [hours, 60], [minutes, 1]] as const) {
    const s = raw.replace(/[\s,]/g, "");
    if (s === "") continue;
    if (!/^\d+$/.test(s)) return null;
    total += Number(s) * mul;
  }
  return Number.isSafeInteger(total) ? total : null;
}

/** 시작 ± 기간. 범위 밖이면 null */
export function shiftAt(start: number, minutes: number, sign: 1 | -1): number | null {
  const at = start + sign * minutes;
  return at >= MIN_AT && at <= MAX_AT ? at : null;
}

export interface Split {
  d: number;
  h: number;
  m: number;
}

/** 총 분(0 이상) → 일·시간·분 */
export function split(total: number): Split {
  const d = Math.floor(total / MIN_PER_DAY);
  const rest = total - d * MIN_PER_DAY;
  return { d, h: Math.floor(rest / 60), m: rest % 60 };
}

/** '1일 7시간 30분' — 0인 단위는 빼고, 전부 0이면 '0분' */
export function splitText(total: number): string {
  const { d, h, m } = split(total);
  const parts: string[] = [];
  if (d) parts.push(`${d.toLocaleString("ko-KR")}일`);
  if (h) parts.push(`${h}시간`);
  if (m || !parts.length) parts.push(`${m}분`);
  return parts.join(" ");
}

export interface AtParts {
  date: string;
  time: string;
  wd: number;
}

const p2 = (n: number) => String(n).padStart(2, "0");

/** 분 번호 → 날짜 칸 값 · 'HH:MM' · 요일 */
export function atParts(at: number): AtParts {
  const day = Math.floor(at / MIN_PER_DAY);
  const rest = at - day * MIN_PER_DAY;
  return { date: fromDay(day), time: `${p2(Math.floor(rest / 60))}:${p2(rest % 60)}`, wd: weekday(day) };
}

/** '2026년 10월 19일 (월) 12:15' */
export function atText(at: number): string {
  const p = atParts(at);
  const [y, mo, d] = p.date.split("-").map(Number);
  return `${y}년 ${mo}월 ${d}일 (${WEEKDAYS[p.wd]}) ${p.time}`;
}

/** 오전·오후 12시간제 — 0시는 '오전 12:05', 12시는 '오후 12:05' */
export function ampmText(at: number): string {
  const rest = ((at % MIN_PER_DAY) + MIN_PER_DAY) % MIN_PER_DAY;
  const h = Math.floor(rest / 60);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h < 12 ? "오전" : "오후"} ${h12}:${p2(rest % 60)}`;
}

/** 결과 날짜가 시작 날짜에서 며칠 옮겨 갔나 — '같은 날' · '다음 날' · '3일 뒤' · '전날' · '2일 전' */
export function dayShiftText(start: number, end: number): string {
  const n = Math.floor(end / MIN_PER_DAY) - Math.floor(start / MIN_PER_DAY);
  if (n === 0) return "같은 날";
  if (n === 1) return "다음 날";
  if (n === -1) return "전날";
  return n > 0 ? `${n.toLocaleString("ko-KR")}일 뒤` : `${(-n).toLocaleString("ko-KR")}일 전`;
}

export interface Between {
  /** 1 = 끝이 시작보다 늦거나 같음, −1 = 끝이 더 이름 */
  sign: 1 | -1;
  total: number;
  split: Split;
  /** 총 시간(소수 둘째 자리 반올림 전 값) */
  hours: number;
}

/** 두 일시 사이 — 끝 − 시작 */
export function between(start: number, end: number): Between {
  const diff = end - start;
  const total = Math.abs(diff);
  return { sign: diff < 0 ? -1 : 1, total, split: split(total), hours: total / 60 };
}

/** 총 시간 표기 — 소수 둘째 자리까지, 끝의 0은 뺌(450분 → '7.5') */
export function hoursText(total: number): string {
  const v = Math.round((total / 60) * 100) / 100;
  return v.toLocaleString("ko-KR", { maximumFractionDigits: 2 });
}
