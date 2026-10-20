/**
 * 초·분·시간 변환 독일어판(/de/tools/sec-convert/) 표기 — 계산은 공유 lib/sec-convert.ts 그대로,
 * 여기는 입력 읽기(쉼표 소수)·숫자 표기·독일어 단위 이름과 풀어 쓰기만.
 *
 * - 공유 lib 의 parseScaled 는 쉼표를 천 단위로 지워 "1,5" 를 15 로 읽는다. 독일어판은 입력을 먼저 readInputDe 로
 *   문자열 그대로 바꾼다(Number 를 거치지 않아 15자리 정수·6자리 소수가 BigInt 로 정확히 간다). 규칙은 percent 의
 *   parseNumberDe 와 같다: 공백은 천 단위로 지우고, 쉼표는 소수점, 쉼표가 있으면 점은 세 자리 묶음(1.234,5)일 때만
 *   천 단위로 지우고, 쉼표 없이 '1.500' 처럼 세 자리 묶음이면 천 단위, 그 밖의 점은 소수점. 못 읽으면 "x".
 * - 공유 lib 출력('1,440.25')은 digitsDe 로 '1 440,25'(천 단위 U+00A0 — intDe·formatNumberDe 와 같은 문자)로.
 *   숫자 표기 근거는 § 32a EStG "12 348 Euro"·"914,51"(https://www.gesetze-im-internet.de/estg/__32a.html).
 * - 단위 이름은 값이 정확히 1일 때만 단수('1 Sekunde'), 그 밖(0·1,5·2)은 복수('0 Sekunden', '1,5 Stunden').
 */
import { split, clock, type Unit } from "../sec-convert";

const NBSP = " ";

export const UNIT_NAME_DE: Record<Unit, string> = {
  ms: "Millisekunden",
  s: "Sekunden",
  min: "Minuten",
  h: "Stunden",
  d: "Tage",
};

const FORMS_DE: Record<Unit, [string, string]> = {
  ms: ["Millisekunde", "Millisekunden"],
  s: ["Sekunde", "Sekunden"],
  min: ["Minute", "Minuten"],
  h: ["Stunde", "Stunden"],
  d: ["Tag", "Tage"],
};

const GROUPS = /^\d{1,3}(\.\d{3})+$/;

/** 입력 칸 → 공유 lib 이 읽는 꼴. '1,5' → '1.5', '86 400' → '86400', '1.500' → '1500', '1.234,5' → '1234.5', '1,2,3' → 'x' */
export function readInputDe(raw: string): string {
  const t = raw.normalize("NFKC").replace(/\s/g, "");
  const commas = t.split(",").length - 1;
  if (commas > 1) return "x";
  if (commas === 1) {
    const [int, frac] = t.split(",");
    if (int.includes(".") && !GROUPS.test(int)) return "x";
    return `${int.replace(/\./g, "")}.${frac}`;
  }
  return GROUPS.test(t) ? t.replace(/\./g, "") : t;
}

/** 공유 lib 숫자 문자열 → 독일어 꼴. '1,440.25' → '1 440,25'(U+00A0), '26:00:15.5' → '26:00:15,5' */
export function digitsDe(s: string): string {
  return s.replace(/,/g, NBSP).replace(/\./g, ",");
}

/** 값(공유 lib 문자열) + 단위 — '5 400 Sekunden', '1 Stunde', '1,5 Stunden', '0 Sekunden' */
export function withUnitDe(value: string, unit: Unit): string {
  const n = Number(value.replace(/,/g, ""));
  return `${digitsDe(value)} ${FORMS_DE[unit][n === 1 ? 0 : 1]}`;
}

/** '1 Tag 0 Stunden 2 Minuten 5 Sekunden' — 규칙은 lib readable 과 같다(앞쪽 0 단위는 빼고, 0이면 '0 Sekunden') */
export function readableDe(ns: bigint): string {
  const p = split(ns);
  const out: string[] = [];
  if (p.days > 0n) out.push(withUnitDe(p.days.toString(), "d"));
  if (out.length || p.hours > 0n) out.push(withUnitDe(p.hours.toString(), "h"));
  if (out.length || p.minutes > 0n) out.push(withUnitDe(p.minutes.toString(), "min"));
  out.push(withUnitDe(p.seconds, "s"));
  return out.join(" ");
}

/** h:mm:ss — 시간은 24를 넘어도 그대로, 소수 초는 쉼표('27:46:40', '0:01:30,5') */
export function clockDe(ns: bigint): string {
  return digitsDe(clock(ns));
}

/** 두 번째 계산기(Tage·Stunden·Minuten·Sekunden → 합계)의 아랫줄 — '135 Minuten · 2,25 Stunden · 2 Stunden 15 Minuten 0 Sekunden' */
export function partsSubDe(min: string, ms: { minutes: bigint; seconds: string }, h: string, r: string): string {
  const extra = ms.seconds === "0" ? "" : ` (${digitsDe(ms.minutes.toLocaleString("en-US"))} min ${digitsDe(ms.seconds)} s)`;
  return `${withUnitDe(min, "min")}${extra} · ${withUnitDe(h, "h")} · ${r}`;
}
