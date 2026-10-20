/**
 * 독일어판 금액·소수 표기 — 계산기(복리 등)가 같이 쓴다. Intl 을 쓰지 않는다.
 *
 *   1 000 Euro · 0,4167 · 26,375
 *
 * 금액 꼴은 독일 법령 원문을 따른다 — § 32a EStG "12 348 Euro", § 20 Abs. 9 EStG "1 000 Euro"(천 단위 공백, 기호 대신 'Euro'),
 * 소수 쉼표는 § 4 SolzG 1995 "5,5 Prozent"(https://www.gesetze-im-internet.de/estg/__32a.html · estg/__20.html · solzg_1995/__4.html, 확인 2026-10-21).
 * € 기호 위치·Intl de-DE 의 점 천 단위(1.000)는 허용 출처로 확인하지 않아 쓰지 않는다.
 */
import { intDe } from "./date-format";

/** 반올림한 정수 유로 → '12 348 Euro' (음수는 '−' 없이 '-') */
export function euroDe(v: number): string {
  return `${intDe(Math.round(v))} Euro`;
}

/** 이미 자릿수를 정한 숫자 문자열의 소수점을 쉼표로 — '0.4167' → '0,4167' */
export function decimalDe(s: string): string {
  return s.replace(".", ",");
}
