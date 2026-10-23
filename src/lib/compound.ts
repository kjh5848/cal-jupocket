/**
 * 적립식 복리 — 처음 넣은 돈 + 매달 같은 돈을 예상 연 수익률로 월마다 불렸을 때 얼마가 되나(범용, /tools/compound/).
 *
 *   월 이율 r = 연 수익률 ÷ 12
 *   달마다   월초 적립: 잔액 = (잔액 + 적립) × (1 + r)
 *            월말 적립: 잔액 = 잔액 × (1 + r) + 적립
 *   세금     (최종 잔액 − 넣은 돈)이 양수일 때만 × 세율 — 사용자가 넣는 가정값(기본은 이자·배당 원천징수 15.4%)
 *   물가     세후 금액 ÷ (1 + 연 물가 상승률)^(개월 ÷ 12) — 오늘 돈 가치로 바꾼 값
 *
 * 은행 적금(약관 이자)이 아니라 수익률 가정으로 굴려 보는 투영이라 법 숫자가 없다 — 세율만 rates 에서 기본값을 가져온다.
 * 부동소수로 끝까지 계산하고 화면에 낼 때만 원 단위로 반올림한다. 일 단위 적립·복리는 넣지 않는다(실제로 매일 넣지 않음).
 * 목표 금액을 넣으면 기간 안 도달 개월(goalMonth)과, 못 닿으면 이어서 넣었을 때 도달 개월(goalLater)을 함께 낸다.
 * 원금 0·월초 적립이면 적금 월복리(lib/installment-savings.ts savingsMonthlyInterest)와 같은 식이다 — 테스트로 묶음.
 */
import fin from "../rates/financial-income-2026.json";

export type Timing = "start" | "end";

/** 이자·배당소득 원천징수 14% + 지방소득세 그 10% = 15.4%(소득세법 제129조 ①, 지방세법 제103조의13) */
export const DEFAULT_TAX_PCT = Math.round(fin.withholding.interest * (1 + fin.local.ratio) * 1000) / 10;

export interface CompoundInput {
  /** 처음 넣는 돈(원) */
  principal: number;
  /** 매달 넣는 돈(원) */
  monthly: number;
  /** 예상 연 수익률(%) — 음수 가능 */
  ratePct: number;
  /** 기간(개월) */
  months: number;
  timing: Timing;
  /** 수익에 매길 세율(%) */
  taxPct: number;
  /** 연 물가 상승률(%) */
  inflationPct: number;
  /** 목표 금액(원) — 없으면 0 */
  goal?: number;
}

export interface CompoundYear {
  /** 몇 년째(마지막 해는 남은 개월만) */
  year: number;
  /** 이 해 끝의 개월 수 */
  month: number;
  /** 이 해에 넣은 돈(처음 원금 제외) */
  paid: number;
  /** 이 해에 불어난 돈 */
  gain: number;
  /** 이 해 끝 잔액 */
  balance: number;
}

export interface CompoundResult {
  balance: number;
  /** 넣은 돈 합계 = 원금 + 매달 × 개월 */
  paid: number;
  /** 세전 수익 = 잔액 − 넣은 돈 */
  gain: number;
  tax: number;
  afterTax: number;
  /** 물가를 빼고 오늘 돈으로 본 세후 금액 */
  real: number;
  /** 잔액이 목표에 처음 닿은 개월(못 닿으면 null) */
  goalMonth: number | null;
  /** 기간 안에 못 닿았을 때, 같은 조건으로 계속 넣으면 처음 닿는 개월(GOAL_CAP_MONTHS 안에 못 닿으면 null) */
  goalLater: number | null;
  years: CompoundYear[];
}

/** 기간 밖 목표 도달을 찾는 상한 — 페이지 기간 상한(1200개월 = 100년)과 같다 */
export const GOAL_CAP_MONTHS = 1200;

export function compound(input: CompoundInput): CompoundResult {
  const { principal, monthly, ratePct, timing, taxPct, inflationPct } = input;
  const months = Math.max(0, Math.floor(input.months));
  const goal = input.goal ?? 0;
  const r = ratePct / 100 / 12;
  let bal = principal;
  let paid = principal;
  let goalMonth: number | null = goal > 0 && bal >= goal ? 0 : null;
  const years: CompoundYear[] = [];
  let yPaid = 0;
  let yStart = bal;
  for (let m = 1; m <= months; m++) {
    bal = timing === "start" ? (bal + monthly) * (1 + r) : bal * (1 + r) + monthly;
    paid += monthly;
    yPaid += monthly;
    if (goalMonth === null && goal > 0 && bal >= goal) goalMonth = m;
    if (m % 12 === 0 || m === months) {
      years.push({ year: Math.ceil(m / 12), month: m, paid: yPaid, gain: bal - yStart - yPaid, balance: bal });
      yPaid = 0;
      yStart = bal;
    }
  }
  // 기간 안에 못 닿았으면 같은 적립·수익률로 이어서 굴려 본다 — 잔액·세금·연도별 표는 기간까지만
  let goalLater: number | null = null;
  if (goal > 0 && goalMonth === null) {
    let b = bal;
    for (let m = months + 1; m <= GOAL_CAP_MONTHS; m++) {
      b = timing === "start" ? (b + monthly) * (1 + r) : b * (1 + r) + monthly;
      if (b >= goal) {
        goalLater = m;
        break;
      }
    }
  }
  const gain = bal - paid;
  const tax = Math.max(0, gain) * (taxPct / 100);
  const afterTax = bal - tax;
  const real = afterTax / Math.pow(1 + inflationPct / 100, months / 12);
  return { balance: bal, paid, gain, tax, afterTax, real, goalMonth, goalLater, years };
}

/** 화면용 원 단위 반올림 */
export const won = (x: number) => Math.round(x);
