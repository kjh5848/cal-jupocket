/**
 * 영국 Stamp Duty Land Tax(SDLT) — 잉글랜드·북아일랜드, 주거용 단일 주택, effective date 2025-04-01 이후. 영국판 /en-gb/stamp-duty/ 가 쓴다.
 *
 * 원문(2026-10-21 확인, 숫자는 rates/gb/stamp-duty-land-tax-2026.json):
 * - FA 2003 s.55(1B) Table A — 표준 0/2/5/10/12% (£125,000 · £250,000 · £925,000 · £1.5m).
 * - Sch 4ZA para 1(2) Table A — higher rates 5/7/10/15/17%. para 3(2) Condition A: 대가 £40,000 이상일 때만.
 * - Sch 6ZA para 4 Table A — 생애최초 0%(£300,000)·5%(£500,000). para 1(3) £500,000 초과면 청구 불가 → 표준 요율.
 *   para 1(7) higher rates 거래면 불가(화면은 셋 중 하나만 고르게 해서 겹치지 않는다).
 * - s.75ZA — 비거주 거래면 각 요율에 2% 더함. Sch 9A para 2(3)(a) — 대가 £40,000 이상일 때만(de minimis).
 * - HMRC SDLTM00050 — 구간별(marginal) 계산 후 파운드 미만 버림.
 *
 * 거주·추가 주택·생애최초 해당 여부는 판정하지 않는다 — 사용자가 고른다.
 * 금액은 정수 펜스 × 정수 퍼센트로 더하고 마지막에 한 번만 버린다(0.05 × 45000 같은 부동소수 곱을 버리면 £1 틀릴 수 있다).
 */
import rates from "../../rates/gb/stamp-duty-land-tax-2026.json";

export type Table = "standard" | "higher" | "firstTimeBuyer";

interface Band {
  upTo: number | null;
  rate: number;
}

const pct = (r: number) => Math.round(r * 100);
const toRows = (bands: Band[]) => bands.map((b) => ({ upTo: b.upTo, pct: pct(b.rate) }));
const TABLES: Record<Table, { upTo: number | null; pct: number }[]> = {
  standard: toRows(rates.standard.bands as Band[]),
  higher: toRows(rates.higherRates.bands as Band[]),
  firstTimeBuyer: toRows(rates.firstTimeBuyer.bands as Band[]),
};

export const SURCHARGE_PCT = pct(rates.nonResidentSurcharge.addToEachRate);
export const HIGHER_MIN: number = rates.higherRates.minConsideration;
export const SURCHARGE_MIN: number = rates.nonResidentSurcharge.minConsideration;
export const FTB_MAX: number = rates.firstTimeBuyer.maxConsideration;

/** 표의 구간(파운드·정수 %) — 본문 표에 쓴다 */
export function bandsOf(table: Table): { from: number; upTo: number | null; pct: number }[] {
  let from = 0;
  return TABLES[table].map((b) => {
    const row = { from, upTo: b.upTo, pct: b.pct };
    if (b.upTo !== null) from = b.upTo;
    return row;
  });
}

export interface BandLine {
  /** 구간 시작(파운드) */
  from: number;
  /** 구간 끝(파운드), null 이면 끝없음 */
  upTo: number | null;
  /** 적용 %(비거주 2% 포함) */
  pct: number;
  /** 이 구간에 든 금액(펜스) */
  portion: number;
  /** 이 구간 세액(펜스 × 100 단위 — 100 으로 나누면 펜스, 끝수 처리 전) */
  taxCentiPence: number;
}

export interface SdltResult {
  /** 실제로 쓴 표 */
  table: Table;
  /** 비거주 2% 를 더했나 */
  surcharge: boolean;
  /** 생애최초를 골랐지만 £500,000 넘어 표준으로 바뀜 */
  ftbOverLimit: boolean;
  /** higher rates 를 골랐지만 £40,000 미만이라 표준으로 바뀜 */
  higherBelowMin: boolean;
  /** 비거주를 골랐지만 £40,000 미만이라 2% 안 더함 */
  surchargeBelowMin: boolean;
  lines: BandLine[];
  /** 총 SDLT(파운드, 버림) */
  total: number;
}

/** price: 대가(펜스) */
export function sdlt(price: number, chosen: Table, nonResident: boolean): SdltResult {
  const p = Math.max(0, Math.floor(price));
  const atLeast = (pounds: number) => p >= pounds * 100;

  let table: Table = chosen;
  const ftbOverLimit = chosen === "firstTimeBuyer" && p > FTB_MAX * 100;
  const higherBelowMin = chosen === "higher" && !atLeast(HIGHER_MIN);
  if (ftbOverLimit || higherBelowMin) table = "standard";

  const surcharge = nonResident && atLeast(SURCHARGE_MIN);
  const surchargeBelowMin = nonResident && !surcharge;
  const add = surcharge ? SURCHARGE_PCT : 0;

  const lines: BandLine[] = [];
  let sum = 0;
  for (const b of bandsOf(table)) {
    const lo = b.from * 100;
    if (p <= lo && lines.length > 0) break;
    const hi = b.upTo === null ? p : Math.min(p, b.upTo * 100);
    const portion = Math.max(0, hi - lo);
    const rate = b.pct + add;
    const taxCentiPence = portion * rate;
    sum += taxCentiPence;
    lines.push({ from: b.from, upTo: b.upTo, pct: rate, portion, taxCentiPence });
  }

  return { table, surcharge, ftbOverLimit, higherBelowMin, surchargeBelowMin, lines, total: Math.floor(sum / 10000) };
}

/** 파운드 → '£1,234' (펜스 없이) */
export function gbp0(pounds: number): string {
  return pounds.toLocaleString("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

/** 구간 세액 표시 — 펜스가 있으면 '£2,250.50', 없으면 '£2,250'(펜스 미만은 버려 보여 준다) */
export function bandTax(taxCentiPence: number): string {
  const pence = Math.floor(taxCentiPence / 100);
  if (pence % 100 === 0) return gbp0(pence / 100);
  return (pence / 100).toLocaleString("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** 펜스 → '£295,000' 또는 '£295,000.50' */
export function money(pence: number): string {
  return bandTax(pence * 100);
}
