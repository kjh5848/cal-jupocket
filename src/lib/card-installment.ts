/**
 * 신용카드 할부 수수료 — 결제 금액을 N개월로 나눌 때 회차마다 내는 원금·수수료(범용, /tools/card-installment/).
 *
 *   월 원금     결제 금액 ÷ 할부 개월(원 미만 버림), 나눠떨어지지 않고 남는 원은 1회차에 더한다
 *               (우리은행·SC제일은행 할부 계산기 안내 '1원 미만의 금액은 첫회의 월납입액에 포함')
 *   수수료      회차 시작 할부잔액 × 연 수수료율 × 사용일수 ÷ 365(윤년 366) — 여신금융협회 신용카드 이용자 가이드,
 *               현대카드·신한카드 안내도 같은 식. 할부잔액 = 이용원금 − 이미 낸 원금.
 *               · 날짜로   1회차는 이용일 ~ 첫 결제일, 그다음은 결제일 ~ 다음 결제일(매달 첫 결제일과 같은 날, 없으면 말일).
 *                          해를 넘는 회차는 해마다 날수를 나눠 더한다(lib/overdraft 와 같게).
 *               · 어림     한 달 = 1년의 1/12 로 본다(잔액 × 연율 ÷ 12). 우리은행 계산기의 총 수수료
 *                          '할부원금 × 수수료율 × (개월 + 1) / 2 / 12' 가 이 방식의 합이다.
 *   무이자      전액 무이자는 모든 회차 수수료 0. 부분무이자(슬림할부)는 앞 회차 수수료를 고객이 내고 나머지 회차가
 *               무이자다 — 신한카드 2026년 7월 슬림할부 안내 '1~5회차 이자 고객부담 6회차부터 잔여 회차 무이자'(12개월).
 *
 * 단수: 법령·안내에 할부수수료 원 단위 처리 규정이 없다. 회차 수수료를 원 미만 버림(lib/loan 과 같게).
 * 연율은 0.01% 단위 정수로 바꿔 BigInt 로 나눈다 — 3,000,000 × 19.9% ÷ 12 가 부동소수로 49,749.999… 가 되어
 * 1원 모자라는 것을 막는다. 카드사마다 결제일·이용기간 기준·끝수가 달라 실제 청구서와 몇 원~몇백 원 다를 수 있다.
 */
import { parseDate, splitDays } from "./overdraft";

export type FeeMode = "normal" | "free" | "partial";

export interface InstallmentInput {
  /** 결제 금액(원) */
  amount: number;
  /** 할부 개월 2~60 */
  months: number;
  /** 연 할부 수수료율(%) */
  ratePct: number;
  /** 일반 · 전액 무이자 · 부분무이자 */
  mode: FeeMode;
  /** 부분무이자에서 수수료를 고객이 내는 앞 회차 수(1 ~ 개월 − 1) */
  paidTerms?: number;
  /** 있으면 날짜로(일할), 없으면 어림(÷12). YYYY-MM-DD */
  dates?: { use: string; firstBill: string };
}

export interface InstallmentRow {
  term: number;
  /** 결제일(날짜로 계산할 때만) */
  bill?: string;
  /** 수수료를 붙인 날수(날짜로 계산할 때만) */
  days?: number;
  /** 회차 시작 할부잔액 */
  balance: number;
  principal: number;
  fee: number;
  payment: number;
  /** 무이자 회차 */
  free: boolean;
}

export type InstallmentResult =
  | {
      ok: true;
      rows: InstallmentRow[];
      totalFee: number;
      totalPaid: number;
      firstPayment: number;
      /** 같은 조건에서 모든 회차에 수수료가 붙었을 때 총 수수료 */
      normalFee: number;
    }
  | { ok: false; reason: "amount" | "months" | "rate" | "paid-terms" | "dates" };

export const MIN_MONTHS = 2;
export const MAX_MONTHS = 60;

const DAY = 86_400_000;
/** 연율(%) → 0.01% 단위 정수 */
const bp = (ratePct: number) => BigInt(Math.round(ratePct * 100));

