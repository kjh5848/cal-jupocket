/**
 * 유닉스 타임스탬프 변환기(/tools/unix-time/) — 타임스탬프 ↔ 날짜·시각.
 *
 * 시각은 전부 '1970-01-01 00:00:00 UTC 부터 센 밀리초' 정수 하나로 다룬다(POSIX 4.19 — 하루 = 86400초).
 * 시간대는 'UTC 보다 몇 분 빠른가'(offsetMin) 숫자로만 받는다. KST 는 540 고정(표준시법 — 동경 135도).
 * 기기 시간대가 결과에 새어 들지 않게 new Date(y, m, d)·getHours() 는 쓰지 않고 Date.UTC·getUTC* 만 쓴다.
 *
 * 정한 규칙(테스트로 고정, rates/unix-time-2026.json):
 * - 자동 판별: 소수점이 있으면 초. 정수는 부호 뺀 자릿수 11자리 이하 → 초, 12자리 이상 → 밀리초.
 * - 초는 소수 셋째 자리(밀리초)까지, 밀리초는 정수만. 쉼표·공백·밑줄은 자릿수 구분으로 보고 지운다.
 * - 소수 초 → 밀리초는 곱셈이 아니라 문자열 자릿수로 바꾼다(1792380896.789 × 1000 의 부동소수 오차를 피함).
 * - 음수(1970년 이전)는 하루 86400초를 거꾸로 늘려 센다. 나누기는 버림(floor) — −1ms 는 23:59:59.999.
 * - 범위: 1900-01-01 00:00 UTC 이상, 9999-12-31 00:00 UTC 미만.
 */
import { toDay, weekday, WEEKDAYS } from "./date-calc";
import { WEEKDAYS_JA } from "./date-format-ja";
import rates from "../rates/unix-time-2026.json";

export type Unit = "auto" | "s" | "ms";
export const KST = rates.kstOffsetMinutes;
export const MIN_MS = Date.UTC(1900, 0, 1);
export const MAX_MS = Date.UTC(9999, 11, 31) - 1;
/** 32비트 부호 있는 정수로 담을 수 있는 가장 큰 초 — 2038-01-19 03:14:07 UTC */
export const INT32_MAX = 2_147_483_647;

export type Parsed =
  | { ok: true; ms: number; unit: "s" | "ms" }
  | { ok: false; error: "empty" | "format" | "ms-fraction" | "too-precise" | "range" };

/** 입력 문자열 → 밀리초 정수 */
export function parseTimestamp(raw: string, unit: Unit = "auto"): Parsed {
  const s = raw.replace(/[\s,_]/g, "");
  if (s === "") return { ok: false, error: "empty" };
  const m = /^([+-]?)(\d+)(?:\.(\d+))?$/.exec(s);
  if (!m) return { ok: false, error: "format" };
  const [, sign, intPart, frac] = m;
  const digits = intPart.replace(/^0+(?=\d)/, "").length;
  const u: "s" | "ms" = unit !== "auto" ? unit : frac !== undefined || digits <= 11 ? "s" : "ms";
  if (u === "ms" && frac !== undefined) return { ok: false, error: "ms-fraction" };
  if (frac !== undefined && frac.length > 3) return { ok: false, error: "too-precise" };
  if (digits > 16) return { ok: false, error: "range" };
  const absMs = u === "ms" ? Number(intPart) : Number(intPart + (frac ?? "").padEnd(3, "0"));
  const ms = sign === "-" ? -absMs : absMs;
  if (!(ms >= MIN_MS && ms <= MAX_MS)) return { ok: false, error: "range" };
  return { ok: true, ms: ms === 0 ? 0 : ms, unit: u };
}

export interface Parts {
  y: number;
  mo: number;
  d: number;
  h: number;
  mi: number;
  s: number;
  ms: number;
  /** 0 = 일요일 */
  wd: number;
}

