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
 * ⚠️ 이 파일은 **뼈대만** 계산한다. 고령자·장기보유 세액공제와 재산세액
 * 공제, 세부담 상한을 넣지 않았다 — 조문을 읽지 않았고, 그것들이 실제
 * 세액을 크게 낮춘다. 그래서 여기 값은 **상한에 가까운 어림값**이다.
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

export const RATIO = C.taxBase.ratio;
export const DEDUCTION = C.taxBase.deduction;
export const PAYMENT = C.payment;
export const SAME_UNTIL = C.rates.sameUntil;