/** 잔액 × 연율 ÷ 12, 원 미만 버림 */
export function monthlyFee(balance: number, ratePct: number): number {
  return Number((BigInt(balance) * bp(ratePct)) / 120_000n);
}

/** [from, to) 날수로 잔액 × 연율 × 날수 ÷ 365(윤년 366), 원 미만 버림 */
export function dailyFee(balance: number, ratePct: number, from: number, to: number): number {
  const { common, leap } = splitDays(from, to);
  const num = BigInt(balance) * bp(ratePct) * BigInt(common * 366 + leap * 365);
  return Number(num / (10_000n * 365n * 366n));
}

/** 첫 결제일에서 k 달 뒤 같은 날(그 달에 없으면 말일) */
export function billAfter(first: number, k: number): number {
  const d = new Date(first);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + k;
  const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return Date.UTC(y, m, Math.min(d.getUTCDate(), last));
}

function schedule(inp: InstallmentInput, charged: (term: number) => boolean): InstallmentRow[] | "dates" {
  const { amount, months, ratePct } = inp;
  const base = Math.floor(amount / months);
  const first = amount - base * (months - 1);
  let use = NaN;
  let firstBill = NaN;
  if (inp.dates) {
    use = parseDate(inp.dates.use);
    firstBill = parseDate(inp.dates.firstBill);
    if (!Number.isFinite(use) || !Number.isFinite(firstBill) || firstBill <= use) return "dates";
  }
  const rows: InstallmentRow[] = [];
  let balance = amount;
  for (let term = 1; term <= months; term++) {
    const principal = term === 1 ? first : base;
    const on = charged(term);
    const row: InstallmentRow = { term, balance, principal, fee: 0, payment: 0, free: !on };
    if (inp.dates) {
      const to = billAfter(firstBill, term - 1);
      const from = term === 1 ? use : billAfter(firstBill, term - 2);
      row.bill = new Date(to).toISOString().slice(0, 10);
      row.days = Math.round((to - from) / DAY);
      if (on) row.fee = dailyFee(balance, ratePct, from, to);
    } else if (on) row.fee = monthlyFee(balance, ratePct);
    row.payment = principal + row.fee;
    rows.push(row);
    balance -= principal;
  }
  return rows;
}

export function installmentPlan(inp: InstallmentInput): InstallmentResult {
  const { amount, months, ratePct, mode } = inp;
  if (!Number.isInteger(amount) || amount <= 0) return { ok: false, reason: "amount" };
  if (!Number.isInteger(months) || months < MIN_MONTHS || months > MAX_MONTHS) return { ok: false, reason: "months" };
  if (!Number.isFinite(ratePct) || ratePct < 0 || ratePct > 100) return { ok: false, reason: "rate" };
  const paid = inp.paidTerms ?? 0;
  if (mode === "partial" && (!Number.isInteger(paid) || paid < 1 || paid >= months)) return { ok: false, reason: "paid-terms" };

  const charged = (term: number) => (mode === "normal" ? true : mode === "free" ? false : term <= paid);
  const rows = schedule(inp, charged);
  if (rows === "dates") return { ok: false, reason: "dates" };
  const all = mode === "normal" ? rows : (schedule(inp, () => true) as InstallmentRow[]);

  const totalFee = rows.reduce((s, r) => s + r.fee, 0);
  return {
    ok: true,
    rows,
    totalFee,
    totalPaid: amount + totalFee,
    firstPayment: rows[0].payment,
    normalFee: all.reduce((s, r) => s + r.fee, 0),
  };
}

/** 우리은행 할부 계산기 안내의 총 수수료 근사식 — 할부원금 × 수수료율 × (개월 + 1) / 2 / 12 (원 미만 버림) */
export function approxTotalFee(amount: number, months: number, ratePct: number): number {
  return Number((BigInt(amount) * bp(ratePct) * BigInt(months + 1)) / 240_000n);
}
