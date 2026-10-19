/**
 * 일본 国民年金 第1号被保険者 보험료 — 일본어판 /ja/national-pension/ 가 쓴다.
 *
 * 원문(日本年金機構, 2026-10-20 확인, 令和8年度):
 * - 国民年金保険料(更新日 2026年4月1日) — 月額 17,920円, 付加保険料 月額 400円, 納付期限 翌月末日.
 * - 付加保険料の納付(更新日 2026年7月23日) — 付加年金額(年額) = 200円 × 付加保険料を納付した月数,
 *   例 200円 × 480月 = 96,000円, 847,300円 + 96,000円 = 943,300円.
 * - 国民年金保険料の前納(更新日 2026年9月4日) — 2年·1年·6カ月前納·早割 納付額과 割引額 표.
 *
 * 前納 금액은 할인율로 계산하지 않고 공표 금액을 그대로 쓴다(rates 의 prepay 표).
 * 割引額은 "毎月納付로 낸 합계 − 前納 納付額" 이고, 2年前納의 기준은 令和9年度 보험료(18,290円)를 섞은 434,520円이다.
 */
import rates from "../../rates/jp/national-pension-premium-2026.json";

export type Plan = "monthly" | "early" | "sixMonth" | "oneYear" | "twoYear";
export type Method = "slip" | "debit";

export const MONTHLY = rates.monthlyFlatYen;
export const NEXT_YEAR_MONTHLY = rates.nextFiscalYearMonthlyYen;
export const ADD_ON = rates.optionalAddOnYen;
export const ADD_ON_PENSION_PER_MONTH = rates.addOnPensionPerMonthYen;
export const FULL_BASIC_PENSION = rates.fullBasicPensionYen;

export const PLAN_MONTHS: Record<Plan, number> = rates.prepay.months;

/** 毎月納付로 그 기간을 냈을 때의 합계(割引 비교 기준). 2年前納은 둘째 해를 令和9年度 금액으로 */
export function premiumBaseline(plan: Plan): number {
  if (plan === "twoYear") return MONTHLY * 12 + NEXT_YEAR_MONTHLY * 12;
  return MONTHLY * PLAN_MONTHS[plan];
}

/** 付加保険料 기준(400円 × 개월) */
export function addOnBaseline(plan: Plan): number {
  return ADD_ON * PLAN_MONTHS[plan];
}

export interface Payment {
  /** 그 납부 1회가 덮는 개월 수 */
  months: number;
  /** 定額保険料 1회 납부액 */
  premium: number;
  premiumDiscount: number;
  /** 付加保険料 1회 납부액(안 내면 0) */
  addOn: number;
  addOnDiscount: number;
  /** 1회에 내는 합계 */
  total: number;
  /** 割引 합계(毎月納付와 비교) */
  discount: number;
}

/**
 * 납부 방법별 1회 납부액. 早割은 口座振替만이라 納付書·クレジットカード(slip)면 null.
 */
export function payment(plan: Plan, method: Method, withAddOn: boolean): Payment | null {
  const premium = rates.prepay.premium[method][plan];
  const premiumDiscount = rates.prepay.premiumDiscount[method][plan];
  if (premium === null || premiumDiscount === null) return null;
  const addOn = withAddOn ? (rates.prepay.addOn[method][plan] ?? 0) : 0;
  const addOnDiscount = withAddOn ? (rates.prepay.addOnDiscount[method][plan] ?? 0) : 0;
  return {
    months: PLAN_MONTHS[plan],
    premium,
    premiumDiscount,
    addOn,
    addOnDiscount,
    total: premium + addOn,
    discount: premiumDiscount + addOnDiscount,
  };
}

/** 付加年金額(年額) = 200円 × 付加保険料を納付した月数 */
export function addOnPension(months: number): number {
  return ADD_ON_PENSION_PER_MONTH * Math.max(0, Math.floor(months));
}

/** 付加保険料を毎月納付で納めた合計(400円 × 月数) */
export function addOnPaid(months: number): number {
  return ADD_ON * Math.max(0, Math.floor(months));
}
