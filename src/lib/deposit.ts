/**
 * 정기예금 이자 — 원금을 한 번 넣고 만기에 원금과 이자를 한 번에 받는 예금.
 *
 *   단리     원금 × 연 이자율 × 개월 ÷ 12
 *   월복리   원금 × {(1 + 연 이자율 ÷ 12)^개월 − 1}
 *   세금     소득세 = 이자 × 14% 에서 10원 미만 버림(소득세법 제129조 ① 1호, 국고금 관리법 제47조 ①)
 *            지방소득세 = 소득세 × 10% 에서 10원 미만 버림(지방세법 제103조의13, 지방세기본법 제59조)
 *
 *   조합예탁금 소득세 = 이자 × 5%(2026년 가입) 또는 0(2025년까지 가입, 비과세), 지방소득세 없음(조세특례제한법 제89조의3 ①)
 *            농어촌특별세 = (이자 × 14% − 낸 소득세) × 10% 에서 10원 미만 버림(농어촌특별세법 제5조 ① 2호·④)
 *            농어민·임업인 등은 농특세 면제(같은 법 시행령 제4조 ⑦ 3호) — 해당 여부는 사용자가 고른다
 *
 * 이자의 원 미만 처리는 법령 규정이 없어(예금 약정) 원 미만 버림. rates: deposit-2026.json
 * 일수 계산·일복리·월이자 지급식·조합예탁금 3천만원 초과분 나누기는 넣지 않는다(초과는 안내만).
 */
import fin from "../rates/financial-income-2026.json";
import dep from "../rates/deposit-2026.json";

export type DepositMethod = "simple" | "monthly";
export type DepositTax = "normal" | "free";
/** 예금 계산기만 쓰는 과세 — 조합예탁금 2026년 가입(5%)·2025년까지 가입(비과세) */
export type DepositTaxMode = DepositTax | "coop2026" | "coop2025";

export interface DepositInput {
  /** 원금(원) */
  principal: number;
  /** 연 이자율(%) — 3.5 는 연 3.5% */
  ratePct: number;
  /** 예치 기간(개월) */
  months: number;
  method: DepositMethod;
  tax: DepositTaxMode;
  /** 조합예탁금일 때 농어촌특별세 면제 대상(농어민·임업인 등)인가 */
  ruralExempt?: boolean;
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
  /** 농어촌특별세 — 조합예탁금만 */
  ruralTax: number;
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
  /** 조합예탁금인데 원금이 1명당 한도(3천만원)를 넘는가 — 넘는 금액은 일반과세라 안내만 */
  overCoopLimit: boolean;
  rows: DepositRow[];
}

export const INTEREST_RATE = fin.withholding.interest;
export const LOCAL_RATIO = fin.local.ratio;
export const THRESHOLD = fin.threshold.amount;
export const COOP = dep.coop;

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

/** 조합예탁금 세금 — 소득세(5% 또는 0)·지방소득세 0·농어촌특별세 */
export function coopTax(interest: number, mode: "coop2026" | "coop2025", ruralExempt = false) {
  const incomeTax = mode === "coop2026" ? cut10(Math.floor((interest * Math.round(COOP.rate2026 * 100)) / 100)) : 0;
  const reduced = Math.max(0, Math.floor((interest * Math.round(COOP.ruralBase * 100)) / 100) - incomeTax);
  const ruralTax = ruralExempt ? 0 : cut10(Math.floor((reduced * Math.round(COOP.ruralRate * 100)) / 100));
  return { incomeTax, localTax: 0, ruralTax };
}

export function depositInterest(input: DepositInput): DepositResult {
  const principal = Math.max(0, Math.floor(input.principal));
  const ratePct = Math.max(0, input.ratePct);
  const months = Math.max(1, Math.floor(input.months));
  const s = simpleInterest(principal, ratePct, months);
  const m = monthlyCompoundInterest(principal, ratePct, months);
  const grossInterest = input.method === "monthly" ? m : s;
  const coop = input.tax === "coop2026" || input.tax === "coop2025";
  const { incomeTax, localTax, ruralTax } =
    input.tax === "coop2026" || input.tax === "coop2025"
      ? coopTax(grossInterest, input.tax, input.ruralExempt)
      : { ...depositTax(grossInterest, input.tax), ruralTax: 0 };
  const tax = incomeTax + localTax + ruralTax;
  const netInterest = grossInterest - tax;
  const fn = input.method === "monthly" ? monthlyCompoundInterest : simpleInterest;
  const rows = Array.from({ length: months }, (_, k) => ({ month: k + 1, interest: fn(principal, ratePct, k + 1) }));
  return {
    principal,
    grossInterest,
    incomeTax,
    localTax,
    ruralTax,
    tax,
    netInterest,
    maturity: principal + netInterest,
    netAnnualRate: principal ? (netInterest / principal) * (12 / months) : 0,
    simpleInterest: s,
    monthlyInterest: m,
    overThreshold: !coop && grossInterest > THRESHOLD,
    overCoopLimit: coop && principal > COOP.limit,
    rows,
  };
}
