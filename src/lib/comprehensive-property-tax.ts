/**
 * 종합부동산세 — 재산세와 같은 날(6월 1일)에 정해지는데 걷는 곳이 다르다.
 *
 * 재산세는 지방세(시·군·구), 종부세는 **국세**(세무서)다. 같은 집에
 * 붙는데 고지서가 따로 온다.
 *
 * 계산의 뼈대는 단순하다.
 *
 *   과세표준 = (공시가격 합계 − 공제) × 60%
 *   세액     = 과세표준에 주택 수별 세율표 적용
 *
 * 공제가 1세대 1주택 12억, 그 밖 9억이라 **대부분의 사람에게 0원**이다.
 * 뺀 금액이 0보다 작으면 0으로 본다(제8조 ① 단서).
 *
 * 2026-10-13: 1세대 1주택자 나이·보유기간 세액공제(제9조 ⑤~⑨)와 농어촌특별세(20%)를
 * 원문으로 읽고 넣었다({@link estimate}). 재산세액 공제(제9조 ③)와 세부담 상한(제10조)은
 * 넣지 않았다 — 둘 다 세액을 낮추기만 하므로, 여기 값은 **"이보다 크지 않다"** 는 상한이다.
 */
import rates from "../rates/comprehensive-property-2026.json";

const C = rates;

export type HomeCount = "upTo2Homes" | "from3Homes";

/** 공제금액 — 1세대 1주택이면 12억, 그 밖은 9억. */
export function deductionFor(oneHome: boolean): number {
  const d = C.taxBase.deduction;
  return oneHome ? d.oneHouseholdOneHome : d.other;
}

/** 과세표준 = (공시가격 합계 − 공제) × 공정시장가액비율. 음수면 0. */
export function taxBase(totalPrice: number, oneHome: boolean): number {
  const after = totalPrice - deductionFor(oneHome);
  if (after <= 0) return 0;
  return Math.floor(after * C.taxBase.ratio);
}

/** 과세표준 → 세액. 주택 수에 따라 표가 갈린다. */
export function taxOn(base: number, homes: HomeCount): number {
  if (base <= 0) return 0;
  let prev = 0;
  for (const b of C.rates[homes].brackets) {
    if (b.upTo === null || base <= b.upTo) {
      return Math.floor(b.base + (base - prev) * b.rate);
    }
    prev = b.upTo;
  }
  return 0;
}

export interface Result {
  deduction: number;
  base: number;
  tax: number;
  /** 공제만으로 0원이 되는가 */
  exempt: boolean;
}

export function compute(opts: {
  totalPrice: number;
  oneHome?: boolean;
  homes?: HomeCount;
}): Result {
  const { totalPrice, oneHome = false, homes = "upTo2Homes" } = opts;
  const deduction = deductionFor(oneHome);
  const base = taxBase(totalPrice, oneHome);
  return { deduction, base, tax: taxOn(base, homes), exempt: base === 0 };
}

/** 분납할 수 있는 금액. 250만원을 넘어야 시작된다. */
export function installmentAmount(tax: number): number {
  const [low, high] = C.installment.tiers;
  if (tax > high.over) return Math.floor(tax * 0.5);
  if (tax > low.over) return tax - low.over;
  return 0;
}

/** 1세대 1주택자 세액공제율 — 나이(제6항 표) + 보유기간(제8항 표), 합계 80%까지(제5항) */
export function oneHomeCreditRate(age: number, years: number) {
  const pick = (rows: { from: number; to: number | null; rate: number }[], v: number) =>
    rows.find((x) => v >= x.from && (x.to === null || v < x.to))?.rate ?? 0;
  const a = pick(C.oneHomeCredit.age, age);
  const h = pick(C.oneHomeCredit.hold, years);
  return { age: a, hold: h, total: Math.min(a + h, C.oneHomeCredit.cap) };
}

export interface Estimate extends Result {
  /** 1세대 1주택 세액공제액(재산세액 공제 전 산출세액 기준이라 실제보다 크거나 같다) */
  credit: number;
  creditRate: number;
  /** 종부세(재산세액 공제·세부담 상한 전) */
  afterCredit: number;
  /** 농어촌특별세 20% */
  rural: number;
  /** 종부세 + 농특세 — 이보다 크지 않다 */
  total: number;
}

/**
 * 종부세 상한 어림. 1세대 1주택이면 나이·보유기간 공제를 적용한다.
 * 실제로는 재산세액 공제 후 세액에 공제율을 곱하므로, 공제 전 세액에 곱한 이 값은
 * 최종 세액의 상한이 된다: (T − P)(1 − r) ≤ T(1 − r).
 */
export function estimate(opts: { totalPrice: number; oneHome?: boolean; homes?: HomeCount; age?: number; years?: number }): Estimate {
  const r0 = compute(opts);
  const rate = opts.oneHome ? oneHomeCreditRate(opts.age ?? 0, opts.years ?? 0).total : 0;
  const credit = Math.floor(r0.tax * rate);
  const afterCredit = r0.tax - credit;
  const rural = Math.floor(afterCredit * C.ruralTax.rate);
  return { ...r0, credit, creditRate: rate, afterCredit, rural, total: afterCredit + rural };
}

/**
 * 부부 공동명의 1주택 — 각자 9억 공제(기본) vs 1명을 1세대 1주택자로 신청(12억 공제 + 세액공제).
 * 지분은 반반으로 본다. 둘 다 재산세액 공제 전 상한값.
 */
export function jointCompare(totalPrice: number, age: number, years: number) {
  const half = Math.floor(totalPrice / 2);
  const each = estimate({ totalPrice: half, oneHome: false });
  const separate = each.total * 2;
  const asOne = estimate({ totalPrice, oneHome: true, age, years });
  return { separate, asOne: asOne.total, each, one: asOne };
}

export const RATIO = C.taxBase.ratio;
export const DEDUCTION = C.taxBase.deduction;
export const PAYMENT = C.payment;
export const SAME_UNTIL = C.rates.sameUntil;