/** 밀리초 + 시간대(UTC 보다 몇 분 빠른가) → 그 시간대의 날짜·시각 */
export function toParts(ms: number, offsetMin: number): Parts {
  const t = new Date(ms + offsetMin * 60_000);
  const y = t.getUTCFullYear();
  const mo = t.getUTCMonth() + 1;
  const d = t.getUTCDate();
  return {
    y, mo, d,
    h: t.getUTCHours(),
    mi: t.getUTCMinutes(),
    s: t.getUTCSeconds(),
    ms: t.getUTCMilliseconds(),
    wd: weekday(Math.floor((ms + offsetMin * 60_000) / 86_400_000)),
  };
}

const p2 = (n: number) => String(n).padStart(2, "0");
const p3 = (n: number) => String(n).padStart(3, "0");

/** 'YYYY-MM-DD' (날짜 입력 칸 값) */
export function dateValue(p: Parts): string {
  return `${String(p.y).padStart(4, "0")}-${p2(p.mo)}-${p2(p.d)}`;
}

/** 'HH:MM:SS' (시각 입력 칸 값) */
export function timeValue(p: Parts): string {
  return `${p2(p.h)}:${p2(p.mi)}:${p2(p.s)}`;
}

/** '2026년 10월 19일 (월) 12:34:56' — 밀리초가 0이 아니면 '.789' 를 붙인다 */
export function koText(p: Parts): string {
  const frac = p.ms ? `.${p3(p.ms)}` : "";
  return `${p.y}년 ${p.mo}월 ${p.d}일 (${WEEKDAYS[p.wd]}) ${p2(p.h)}:${p2(p.mi)}:${p2(p.s)}${frac}`;
}

/** 일본어판(/ja/tools/unix-time/) — '2026年10月19日（月）12:34:56' */
export function jaText(p: Parts): string {
  const frac = p.ms ? `.${p3(p.ms)}` : "";
  return `${p.y}年${p.mo}月${p.d}日（${WEEKDAYS_JA[p.wd]}）${p2(p.h)}:${p2(p.mi)}:${p2(p.s)}${frac}`;
}

/** 'UTC+09:00' 꼴 */
export function offsetText(offsetMin: number): string {
  const sign = offsetMin < 0 ? "-" : "+";
  const a = Math.abs(offsetMin);
  return `UTC${sign}${p2(Math.floor(a / 60))}:${p2(a % 60)}`;
}

/** ISO 8601 — UTC 는 'Z', 그 밖은 '+09:00' 같은 오프셋을 붙인다 */
export function isoText(ms: number, offsetMin: number): string {
  const p = toParts(ms, offsetMin);
  const tail = offsetMin === 0 ? "Z" : offsetText(offsetMin).slice(3);
  return `${dateValue(p)}T${timeValue(p)}.${p3(p.ms)}${tail}`;
}

/** 밀리초 → 초 표기. 소수부는 0이면 빼고, 있으면 남은 자릿수만(−1ms → '-0.001') */
export function secondsText(ms: number): string {
  const a = Math.abs(ms);
  const int = Math.floor(a / 1000);
  const frac = a % 1000;
  const body = frac ? `${int}.${p3(frac).replace(/0+$/, "")}` : String(int);
  return ms < 0 ? `-${body}` : body;
}

/** 버림 나눗셈으로 센 초(정수) — 1970년 이전도 시각이 거꾸로 가지 않게 */
export function floorSeconds(ms: number): number {
  return Math.floor(ms / 1000);
}

/**
 * 날짜 'YYYY-MM-DD' + 시각 'HH:MM' 또는 'HH:MM:SS' + 밀리초(0~999)를 그 시간대로 읽어 밀리초로.
 * 없는 날짜·형식 오류·범위 밖이면 null.
 */
