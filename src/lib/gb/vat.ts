/**
 * 영국 VAT — net(VAT 빼고) ↔ gross(VAT 포함) 환산. 영국판 /en-gb/vat/ 가 쓴다.
 *
 * 원문(2026-10-21 확인):
 * - GOV.UK VAT rates — standard 20%, reduced 5%, zero 0%.
 * - HMRC VAT Notice 700 7.3.1 — VAT fraction = rate ÷ (100 + rate): 20% → 1/6, 5% → 1/21 (£2.40 → 40p).
 * - Notice 700 17.5·17.5.1 — 합계 VAT 를 whole penny 로 round down 하거나 1p 로 nearest. 17.6 — retailers 는 round down 금지.
 *   → 끝수는 'down'(1p 미만 버림) 과 'nearest'(1p 반올림) 두 가지를 사용자가 고른다.
 *
 * 금액은 전부 정수 펜스(pence)로 계산한다 — 부동소수 × 1.2 를 쓰지 않는다.
 * gross → net 은 VAT 를 먼저 끝수 처리하고 net = gross − VAT(넣은 gross 가 그대로 남는다).
 */
import rates from "../../rates/gb/vat-2026.json";

export type VatRate = 20 | 5;
export type Rounding = "down" | "nearest";

export const STANDARD: VatRate = Math.round(rates.standardRate * 100) as VatRate;
export const REDUCED: VatRate = Math.round(rates.reducedRate * 100) as VatRate;

/** num/den(0 이상 정수)을 1p 단위로 끝수 처리 */
function divide(num: number, den: number, rounding: Rounding): number {
  const q = Math.floor(num / den);
  const r = num - q * den;
  if (r === 0 || rounding === "down") return q;
  return 2 * r >= den ? q + 1 : q;
}

export interface VatSplit {
  /** VAT 빼고(pence) */
  net: number;
  /** VAT(pence) */
  vat: number;
  /** VAT 포함(pence) */
  gross: number;
}

/** net(pence) → VAT·gross */
export function fromNet(net: number, rate: VatRate, rounding: Rounding = "nearest"): VatSplit {
  const vat = divide(net * rate, 100, rounding);
  return { net, vat, gross: net + vat };
}

/** gross(pence) → VAT(× rate/(100+rate))·net */
export function fromGross(gross: number, rate: VatRate, rounding: Rounding = "nearest"): VatSplit {
  const vat = divide(gross * rate, 100 + rate, rounding);
  return { net: gross - vat, vat, gross };
}

/**
 * '£1,234.56'·'1234.5'·' 12 ' → 펜스. 숫자가 아니면 0. 소수 셋째 자리부터는 반올림.
 * 문자열로 쪼개 읽어 1.005 × 100 같은 부동소수 오차를 피한다.
 */
export function parsePence(raw: string): number {
  const s = raw.replace(/[£,\s]/g, "");
  const m = /^(\d*)(?:\.(\d*))?$/.exec(s);
  if (!m || (m[1] === "" && (m[2] ?? "") === "")) return 0;
  const pounds = m[1] === "" ? 0 : parseInt(m[1], 10);
  const frac = (m[2] ?? "").padEnd(3, "0");
  let pence = pounds * 100 + parseInt(frac.slice(0, 2), 10);
  if (parseInt(frac[2], 10) >= 5) pence += 1;
  return Number.isSafeInteger(pence) ? pence : 0;
}

/** 펜스 → '£1,234.56' */
export function gbp(pence: number): string {
  return (pence / 100).toLocaleString("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** 펜스 → '1,234.56'(입력칸 표시) */
export function poundsInput(pence: number): string {
  return (pence / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
