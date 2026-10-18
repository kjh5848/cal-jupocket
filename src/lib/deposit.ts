/**
 * 정기예금 이자 — 원금을 한 번 넣고 만기에 원금과 이자를 한 번에 받는 예금.
 *
 *   단리     원금 × 연 이자율 × 개월 ÷ 12
 *   월복리   원금 × {(1 + 연 이자율 ÷ 12)^개월 − 1}
 *   세금     소득세 = 이자 × 14% 에서 10원 미만 버림(소득세법 제129조 ① 1호, 국고금 관리법 제47조 ①)
 *            지방소득세 = 소득세 × 10% 에서 10원 미만 버림(지방세법 제103조의13, 지방세기본법 제59조)
 *
 * 이자의 원 미만 처리는 법령 규정이 없어(예금 약정) 원 미만 버림. rates: deposit-2026.json
 * 일수 계산·일복리·월이자 지급식·조합 예탁금 저율과세는 넣지 않는다.
 */
import fin from "../rates/financial-income-2026.json";

export type DepositMethod = "simple" | "monthly";
export type DepositTax = "normal" | "free";

export interface DepositInput {
  /** 원금(원) */
  principal: number;
  /** 연 이자율(%) — 3.5 는 연 3.5% */
  ratePct: number;
  /** 예치 기간(개월) */
  months: number;
  method: DepositMethod;
  tax: DepositTax;
}

export interface DepositRow {
  month: number;
  /** 그 달까지 쌓인 세전 이자 */
  interest: number;
}

export interface DepositResult {
  principal: number;
  grossInterest: number;
  incomeTax: number;
  localTax: number;
  tax: number;
  netInterest: number;
  /** 만기에 받는 돈 = 원금 + 세후 이자 */
  maturity: number;
  /** 세후 이자를 연 수익률로 — 세후 이자 ÷ 원금 × 12 ÷ 개월 */
  netAnnualRate: number;
  /** 같은 조건 단리·월복리 세전 이자(비교용) */
  simpleInterest: number;
  monthlyInterest: number;
  /** 한 해 이자·배당 2천만원(소득세법 제14조 ③ 6호)을 이 예금 하나로 넘는가 */
  overThreshold: boolean;
  rows: DepositRow[];
}

export const INTEREST_RATE = fin.withholding.interest;
export const LOCAL_RATIO = fin.local.ratio;
export const THRESHOLD = fin.threshold.amount;

/** 10원 미만 버림(국고금 관리법 제47조 ①) */
const cut10 = (v: number) => Math.floor(v / 10) * 10;
/** 연 이자율(%)을 1/1000 % 정수로 — 3.33 × 1000 같은 부동소수점 오차를 피한다 */
const milli = (pct: number) => Math.round(pct * 1000);

/** 단리 세전 이자 — 정수 연산(BigInt)으로 원 미만 버림 */
export function simpleInterest(principal: number, ratePct: number, months: number): number {
  return Number((BigInt(principal) * BigInt(milli(ratePct)) * BigInt(months)) / 1_200_000n);
}

/** 월복리 세전 이자 — pow 오차로 x.99999… 가 1원 덜 버려지지 않게 1/1000 원에서 반올림한 뒤 버린다 */
export function monthlyCompoundInterest(principal: number, ratePct: number, months: number): number {
  const i = milli(ratePct) / 100_000 / 12;
  const v = principal * (Math.pow(1 + i, months) - 1);
  return Math.floor(Math.round(v * 1000) / 1000);
}

export function depositTax(interest: number, tax: DepositTax) {
  if (tax === "free") return { incomeTax: 0, localTax: 0 };
  const incomeTax = cut10(Math.floor((interest * Math.round(INTEREST_RATE * 100)) / 100));
  const localTax = cut10(Math.floor((incomeTax * Math.round(LOCAL_RATIO * 100)) / 100));
  return { incomeTax, localTax };
}

export function depositInterest(input: DepositInput): DepositResult {
  const principal = Math.max(0, Math.floor(input.principal));
  const ratePct = Math.max(0, input.ratePct);
  const months = Math.max(1, Math.floor(input.months));
  const s = simpleInterest(principal, ratePct, months);
  const m = monthlyCompoundInterest(principal, ratePct, months);
  const grossInterest = input.method === "monthly" ? m : s;
  const { incomeTax, localTax } = depositTax(grossInterest, input.tax);
  const tax = incomeTax + localTax;
  const netInterest = grossInterest - tax;
  const fn = input.method === "monthly" ? monthlyCompoundInterest : simpleInterest;
  const rows = Array.from({ length: months }, (_, k) => ({ month: k + 1, interest: fn(principal, ratePct, k + 1) }));
  return {
    principal,
    grossInterest,
    incomeTax,
    localTax,
    tax,
    netInterest,
    maturity: principal + netInterest,
    netAnnualRate: principal ? (netInterest / principal) * (12 / months) : 0,
    simpleInterest: s,
    monthlyInterest: m,
    overThreshold: grossInterest > THRESHOLD,
    rows,
  };
}
