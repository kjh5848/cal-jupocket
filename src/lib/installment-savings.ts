/**
 * 정기적금 이자 — 매달 같은 날 같은 돈을 넣고 만기에 원금과 이자를 한 번에 받는 적금.
 *
 * 은행 적립식예금약관 제4조 ① "저축금마다 입금일부터 만기일 전날까지의 기간에 대하여 … 이율로 셈한 이자"
 * — 1회차는 n개월, 마지막 회차는 1개월치 이자만 받는다. 개월 단위로 셈한다(매달 약정일 납입 가정).
 *
 *   단리     월 납입액 × 연 이자율 ÷ 12 × n(n+1)/2
 *   월복리   월 납입액 × Σ{(1 + 연 이자율 ÷ 12)^k − 1}, k = 1…n
 *   세금     예금과 같다 — depositTax()(소득세 14%·지방소득세 그 10%, 각각 10원 미만 버림)
 *
 * 이자의 원 미만 처리는 법령 규정이 없어(약정) 원 미만 버림. rates: installment-savings-2026.json
 * 일수 계산·입금 지연·선납·자유적립식·중도해지·우대금리는 넣지 않는다.
 */
import { depositTax, THRESHOLD, type DepositTax } from "./deposit";

export type SavingsMethod = "simple" | "monthly";

export interface SavingsInput {
  /** 월 납입액(원) */
  monthly: number;
  /** 연 이자율(%) — 3.5 는 연 3.5% */
  ratePct: number;
  /** 납입 기간(개월) = 회차 수 */
  months: number;
  method: SavingsMethod;
  tax: DepositTax;
}

export interface SavingsRow {
  /** 회차(1 = 첫 달) */
  round: number;
  /** 이 회차 돈이 만기까지 이자를 받는 개월 */
  monthsLeft: number;
  /** 이 회차 돈이 받는 세전 이자(원 미만 버림 — 합은 총 이자와 몇 원 다를 수 있다) */
  interest: number;
}

export interface SavingsResult {
  /** 넣은 돈 합계 = 월 납입액 × 개월 */
  principal: number;
  grossInterest: number;
  incomeTax: number;
  localTax: number;
  tax: number;
  netInterest: number;
  /** 만기에 받는 돈 = 원금 + 세후 이자 */
  maturity: number;
  /** 세후 이자 ÷ 넣은 돈 합계 — 기간 전체 누적 비율 */
  netReturn: number;
  /** 넣은 돈 합계를 첫 달부터 예금에 넣었다면 연 몇 %와 같은가(세후) — 세후 이자 ÷ 원금 × 12 ÷ 개월 */
  depositEquivRate: number;
  simpleInterest: number;
  monthlyInterest: number;
  overThreshold: boolean;
  rows: SavingsRow[];
}

/** 연 이자율(%)을 1/1000 % 정수로 — 3.33 × 1000 같은 부동소수점 오차를 피한다 */
const milli = (pct: number) => Math.round(pct * 1000);

/** 단리 세전 이자 — 정수 연산(BigInt)으로 합계에서 원 미만 버림 */
export function savingsSimpleInterest(monthly: number, ratePct: number, months: number): number {
  const tri = (BigInt(months) * BigInt(months + 1)) / 2n;
  return Number((BigInt(monthly) * BigInt(milli(ratePct)) * tri) / 1_200_000n);
}

/** 월복리 세전 이자 — pow 오차로 x.99999… 가 1원 덜 버려지지 않게 1/1000 원에서 반올림한 뒤 버린다 */
export function savingsMonthlyInterest(monthly: number, ratePct: number, months: number): number {
  const i = milli(ratePct) / 100_000 / 12;
  if (i === 0) return 0;
  const v = monthly * (((1 + i) * (Math.pow(1 + i, months) - 1)) / i - months);
  return Math.floor(Math.round(v * 1000) / 1000);
}

function roundInterest(monthly: number, ratePct: number, monthsLeft: number, method: SavingsMethod): number {
  if (method === "simple") return Number((BigInt(monthly) * BigInt(milli(ratePct)) * BigInt(monthsLeft)) / 1_200_000n);
  const i = milli(ratePct) / 100_000 / 12;
  return Math.floor(Math.round(monthly * (Math.pow(1 + i, monthsLeft) - 1) * 1000) / 1000);
}

export function installmentSavings(input: SavingsInput): SavingsResult {
  const monthly = Math.max(0, Math.floor(input.monthly));
  const ratePct = Math.max(0, input.ratePct);
  const months = Math.max(1, Math.floor(input.months));
  const s = savingsSimpleInterest(monthly, ratePct, months);
  const m = savingsMonthlyInterest(monthly, ratePct, months);
  const grossInterest = input.method === "monthly" ? m : s;
  const { incomeTax, localTax } = depositTax(grossInterest, input.tax);
  const tax = incomeTax + localTax;
  const netInterest = grossInterest - tax;
  const principal = monthly * months;
  const rows = Array.from({ length: months }, (_, k) => ({
    round: k + 1,
    monthsLeft: months - k,
    interest: roundInterest(monthly, ratePct, months - k, input.method),
  }));
  return {
    principal,
    grossInterest,
    incomeTax,
    localTax,
    tax,
    netInterest,
    maturity: principal + netInterest,
    netReturn: principal ? netInterest / principal : 0,
    depositEquivRate: principal ? (netInterest / principal) * (12 / months) : 0,
    simpleInterest: s,
    monthlyInterest: m,
    overThreshold: grossInterest > THRESHOLD,
    rows,
  };
}