export function fromParts(date: string, time: string, msPart: number, offsetMin: number): number | null {
  const day = toDay(date);
  if (day === null) return null;
  const m = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(time.trim());
  if (!m) return null;
  const [h, mi, s] = [Number(m[1]), Number(m[2]), Number(m[3] ?? 0)];
  if (h > 23 || mi > 59 || s > 59) return null;
  if (!Number.isInteger(msPart) || msPart < 0 || msPart > 999) return null;
  const ms = day * 86_400_000 + ((h * 60 + mi) * 60 + s) * 1000 + msPart - offsetMin * 60_000;
  return ms >= MIN_MS && ms <= MAX_MS ? ms : null;
}

/** 두 시각의 차이(밀리초, 앞 − 뒤)를 '3일 4시간 5분 전/후' 로. 1초 안이면 '지금' */
export function relativeText(diffMs: number): string {
  const a = Math.abs(diffMs);
  if (a < 1000) return "지금";
  let sec = Math.floor(a / 1000);
  const d = Math.floor(sec / 86_400);
  sec -= d * 86_400;
  const h = Math.floor(sec / 3600);
  const mi = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const parts: string[] = [];
  if (d) parts.push(`${d.toLocaleString("ko-KR")}일`);
  if (h) parts.push(`${h}시간`);
  if (mi && d < 100) parts.push(`${mi}분`);
  if (!d && !h && (s || !mi)) parts.push(`${s}초`);
  return `${parts.join(" ")} ${diffMs < 0 ? "전" : "후"}`;
}

/** 일본어판 — '3日4時間5分前/後', 1초 안이면 '今'. 끊는 규칙은 relativeText 와 같다 */
export function relativeTextJa(diffMs: number): string {
  const a = Math.abs(diffMs);
  if (a < 1000) return "今";
  let sec = Math.floor(a / 1000);
  const d = Math.floor(sec / 86_400);
  sec -= d * 86_400;
  const h = Math.floor(sec / 3600);
  const mi = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  let t = "";
  if (d) t += `${d.toLocaleString("ja-JP")}日`;
  if (h) t += `${h}時間`;
  if (mi && d < 100) t += `${mi}分`;
  if (!d && !h && (s || !mi)) t += `${s}秒`;
  return `${t}${diffMs < 0 ? "前" : "後"}`;
}

/**
 * 영어판(/en-us/tools/unix-time/ 등) — 'Tue, Oct 20, 2026 12:34:56'. 날짜 순서는 페이지 언어(lang)를 따른다
 * (en-US 'Oct 20, 2026', en-GB '20 Oct 2026'). 시각은 나라와 관계없이 24시간 HH:MM:SS(.mmm).
 */
export function enText(p: Parts, lang = "en-US"): string {
  const date = new Date(Date.UTC(p.y, p.mo - 1, p.d)).toLocaleDateString(lang, {
    timeZone: "UTC", weekday: "short", year: "numeric", month: "short", day: "numeric",
  });
  const frac = p.ms ? `.${p3(p.ms)}` : "";
  return `${date} ${p2(p.h)}:${p2(p.mi)}:${p2(p.s)}${frac}`;
}

/** 영어판 — '3 days 4 hours 5 minutes ago / from now', 1초 안이면 'now'. 끊는 규칙은 relativeText 와 같다 */
export function relativeTextEn(diffMs: number): string {
  const a = Math.abs(diffMs);
  if (a < 1000) return "now";
  let sec = Math.floor(a / 1000);
  const d = Math.floor(sec / 86_400);
  sec -= d * 86_400;
  const h = Math.floor(sec / 3600);
  const mi = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const unit = (n: number, w: string) => `${n.toLocaleString("en-US")} ${w}${n === 1 ? "" : "s"}`;
  const parts: string[] = [];
  if (d) parts.push(unit(d, "day"));
  if (h) parts.push(unit(h, "hour"));
  if (mi && d < 100) parts.push(unit(mi, "minute"));
  if (!d && !h && (s || !mi)) parts.push(unit(s, "second"));
  return `${parts.join(" ")} ${diffMs < 0 ? "ago" : "from now"}`;
}
