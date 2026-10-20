/**
 * 초·분·시간 변환 인도네시아어판(/id/tools/sec-convert/) 표기 — 계산은 공유 lib/sec-convert.ts 그대로,
 * 여기는 인도네시아어 단위 이름과 풀어 쓰기만. 인도네시아어 명사는 복수형이 없어 '1 detik'·'90 detik' 모두 같다.
 * 숫자 표기(쉼표 천 단위·점 소수)는 공유 lib 의 출력 그대로 둔다 — 입력 읽기(lib parseScaled)와 같아야 해서.
 */
import { split, type Unit } from "../sec-convert";

export const UNIT_NAME_ID: Record<Unit, string> = { ms: "Milidetik", s: "Detik", min: "Menit", h: "Jam", d: "Hari" };

const ONE_ID: Record<Unit, string> = { ms: "milidetik", s: "detik", min: "menit", h: "jam", d: "hari" };

const comma = (s: string) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** 값 + 단위 — '5,400 detik', '1.5 jam' */
export function withUnitId(value: string, unit: Unit): string {
  return `${value} ${ONE_ID[unit]}`;
}

/** '1 hari 0 jam 2 menit 5 detik' — 규칙은 lib readable 과 같다(앞쪽 0 단위는 빼고, 0이면 '0 detik') */
export function readableId(ns: bigint): string {
  const p = split(ns);
  const out: string[] = [];
  if (p.days > 0n) out.push(withUnitId(comma(p.days.toString()), "d"));
  if (out.length || p.hours > 0n) out.push(withUnitId(p.hours.toString(), "h"));
  if (out.length || p.minutes > 0n) out.push(withUnitId(p.minutes.toString(), "min"));
  out.push(withUnitId(p.seconds, "s"));
  return out.join(" ");
}
