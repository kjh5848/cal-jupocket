/**
 * 초·분·시간 변환(/tools/sec-convert/) — 밀리초 ↔ 초 ↔ 분 ↔ 시간 ↔ 일, 시간 '길이'만 다룬다(시각·날짜 아님).
 *
 * 기준은 SI 브로슈어 표 8(rates/sec-convert-2026.json): 1 min = 60 s, 1 h = 3600 s, 1 d = 86 400 s.
 * 밀리초는 SI 접두어 m(10⁻³). 주·월·년은 표 8 에 없거나 길이가 달라 넣지 않는다.
 *
 * 정한 규칙(테스트로 고정):
 * - 입력은 0 이상의 수. 쉼표·공백은 지우고, 소수는 여섯째 자리까지. 정수 부분은 15자리까지.
 * - 부동소수 오차(1.1 × 60 = 66.00000000000001)를 막으려고 계산은 전부 BigInt 나노초 정수로 한다.
 *   입력 × 10⁶(소수 여섯 자리) × 단위의 밀리초 = 나노초라서 곱셈만으로 정확하다.
 * - 단위별 값은 소수 여섯째 자리에서 반올림(0.5 는 올림)하고 끝의 0 을 지운다.
 * - '일·시간·분·초' 풀어 쓰기는 마이크로초로 반올림한 뒤 나눠서 '60초' 같은 자리 넘침이 없다.
 */

export type Unit = "ms" | "s" | "min" | "h" | "d";

/** 단위 하나가 몇 밀리초인가 — SI 브로슈어 표 8 */
export const MS_PER: Record<Unit, bigint> = { ms: 1n, s: 1000n, min: 60_000n, h: 3_600_000n, d: 86_400_000n };
export const UNIT_NAME: Record<Unit, string> = { ms: "밀리초", s: "초", min: "분", h: "시간", d: "일" };
/** 일본어판(/ja/tools/sec-convert/) 단위 이름 */
export const UNIT_NAME_JA: Record<Unit, string> = { ms: "ミリ秒", s: "秒", min: "分", h: "時間", d: "日" };
export const UNITS: Unit[] = ["ms", "s", "min", "h", "d"];

const SCALE = 1_000_000n; // 입력 소수 여섯 자리

/** '1,440.25' → 1440250000n(× 10⁶). 빈 칸은 0n, 음수·문자·자릿수 초과는 null */
export function parseScaled(raw: string): bigint | null {
  const s = raw.replace(/[\s,]/g, "");
  if (s === "") return 0n;
  const m = /^(\d{1,15})(?:\.(\d{0,6}))?$|^\.(\d{1,6})$/.exec(s);
  if (!m) return null;
  const int = m[1] ?? "0";
  const frac = (m[2] ?? m[3] ?? "").padEnd(6, "0");
  return BigInt(int) * SCALE + BigInt(frac);
}

/** 값(문자열) + 단위 → 나노초. 잘못된 입력은 null */
export function toNanos(raw: string, unit: Unit): bigint | null {
  const v = parseScaled(raw);
  return v === null ? null : v * MS_PER[unit];
}

/** 일·시간·분·초 칸 → 나노초. 빈 칸은 0, 칸마다 소수 허용(넘쳐도 그대로 더함: 90분 = 1시간 30분) */
export function partsToNanos(d: string, h: string, mi: string, s: string): bigint | null {
  let total = 0n;
  for (const [raw, u] of [[d, "d"], [h, "h"], [mi, "min"], [s, "s"]] as const) {
    const n = toNanos(raw, u);
    if (n === null) return null;
    total += n;
  }
  return total;
}

const comma = (s: string) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** 양의 BigInt 분수 num/den 을 소수 여섯째 자리 반올림 문자열로('62.083333', '1,440') */
export function decimal(num: bigint, den: bigint, places = 6): string {
  const p = 10n ** BigInt(places);
  const q = (num * p * 2n + den) / (den * 2n); // 반올림
  const int = q / p;
  const frac = (q % p).toString().padStart(places, "0").replace(/0+$/, "");
  return comma(int.toString()) + (frac ? "." + frac : "");
}

/** 나노초 → 그 단위의 값 문자열 */
export function inUnit(ns: bigint, unit: Unit): string {
  return decimal(ns, MS_PER[unit] * SCALE);
}

export type Parts = { days: bigint; hours: bigint; minutes: bigint; seconds: string; totalHours: bigint };

/** 나노초 → 일·시·분·초(초는 소수 여섯 자리까지). 마이크로초로 먼저 반올림해 자리 넘침이 없다 */
export function split(ns: bigint): Parts {
  const us = (ns + 500n) / 1000n;
  const US_S = 1_000_000n;
  const days = us / (86_400n * US_S);
  let r = us % (86_400n * US_S);
  const hours = r / (3_600n * US_S);
  r %= 3_600n * US_S;
  const minutes = r / (60n * US_S);
  r %= 60n * US_S;
  const secInt = r / US_S;
  const frac = (r % US_S).toString().padStart(6, "0").replace(/0+$/, "");
  return { days, hours, minutes, seconds: secInt.toString() + (frac ? "." + frac : ""), totalHours: days * 24n + hours };
}

/** '1일 0시간 2분 5초' — 앞쪽 0 단위는 뺀다(0이면 '0초') */
export function readable(ns: bigint): string {
  const p = split(ns);
  const out: string[] = [];
  if (p.days > 0n) out.push(`${comma(p.days.toString())}일`);
  if (out.length || p.hours > 0n) out.push(`${p.hours}시간`);
  if (out.length || p.minutes > 0n) out.push(`${p.minutes}분`);
  out.push(`${p.seconds}초`);
  return out.join(" ");
}

/** 일본어판 풀어 쓰기 '1日0時間2分5秒' — 규칙은 readable 과 같다(앞쪽 0 단위는 빼고, 0이면 '0秒') */
export function readableJa(ns: bigint): string {
  const p = split(ns);
  const out: string[] = [];
  if (p.days > 0n) out.push(`${comma(p.days.toString())}日`);
  if (out.length || p.hours > 0n) out.push(`${p.hours}時間`);
  if (out.length || p.minutes > 0n) out.push(`${p.minutes}分`);
  out.push(`${p.seconds}秒`);
  return out.join("");
}

/** 시:분:초 — 시간은 24를 넘어도 그대로('26:00:15', '0:01:30.5') */
export function clock(ns: bigint): string {
  const p = split(ns);
  const [si, sf] = p.seconds.split(".");
  return `${comma(p.totalHours.toString())}:${String(p.minutes).padStart(2, "0")}:${si.padStart(2, "0")}${sf ? "." + sf : ""}`;
}

/** 모든 단위 값 한 번에 */
export function convertAll(ns: bigint): Record<Unit, string> {
  return Object.fromEntries(UNITS.map((u) => [u, inUnit(ns, u)])) as Record<Unit, string>;
}
