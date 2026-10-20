/**
 * 일본 雇用保険 育児休業等給付 — 일본어판 /ja/childcare-leave-benefit/ 가 쓴다. 근거는 rates/jp/childcare-leave-benefit-2026.json.
 *
 * 원문(厚生労働省 パンフレット 2026(令和8)年8月1日改訂版·Q&A～育児休業等給付～, 雇用保険法 第17条·第61条の7·8·10, 2026-10-21 확인):
 * - 休業開始時賃金日額 = 직근 6か月 賃金 ÷ 180, 小数点以下 切り捨て(業務取扱要領 50615·59524), 上限 16,540円·下限 3,203円
 *   (令和8年8月1日~令和9年7月31日 — 2027-08-01 改定 전에 다시 확인).
 * - 育児休業給付金 = 賃金日額 × 支給日数(1支給単位期間 30日, 마지막 기간은 실제 日数) × 67%(181日目 이후 50%).
 * - 出生時育児休業給付金 = 賃金日額 × 日数(28日 상한) × 67%.
 * - 出生後休業支援給付金 = 賃金日額 × 対象期間 休業日数(28日 상한) × 13% — 賃金으로 감액되지 않지만 育児休業給付가 0円이면 0円(Q41).
 * - 휴업 중 賃金: 賃金 + 給付 ≥ 賃金日額 × 日数 × 80% 이면 80% − 賃金, 賃金 ≥ 80% 이면 不支給.
 * - 支給額 1円未満 切り捨て(国等の債権債務等の金額の端数計算に関する法律 第2条第1項).
 *
 * 율은 정수 %로 곱하고 나눈다(16,540 × 28 × 13% = 60,205.6 → 60,205円).
 * 계산하지 않는 것: 出生時 日数를 180日에 通算해 한 支給単位期間 안에서 67%·50%가 갈리는 경우의 끝수,
 * 日給·時間給 등의 最低保障(第17条第2項), 11日 미만 달을 빼는 판단, 수급 자격 판정.
 */
import rates from "../../rates/jp/childcare-leave-benefit-2026.json";

const W = rates.wageDailyAmount;
export const DIVISOR = W.divisor; // 180
export const DAILY_UPPER = W.upperYen; // 16,540
export const DAILY_LOWER = W.lowerYen; // 3,203
export const LIMITS_VALID_UNTIL = W.validUntil; // 2027-07-31

const pct = (r: number) => Math.round(r * 100);
export const RATE_FIRST = pct(rates.childcareLeaveBenefit.rateFirst180Days); // 67
export const RATE_AFTER = pct(rates.childcareLeaveBenefit.rateFrom181stDay); // 50
export const RATE_BIRTH = pct(rates.birthTimeBenefit.rate); // 67
export const RATE_SUPPORT = pct(rates.postBirthSupportBenefit.rate); // 13
export const CAP_PCT = 80;
export const DAYS_PER_PERIOD = 30;
export const FIRST_RATE_DAYS = 180;
export const BIRTH_MAX_DAYS = rates.birthTimeBenefit.maxDays; // 28
export const SUPPORT_MAX_DAYS = rates.postBirthSupportBenefit.maxDays; // 28

const int = (n: number) => (Number.isFinite(n) && n > 0 ? Math.floor(n) : 0);

export interface WageDaily {
  /** ÷ 180 뒤 小数点以下 切り捨て(상·하한 전) */
  raw: number;
  /** 상·하한을 적용한 休業開始時賃金日額 */
  applied: number;
  limit: "upper" | "lower" | null;
}

/** 休業開始時賃金日額 — 6か月 賃金 합계 ÷ 180(小数点以下 切り捨て), 上限·下限 적용 */
export function wageDaily(sixMonthTotal: number): WageDaily {
  const raw = Math.floor(int(sixMonthTotal) / DIVISOR);
  if (raw > DAILY_UPPER) return { raw, applied: DAILY_UPPER, limit: "upper" };
  if (raw < DAILY_LOWER) return { raw, applied: DAILY_LOWER, limit: "lower" };
  return { raw, applied: raw, limit: null };
}

