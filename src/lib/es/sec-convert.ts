/**
 * 초·분·시간 변환 스페인판(/es/tools/sec-convert/) 표기 — 계산은 공유 lib/sec-convert.ts 그대로,
 * 여기는 입력 읽기·숫자 표기·스페인어 단위 이름과 풀어 쓰기만.
 *
 * 근거: Real Decreto 2032/2009 Anexo(https://www.boe.es/buscar/act.php?id=BOE-A-2010-927, 확인 2026-10-21)
 *   Tabla 6 — minuto min = 60 s · hora h = 3600 s · día d = 86 400 s. Cap. III 2.8·2.9 — 소수점 쉼표,
 *   자릿수가 많으면 세 자리씩 공백(네 자리는 보통 띄우지 않음) → es/number.ts 와 같은 규칙.
 *
 * - 공유 lib 의 parseScaled 는 쉼표를 천 단위로 지운다("1,5" → 15). 그래서 입력을 먼저 readInputEs 로 바꾼다.
 *   규칙은 es/number.ts parseNumberEs 와 같다: 쉼표가 있으면 소수점이고 앞쪽 점은 세 자리 묶음일 때만 천 단위,
 *   쉼표가 없으면 '1.500' 처럼 점 뒤가 모두 세 자리일 때만 천 단위, 아니면 점 하나가 소수점('1.5').
 *   숫자로 바꾸지 않고 문자열로만 바꾼다 — 정수 15자리 + 소수 6자리는 double 로 정확하지 않다.
 * - 공유 lib 출력('1,440.25')은 digitsEs 로 '1440,25'·'86 400'(다섯 자리 이상만 U+00A0 묶음)으로.
 * - 단위 이름은 1 만 단수('1 hora'), 나머지는 복수('0 segundos', '1,5 horas').
 */
import { split, clock, type Unit } from "../sec-convert";

export const UNIT_NAME_ES: Record<Unit, string> = {
  ms: "Milisegundos",
  s: "Segundos",
  min: "Minutos",
  h: "Horas",
  d: "Días",
};

const ONE_ES: Record<Unit, string> = { ms: "milisegundo", s: "segundo", min: "minuto", h: "hora", d: "día" };
const MANY_ES: Record<Unit, string> = { ms: "milisegundos", s: "segundos", min: "minutos", h: "horas", d: "días" };

const NBSP = " ";
const GROUPED = /^[1-9]\d{0,2}(\.\d{3})+$/;

/** 입력 칸 → 공유 lib 이 읽는 꼴. '1,5' → '1.5', '1.500' → '1500', '86 400' → '86400', '1.234,5' → '1234.5', 못 읽으면 'x' */
export function readInputEs(raw: string): string {
  const t = raw.normalize("NFKC").replace(/\s/g, "");
  const commas = t.split(",").length - 1;
  if (commas > 1) return "x";
  if (commas === 1) {
    const [int, frac] = t.split(",");
    if (int.includes(".") && !GROUPED.test(int)) return "x";
    return `${int.replace(/\./g, "")}.${frac}`;
  }
  return GROUPED.test(t) ? t.replace(/\./g, "") : t;
}

const group = (int: string) => (int.length > 4 ? int.replace(/\B(?=(\d{3})+$)/g, NBSP) : int);

/** 공유 lib 숫자 문자열 → 스페인 꼴. '1,440.25' → '1440,25', '86,400' → '86 400'(U+00A0), '0.001' → '0,001' */
export function digitsEs(s: string): string {
  return s.replace(/\d[\d,]*(?:\.\d+)?/g, (m) => {
    const [int, frac] = m.replace(/,/g, "").split(".");
    return group(int) + (frac ? `,${frac}` : "");
  });
}

/** 공유 lib 의 h:mm:ss 문자열 → 소수 초만 쉼표('26:00:15', '0:01:30,5'). 시간 자리는 묶지 않는다 */
export function clockTextEs(hms: string): string {
  return hms.replace(/,/g, "").replace(/\./g, ",");
}

export function clockEs(ns: bigint): string {
  return clockTextEs(clock(ns));
}

/** 값(공유 lib 문자열) + 단위 — '5400 segundos', '1 hora', '1,5 horas', '0 segundos' */
export function withUnitEs(value: string, unit: Unit): string {
  const n = Number(value.replace(/,/g, ""));
  return `${digitsEs(value)} ${n === 1 ? ONE_ES[unit] : MANY_ES[unit]}`;
}

/** '1 día, 3 horas, 46 minutos y 40 segundos' — 앞쪽 0 단위는 빼고(lib readable 과 같은 규칙), 0이면 '0 segundos' */
export function readableEs(ns: bigint): string {
  const p = split(ns);
  const out: string[] = [];
  if (p.days > 0n) out.push(withUnitEs(p.days.toString(), "d"));
  if (out.length || p.hours > 0n) out.push(withUnitEs(p.hours.toString(), "h"));
  if (out.length || p.minutes > 0n) out.push(withUnitEs(p.minutes.toString(), "min"));
  out.push(withUnitEs(p.seconds, "s"));
  return out.length === 1 ? out[0] : `${out.slice(0, -1).join(", ")} y ${out[out.length - 1]}`;
}

/** 두 번째 계산기(días·horas·minutos·segundos → 합계)의 아랫줄 — '135 minutos · 2,25 horas · 2 horas, 15 minutos y 0 segundos' */
export function partsSubEs(min: string, ms: { minutes: bigint; seconds: string }, h: string, r: string): string {
  const extra = ms.seconds === "0" ? "" : ` (${digitsEs(ms.minutes.toString())} min ${digitsEs(ms.seconds)} s)`;
  return `${withUnitEs(min, "min")}${extra} · ${withUnitEs(h, "h")} · ${r}`;
}

/** 결과 머리 두 줄 — '5400 segundos =' · '90 minutos · h:mm:ss 1:30:00' */
export function heroLabelEs(v: string, unit: Unit): string {
  return `${withUnitEs(v, unit)} =`;
}

export function heroSubEs(other: string, unit: Unit, hms: string): string {
  return `${withUnitEs(other, unit === "min" ? "s" : "min")} · h:mm:ss ${clockTextEs(hms)}`;
}
