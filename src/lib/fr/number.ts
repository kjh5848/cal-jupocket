/**
 * 프랑스어판 숫자 읽기·쓰기 — 산술 도구(퍼센트 등)가 프랑스어 페이지에서 쓴다.
 *
 * 한국어판 parseNumber 는 쉼표를 천 단위로 보고 지우므로 프랑스어 입력 "12,5" 를 125 로 읽는다.
 * 프랑스어판은 쉼표와 점을 둘 다 소수점으로 받고, 공백(일반·줄바꿈 없는·좁은 줄바꿈 없는)은 천 단위로 보고 지운다.
 * "1.234,5" 처럼 소수점이 둘 나오면 읽지 않는다(NaN) — 화면이 "숫자를 넣어 달라"고 안내한다.
 * 화면 표기는 브라우저의 fr-FR 숫자 서식(Intl) 그대로, 소수는 둘째 자리까지.
 */
import { round2 } from "../percent";

/** 입력 칸 문자열 → 숫자. 공백·% 를 지우고 쉼표를 소수점으로, 못 읽으면 NaN. */
export function parseNumberFr(raw: string): number {
  const t = raw.normalize("NFKC").replace(/[\s%]/g, "").replace(/,/g, ".");
  if (t === "" || t === "-" || t === ".") return NaN;
  return /^-?\d*\.?\d*$/.test(t) ? Number(t) : NaN;
}

/** 화면 표기 — fr-FR 서식(천 단위 공백, 소수 쉼표), 소수 둘째 자리까지(끝 0은 지움). */
export function formatNumberFr(x: number): string {
  return round2(x).toLocaleString("fr-FR", { maximumFractionDigits: 2 });
}
