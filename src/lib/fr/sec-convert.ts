/**
 * 초·분·시간 변환 프랑스어판(/fr/tools/sec-convert/) 표기 — 계산은 공유 lib/sec-convert.ts 그대로,
 * 여기는 입력 읽기(쉼표 소수)·숫자 표기·프랑스어 단위 이름과 풀어 쓰기만.
 *
 * - 공유 lib 의 parseScaled 는 쉼표를 천 단위로 지워 "1,5" 를 15 로 읽는다. 프랑스어판은 입력을 먼저
 *   readInputFr 로 바꾼다: 공백(일반·줄바꿈 없는·좁은)은 천 단위로 지우고 쉼표를 점으로. 쉼표와 점이 함께 나오면
 *   읽지 않는다(lib 이 null 을 돌려주도록 "x" 를 넘긴다).
 * - 공유 lib 출력('1,440.25')은 digitsFr 로 fr-FR 꼴('1 440,25', 천 단위는 Intl fr-FR 과 같은 U+202F)로 바꾼다.
 * - 단위 이름은 값이 2 미만이면 단수('0 seconde', '1,5 heure'), 2 이상이면 복수('90 secondes').
 */
import { split, clock, type Unit } from "../sec-convert";

export const UNIT_NAME_FR: Record<Unit, string> = {
  ms: "Millisecondes",
  s: "Secondes",
  min: "Minutes",
  h: "Heures",
  d: "Jours",
};

const ONE_FR: Record<Unit, string> = { ms: "milliseconde", s: "seconde", min: "minute", h: "heure", d: "jour" };

const NNBSP = " ";

/** 입력 칸 → 공유 lib 이 읽는 꼴. '1 440,25' → '1440.25', '1,5' → '1.5', '1.234,5' → 'x'(못 읽음) */
export function readInputFr(raw: string): string {
  const t = raw.normalize("NFKC").replace(/\s/g, "");
  if (t.includes(",") && t.includes(".")) return "x";
  return t.replace(/,/g, ".");
}

/** 공유 lib 숫자 문자열 → fr-FR 꼴. '1,440.25' → '1 440,25'(U+202F), '26:00:15.5' → '26:00:15,5' */
export function digitsFr(s: string): string {
  return s.replace(/,/g, NNBSP).replace(/\./g, ",");
}

/** 값(공유 lib 문자열) + 단위 — '5 400 secondes', '1,5 heure', '0 seconde' */
export function withUnitFr(value: string, unit: Unit): string {
  const n = Number(value.replace(/,/g, ""));
  return `${digitsFr(value)} ${ONE_FR[unit]}${n >= 2 ? "s" : ""}`;
}

/** '1 jour 0 heure 2 minutes 5 secondes' — 규칙은 lib readable 과 같다(앞쪽 0 단위는 빼고, 0이면 '0 seconde') */
export function readableFr(ns: bigint): string {
  const p = split(ns);
  const out: string[] = [];
  if (p.days > 0n) out.push(withUnitFr(p.days.toString(), "d"));
  if (out.length || p.hours > 0n) out.push(withUnitFr(p.hours.toString(), "h"));
  if (out.length || p.minutes > 0n) out.push(withUnitFr(p.minutes.toString(), "min"));
  out.push(withUnitFr(p.seconds, "s"));
  return out.join(" ");
}

/** h:mm:ss — 시간은 24를 넘어도 그대로, 소수 초는 쉼표('26:00:15', '0:01:30,5') */
export function clockFr(ns: bigint): string {
  return digitsFr(clock(ns));
}

/** 두 번째 계산기(일·시·분·초 → 합계)의 아랫줄 — '135 minutes · 2,25 heures · 2 heures 15 minutes 0 seconde' */
export function partsSubFr(min: string, ms: { minutes: bigint; seconds: string }, h: string, r: string): string {
  const extra = ms.seconds === "0" ? "" : ` (${digitsFr(ms.minutes.toLocaleString("en-US"))} min ${digitsFr(ms.seconds)} s)`;
  return `${withUnitFr(min, "min")}${extra} · ${withUnitFr(h, "h")} · ${r}`;
}