/**
 * 1期間의 支給額 — 賃金日額 × 日数 × 율(1円未満 切り捨て), 휴업 중 賃金이 있으면 80% 규칙.
 * 育児休業給付金·出生時育児休業給付金 공통.
 */
export function periodBenefit(daily: number, days: number, ratePct: number, wage = 0): number {
  const base = int(daily) * int(days);
  const full = Math.floor((base * ratePct) / 100);
  const w = int(wage);
  if (w === 0) return full;
  const cap = Math.floor((base * CAP_PCT) / 100) - w;
  return Math.max(0, Math.min(full, cap));
}

/** 出生後休業支援給付金 — 賃金日額 × min(日数, 28) × 13%, 賃金으로 감액하지 않음 */
export function supportBenefit(daily: number, days: number): number {
  return Math.floor((int(daily) * Math.min(int(days), SUPPORT_MAX_DAYS) * RATE_SUPPORT) / 100);
}

export interface ChildcareInput {
  /** 休業開始前 6か月の賃金の合計(賞与を除く・控除前) */
  sixMonthTotal: number;
  /** 育児休業 — 30日の支給単位期間の数 */
  leaveMonths: number;
  /** 最後の支給単位期間の日数(0〜29, 0 なら端数なし) */
  leaveExtraDays: number;
  /** 育児休業中に1支給単位期間ごとに支払われる賃金 */
  wagePerPeriod: number;
  /** 出生時育児休業(産後パパ育休)の日数 — 0〜28, 賃金なしとして計算 */
  birthLeaveDays: number;
  /** 出生後休業支援給付金の対象期間内の休業日数 — 0 なら計算しない */
  supportDays: number;
}

export interface Period {
  index: number;
  days: number;
  ratePct: number;
  amount: number;
}

export interface ChildcareResult {
  daily: WageDaily;
  periods: Period[];
  /** 育児休業給付金 합계 */
  childcareTotal: number;
  /** 30日・67% の1か月分(賃金控除後) */
  perMonthFirst: number;
  /** 30日・50% の1か月分(賃金控除後) */
  perMonthAfter: number;
  birthTime: number;
  support: number;
  total: number;
}

export function childcareBenefit(i: ChildcareInput): ChildcareResult {
  const daily = wageDaily(i.sixMonthTotal);
  const d = daily.applied;
  const months = int(i.leaveMonths);
  const extra = Math.min(int(i.leaveExtraDays), DAYS_PER_PERIOD - 1);
  const wage = int(i.wagePerPeriod);
  const periods: Period[] = [];
  const dayList = [...Array(months).fill(DAYS_PER_PERIOD), ...(extra > 0 ? [extra] : [])];
  // 育児休業만 — 1~6期間(180日)이 67%, 7期間째부터 50%. 30日 단위라 기간 안에서 갈리지 않는다.
  dayList.forEach((days, k) => {
    const ratePct = k < FIRST_RATE_DAYS / DAYS_PER_PERIOD ? RATE_FIRST : RATE_AFTER;
    periods.push({ index: k + 1, days, ratePct, amount: periodBenefit(d, days, ratePct, wage) });
  });
  const childcareTotal = periods.reduce((s, p) => s + p.amount, 0);
  const birthDays = Math.min(int(i.birthLeaveDays), BIRTH_MAX_DAYS);
  const birthTime = periodBenefit(d, birthDays, RATE_BIRTH);
  // Q41 — 함께 받는 育児休業給付가 0円이면 支援給付金도 0円
  const support = i.supportDays > 0 && childcareTotal + birthTime > 0 ? supportBenefit(d, i.supportDays) : 0;
  return {
    daily,
    periods,
    childcareTotal,
    perMonthFirst: periodBenefit(d, DAYS_PER_PERIOD, RATE_FIRST, wage),
    perMonthAfter: periodBenefit(d, DAYS_PER_PERIOD, RATE_AFTER, wage),
    birthTime,
    support,
    total: childcareTotal + birthTime + support,
  };
}

export function formatYen(yen: number): string {
  return Math.floor(yen).toLocaleString("ja-JP") + "円";
}
