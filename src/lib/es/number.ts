/**
 * 스페인판 숫자 읽기·쓰기 — 소수점은 쉼표, 천 단위는 공백.
 *
 * 근거: Real Decreto 2032/2009(unidades legales de medida) Anexo, Capítulo III 2.8·2.9
 * https://www.boe.es/buscar/act.php?id=BOE-A-2010-927 (확인 2026-10-20)
 *   2.8 소수점은 쉼표나 점, 쉼표를 우선. 2.9 자릿수가 많으면 세 자리씩 공백으로 나누고 점·쉼표로는 나누지 않는다.
 *       앞뒤로 네 자리뿐이면 공백을 넣지 않는 것이 보통이다.
 *
 * 읽기는 사람들이 실제로 치는 꼴도 받는다: 1.500(천 단위 점)·1.500,25·12,5·12.5(원문이 점도 허용).
 * 규칙 — 쉼표가 있으면 쉼표가 소수점이고 앞쪽 점은 천 단위. 쉼표가 없으면 점 뒤가 모두 정확히 세 자리이고
 * 맨 앞이 0이 아닐 때만 천 단위, 아니면 점 하나를 소수점으로 본다. 못 읽으면 NaN.
 */
import { round2 } from "../percent";

const GROUPED = /^-?[1-9]\d{0,2}(\.\d{3})+$/;

/** 입력 칸 문자열 → 숫자(스페인 표기). 공백·% 는 지우고 전각 숫자는 반각으로 읽는다. */
export function parseNumberEs(raw: string): number {
  let t = raw.normalize("NFKC").replace(/[\s  %]/g, "");
  if (t === "" || t === "-") return NaN;
  const commas = t.split(",").length - 1;
  if (commas > 1) return NaN;
  if (commas === 1) {
    const [int, frac] = t.split(",");
    if (int.includes(".")) {
      if (!GROUPED.test(int)) return NaN;
    }
    t = `${int.replace(/\./g, "")}.${frac}`;
  } else if (GROUPED.test(t)) {
    t = t.replace(/\./g, "");
  }
  if (t === "." || t === "-.") return NaN;
  return /^-?\d*\.?\d*$/.test(t) ? Number(t) : NaN;
}

/** 화면 표기 — 소수 둘째 자리까지(끝 0 지움), 소수점 쉼표, 다섯 자리 이상이면 세 자리마다 줄바꿈 없는 공백. */
export function formatNumberEs(x: number): string {
  const r = round2(x);
  if (!Number.isFinite(r)) return String(r);
  const neg = r < 0;
  const [int, frac] = Math.abs(r).toFixed(2).replace(/0+$/, "").replace(/\.$/, "").split(".");
  const grouped = int.length > 4 ? int.replace(/\B(?=(\d{3})+$)/g, " ") : int;
  return `${neg ? "-" : ""}${grouped}${frac ? `,${frac}` : ""}`;
}
