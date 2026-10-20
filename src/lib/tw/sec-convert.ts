/**
 * 초·분·시간 변환 번체판 표기(대만 /zh-tw/tools/sec-convert/ — scripts/sec-convert.ts 의 "zh-Hant" 사전이 써서 홍콩판도 같이 쓸 수 있다).
 * 계산은 공유 lib/sec-convert.ts 그대로, 여기는 번체 단위 이름과 풀어 쓰기만.
 * 중국어는 값과 단위를 붙여 쓰고 복수형이 없다: '90秒'·'1.5小時'.
 * 숫자 표기(쉼표 천 단위·점 소수)는 공유 lib 의 출력 그대로 둔다 — 입력 읽기(lib parseScaled)와 같아야 해서.
 */
import { split, type Unit } from "../sec-convert";

/** select·칩 라벨용 단위 이름 */
export const UNIT_NAME_ZH_HANT: Record<Unit, string> = { ms: "毫秒", s: "秒", min: "分鐘", h: "小時", d: "天" };

const comma = (s: string) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** 값 + 단위 — '5,400秒', '1.5小時', '90分鐘' */
export function withUnitZhHant(value: string, unit: Unit): string {
  return `${value}${UNIT_NAME_ZH_HANT[unit]}`;
}

/** '1天0小時2分鐘5秒' — 규칙은 lib readable 과 같다(앞쪽 0 단위는 빼고, 0이면 '0秒') */
export function readableZhHant(ns: bigint): string {
  const p = split(ns);
  const out: string[] = [];
  if (p.days > 0n) out.push(`${comma(p.days.toString())}天`);
  if (out.length || p.hours > 0n) out.push(`${p.hours}小時`);
  if (out.length || p.minutes > 0n) out.push(`${p.minutes}分鐘`);
  out.push(`${p.seconds}秒`);
  return out.join("");
}
