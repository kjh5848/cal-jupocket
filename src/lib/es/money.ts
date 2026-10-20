/**
 * 스페인판 금액 표기 — 계산기(복리 등)가 같이 쓴다. Intl 을 쓰지 않는다.
 *
 *   5000 euros · 10 000 euros · 1 euro · 0,4167
 *
 * 숫자는 src/lib/es/number.ts formatNumberEs(RD 2032/2009 Anexo III 2.8·2.9 — 쉼표 소수점, 다섯 자리 이상 공백 천 단위,
 * https://www.boe.es/buscar/act.php?id=BOE-A-2010-927, 확인 2026-10-20). € 기호 위치는 허용 출처로 확인하지 않아
 * 기호 대신 'euros'(1 이면 'euro') 라는 말을 붙인다(퍼센트·날짜 페이지와 같은 원칙).
 */
import { formatNumberEs } from "./number";

/** 반올림한 정수 유로 → '10 000 euros' (음수는 '-10 000 euros') */
export function euroEs(v: number): string {
  const n = Math.round(v);
  return `${formatNumberEs(n)} ${Math.abs(n) === 1 ? "euro" : "euros"}`;
}

/** 이미 자릿수를 정한 숫자 문자열의 소수점을 쉼표로 — '0.4167' → '0,4167' */
export function decimalEs(s: string): string {
  return s.replace(".", ",");
}
