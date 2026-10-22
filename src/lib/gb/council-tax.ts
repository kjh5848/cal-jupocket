/**
 * 잉글랜드 Council Tax — 고지서의 Band D(또는 자기 band) 연액 → band 금액 · 할인 · 분할 납부액. 영국판 /en-gb/council-tax/ 가 쓴다.
 *
 * 원문(2026-10-23 확인, rates/gb/council-tax-2026.json):
 * - LGFA 1992 s.5(1)·(2) — 잉글랜드 band 비율 6:7:8:9:11:13:15:18, Band A~H(1991-04-01 시가).
 * - s.36 — band 금액 = A × N ÷ D(D = 9). 의회·precept 금액마다 따로 적용한 뒤 s.30 에서 합친다 → 법은 끝수를 정하지 않음.
 *   여기서는 1p 반올림(페이지 선택) — 고지서와 1p 안팎 다를 수 있다.
 * - s.11 — 잉글랜드 할인 25%(성인 1명 등) · 50%(아무도 안 셈). 날마다 판정 — 여기서는 1년 내내 같은 상태로 본다.
 * - SI 1992/613 Sch 1 para 2(3)·(3A)·(5)·(6) — 10회(신청하면 12회), C ÷ D 가 파운드 배수면 그대로,
 *   아니면 2회차부터 A = C ÷ D 를 가장 가까운 파운드로, 첫 회 B = C − (D − 1) × A. 정확히 50p 는 원문이 정하지 않아 올림(페이지 선택).
 *
 * 금액은 전부 정수 펜스.
 */
import rates from "../../rates/gb/council-tax-2026.json";

export type Band = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H";
export type Discount = 0 | 25 | 50;

export const BANDS = rates.england.bands as { band: Band; valueUpTo: number | null; ratio: number }[];
export const D_RATIO = BANDS.find((b) => b.band === "D")!.ratio;
export const SINGLE_DISCOUNT = Math.round(rates.england.discounts.oneAdultOrAllButOneDisregarded * 100) as Discount;
export const NONE_DISCOUNT = Math.round(rates.england.discounts.noneOrAllDisregarded * 100) as Discount;
export const INSTALMENTS = rates.instalments.default;
export const INSTALMENTS_ON_REQUEST = rates.instalments.onRequest;

export function ratioOf(band: Band): number {
  return BANDS.find((b) => b.band === band)!.ratio;
}

/** num/den(0 이상 정수) 반올림(정확히 반이면 올림) */
function roundDiv(num: number, den: number): number {
  const q = Math.floor(num / den);
  return 2 * (num - q * den) >= den ? q + 1 : q;
}

/** Band D 연액(pence) → 그 band 연액(pence), 1p 반올림 */
export function fromBandD(bandD: number, band: Band): number {
  return roundDiv(bandD * ratioOf(band), D_RATIO);
}

/** band 연액(pence) − 할인(%) → { discount, payable }, 할인 1p 반올림 */
export function applyDiscount(annual: number, pct: Discount): { discount: number; payable: number } {
  const discount = roundDiv(annual * pct, 100);
  return { discount, payable: annual - discount };
}

export interface Schedule {
  /** 첫 회(pence) */
  first: number;
  /** 2회차부터 매회(pence) */
  rest: number;
  /** 횟수 */
  count: number;
  /** 어느 회차가 £5 미만 — para 2(7) 로 의회가 달리 정할 수 있음 */
  small: boolean;
}

/** 연액(pence)을 count 회로 — Sch 1 para 2(5)·(6) */
export function instalments(total: number, count: number): Schedule {
  if (count <= 1) return { first: total, rest: total, count: 1, small: total < 500 };
  let first: number;
  let rest: number;
  if (total % (count * 100) === 0) {
    first = rest = total / count;
  } else {
    rest = roundDiv(total, count * 100) * 100;
    first = total - (count - 1) * rest;
  }
  return { first, rest, count, small: first < 500 || rest < 500 };
}

/** 펜스 → '£1,234.56' */
export function gbp(pence: number): string {
  const sign = pence < 0 ? "−" : "";
  return sign + (Math.abs(pence) / 100).toLocaleString("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** 파운드(정수) → '£40,000' */
export function gbp0(pounds: number): string {
  return pounds.toLocaleString("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });
}

/** band 의 1991-04-01 시가 범위 문구 */
export function bandRange(band: Band): string {
  const i = BANDS.findIndex((b) => b.band === band);
  const lo = i === 0 ? null : BANDS[i - 1].valueUpTo;
  const hi = BANDS[i].valueUpTo;
  if (lo === null) return `up to ${gbp0(hi!)}`;
  if (hi === null) return `more than ${gbp0(lo)}`;
  return `over ${gbp0(lo)} up to ${gbp0(hi)}`;
}
