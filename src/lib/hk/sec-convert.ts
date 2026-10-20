/**
 * 초·분·시간 변환 번체 중국어 표기 — 홍콩판(/zh-hk/tools/sec-convert/)이 쓰고, 공유 스크립트 scripts/sec-convert.ts 의
 * ZH_HANT 사전이 가져다 쓴다(대만판도 같은 사전을 쓸 수 있게 홍콩 말투·대만 말투 없는 중립 서면어).
 * 계산은 공유 lib/sec-convert.ts 그대로, 여기는 단위 이름과 풀어 쓰기만. 숫자 표기(쉼표 천 단위·점 소수)는 공유 lib 출력 그대로.
 */
import { split, type Unit } from "../sec-convert";

export const UNIT_NAME_ZH_HANT: Record<Unit, string> = { ms: "毫秒", s: "秒", min: "分鐘", h: "小時", d: "天" };

const comma = (s: string) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** 값 + 단위 — '5,400秒', '1.5小時' (붙여 쓴다) */
export function withUnitZhHant(value: string, unit: Unit): string {
  return `${value}${UNIT_NAME_ZH_HANT[unit]}`;
}

/** '1天3小時46分鐘40秒' — 규칙은 lib readable 과 같다(앞쪽 0 단위는 빼고, 0이면 '0秒') */
export function readableZhHant(ns: bigint): string {
  const p = split(ns);
  const out: string[] = [];
  if (p.days > 0n) out.push(withUnitZhHant(comma(p.days.toString()), "d"));
  if (out.length || p.hours > 0n) out.push(withUnitZhHant(p.hours.toString(), "h"));
  if (out.length || p.minutes > 0n) out.push(withUnitZhHant(p.minutes.toString(), "min"));
  out.push(withUnitZhHant(p.seconds, "s"));
  return out.join("");
}
