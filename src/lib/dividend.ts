/**
 * 배당금 — 국내 상장주식·ETF 현금배당을 지급 건마다 원천징수한 뒤 받는 돈.
 *
 *   1회 지급액  1주당 배당(1회분) × 주식 수, 원 미만 버림 (연간 합계로 넣으면 ÷ 지급 횟수)
 *   소득세      1회 지급액 × 14% 에서 10원 미만 버림(소득세법 제129조 ① 2호, 국고금 관리법 제47조 ①)
 *               이 금액이 1천원 미만이면 떼지 않는다(제86조 1호 — 배당소득은 제외 대상이 아님)
 *   지방소득세  소득세 × 10% 에서 10원 미만 버림(지방세법 제103조의13)
 *   연간       1회 세후 × 지급 횟수
 *
 * 1회 지급액의 원 미만 처리는 법령 규정이 없어(배당 결의·증권사 지급) 원 미만 버림으로 둔다.
 * rates: dividend-2026.json(소액 부징수), financial-income-2026.json(세율·2천만원)
 *
 * 목표 역산은 제86조 때문에 주식 수와 세후 배당이 단조 증가하지 않는다(1회 7,142원 → 세후 7,142원, 7,143원 → 6,043원).
 * 그래서 나눗셈 근사가 아니라 '세후 ≥ 목표'를 만족하는 가장 작은 주식 수를 직접 찾는다.
 */
import fin from "../rates/financial-income-2026.json";
import div from "../rates/dividend-2026.json";

export type DividendBasis = "payment" | "annual";
/** 1년 지급 횟수 — 매월·분기·반기·연 1회 */
export type DividendFreq = 12 | 4 | 2 | 1;

export const DIVIDEND_RATE = fin.withholding.dividend;
export const LOCAL_RATIO = fin.local.ratio;
export const THRESHOLD = fin.threshold.amount;
export const SMALL_AMOUNT = div.smallAmount.amount;

/** 10원 미만 버림(국고금 관리법 제47조 ①) */
const cut10 = (v: number) => Math.floor(v / 10) * 10;
const RATE_PCT = Math.round(DIVIDEND_RATE * 100);
const LOCAL_PCT = Math.round(LOCAL_RATIO * 100);

/** 1회 지급분 세금 */
export function paymentTax(gross: number) {
  const g = Math.max(0, Math.floor(gross));
  const raw = cut10(Math.floor((g * RATE_PCT) / 100));
  const exempt = raw < SMALL_AMOUNT;
  const incomeTax = exempt ? 0 : raw;
  const localTax = cut10(Math.floor((incomeTax * LOCAL_PCT) / 100));
  return { gross: g, incomeTax, localTax, tax: incomeTax + localTax, net: g - incomeTax - localTax, exempt };
}

export interface DividendInput {
  /** 1주당 배당금(원) — basis 가 payment 면 1회분, annual 이면 1년 합계 */
  perShare: number;
  basis: DividendBasis;
  freq: DividendFreq;
  /** 보유 주식 수 */
  shares: number;
  /** 지금 주가(원) — 수익률·필요 투자금에만 쓴다. 0 이면 계산 안 함 */
  price?: number;
  /** 목표 월평균 세후 배당(원) — 0 이면 역산 안 함 */
  targetMonthly?: number;
}

/** 주식 n주일 때 1회 세전 지급액 */
function grossFor(perShare: number, basis: DividendBasis, freq: DividendFreq, n: number) {
  return basis === "annual" ? Math.floor((perShare * n) / freq + 1e-9) : Math.floor(perShare * n + 1e-9);
}

/** 연 세후 배당이 goal 이상이 되는 가장 작은 주식 수(못 찾으면 null) */
export function sharesForAnnualNet(perShare: number, basis: DividendBasis, freq: DividendFreq, goal: number): number | null {
  if (goal <= 0) return 0;
  const annualPerShare = basis === "annual" ? perShare : perShare * freq;
  if (annualPerShare <= 0) return null;
  const netOf = (n: number) => paymentTax(grossFor(perShare, basis, freq, n)).net * freq;
  // 세금이 없을 때도 세전보다 많이 받을 수는 없으므로 이보다 적은 주식으로는 닿지 않는다
  let n = Math.max(1, Math.ceil(goal / annualPerShare - 1e-9));
  if (n > 1e9) return null;
  while (grossFor(perShare, basis, freq, n) * freq < goal) n++;
  if (netOf(n) >= goal) return n;
  // 여기부터는 세금을 떼는 구간 — 끝수를 버려도 1회 세후는 세전 × (1 − 15.4%) + 21원을 넘지 않는다(30원 여유)
  const perPay = annualPerShare / freq;
  const keep = 1 - DIVIDEND_RATE * (1 + LOCAL_RATIO);
  n = Math.max(n, Math.floor((goal / freq - 30) / keep / perPay) - 1);
  for (let k = 0; k < 1_000_000; k++, n++) if (netOf(n) >= goal) return n;
  return null;
}

export function dividend(input: DividendInput) {
  const perShare = Math.max(0, input.perShare);
  const shares = Math.max(0, Math.floor(input.shares));
  const price = Math.max(0, Math.floor(input.price ?? 0));
  const target = Math.max(0, Math.floor(input.targetMonthly ?? 0));
  const { basis, freq } = input;

  const pay = paymentTax(grossFor(perShare, basis, freq, shares));
  const annualGross = pay.gross * freq;
  const annualTax = pay.tax * freq;
  const annualNet = pay.net * freq;
  const annualPerShare = basis === "annual" ? perShare : perShare * freq;
  const value = shares * price;

  const goal = target * 12;
  const need = target > 0 ? sharesForAnnualNet(perShare, basis, freq, goal) : null;
  const needPay = need !== null ? paymentTax(grossFor(perShare, basis, freq, need)) : null;

  return {
    perPayment: pay,
    annualGross,
    annualIncomeTax: pay.incomeTax * freq,
    annualLocalTax: pay.localTax * freq,
    annualTax,
    annualNet,
    /** 연 세후 ÷ 12 — 매달 들어오는 돈이 아니라 평균 */
    monthlyNet: Math.floor(annualNet / 12),
    annualPerShare,
    value,
    /** 세전 배당수익률(1주당 연 배당 ÷ 주가) */
    grossYield: price > 0 ? annualPerShare / price : null,
    /** 세후 배당수익률(연 세후 ÷ 평가금액) */
    netYield: value > 0 ? annualNet / value : null,
    overThreshold: annualGross > THRESHOLD,
    target: need === null
      ? null
      : {
          goal,
          shares: need,
          annualGross: needPay!.gross * freq,
          annualNet: needPay!.net * freq,
          invest: price > 0 ? need * price : null,
          moreShares: Math.max(0, need - shares),
          moreInvest: price > 0 ? Math.max(0, need - shares) * price : null,
          progress: goal > 0 ? annualNet / goal : 0,
          overThreshold: needPay!.gross * freq > THRESHOLD,
        },
  };
}
