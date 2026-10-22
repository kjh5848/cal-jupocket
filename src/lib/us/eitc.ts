/**
 * 미국 연방 Earned Income Tax Credit(26 U.S.C. 32) — 미국판 /en-us/earned-income-credit/ 가 쓴다.
 * 한국 근로장려금과 제도가 달라 짝(hreflang)이 아니다(조사표 25행 미국 칸 '제도').
 *
 * 원문(2026-10-22 확인) — rates/us/eitc-2026.json:
 * - 26 U.S.C. 32(a)(b): credit% × earned income(earned income amount 까지), AGI(또는 더 크면 earned income)가
 *   phaseout amount 를 넘는 만큼 × phaseout% 를 뺀다. 비율 7.65/7.65 · 34/15.98 · 40/21.06 · 45/21.06.
 * - Rev. Proc. 2024-40(2025) · 2025-32(2026) §3.06: 금액·투자소득 한도.
 * - i1040gi Worksheet A: credit = T(earned), AGI ≠ earned 이고 AGI ≥ threshold 면 min(T(earned), T(AGI)).
 * - tableMethod: 2025 EIC Table(Pub 596) 재현 산식 — $50 구간 중간값, 0.5 올림(1,366행·각주 8개 대조).
 *
 * 2026 EIC Table 은 아직 없다 — 2026 값은 Rev. Proc. 2025-32 금액에 같은 산식을 적용한 것.
 * 자격 판정(qualifying child·SSN·거주)·Worksheet B(자영업)·주(州) EITC 는 계산하지 않는다.
 */
import rates from "../../rates/us/eitc-2026.json";

export type Year = 2025 | 2026;
/** mfj = 부부 공동, other = single·HOH·QSS, mfs = 부부 개별(별거 배우자 특례 충족 시 other 열) */
export type Status = "mfj" | "other" | "mfs";
export type Children = 0 | 1 | 2 | 3;

export const SOURCES = rates.sources;
export const NO_CHILD_AGE = rates.noChildAge;
export const ANCHORS = rates.tableMethod.anchorTests;

type ByKids = Record<"0" | "1" | "2" | "3", number>;
interface YearAmounts {
  earnedIncomeAmount: ByKids;
  maxCredit: ByKids;
  thresholdPhaseout: { mfj: ByKids; other: ByKids };
  completedPhaseout: { mfj: ByKids; other: ByKids };
  investmentIncomeLimit: number;
}
const AMOUNTS: Record<Year, YearAmounts> = { 2025: rates.amounts["2025"], 2026: rates.amounts["2026"] };
const PCT = rates.percentages.byChildren;

export const BRACKET = 50;

/** 0.5 올림(부동소수 오차 보정) */
const roundHalfUp = (v: number) => Math.floor(v + 0.5 + 1e-9);
const col = (s: Status): "mfj" | "other" => (s === "mfj" ? "mfj" : "other");
const k = (c: Children) => String(c) as "0" | "1" | "2" | "3";

export interface Params {
  creditPct: number;
  phaseoutPct: number;
  earnedIncomeAmount: number;
  maxCredit: number;
  threshold: number;
  completed: number;
  investmentIncomeLimit: number;
}

/** 그해·신고 상태·자녀 수의 법정 비율과 금액 */
export function params(year: Year, status: Status, children: Children): Params {
  const a = AMOUNTS[year];
  const c = col(status);
  return {
    creditPct: PCT[k(children)].credit,
    phaseoutPct: PCT[k(children)].phaseout,
    earnedIncomeAmount: a.earnedIncomeAmount[k(children)],
    maxCredit: a.maxCredit[k(children)],
    threshold: a.thresholdPhaseout[c][k(children)],
    completed: a.completedPhaseout[c][k(children)],
    investmentIncomeLimit: a.investmentIncomeLimit,
  };
}

/**
 * EIC Table 한 칸 — 금액(earned income 또는 AGI)이 든 $50 구간의 credit.
 * 1 달러 미만이면 0, completed 이상이면 0. 마지막 짧은 구간은 [아랫끝, completed) 의 중간값.
 */
export function tableAmount(year: Year, status: Status, children: Children, amount: number): number {
  const p = params(year, status, children);
  const x = Math.max(0, amount || 0);
  if (x < 1 || x >= p.completed) return 0;
  const lower = Math.floor(x / BRACKET) * BRACKET;
  const upper = Math.min(lower + BRACKET, p.completed);
  const m = (lower + upper) / 2;
  let v = lower + BRACKET <= p.earnedIncomeAmount ? roundHalfUp((p.creditPct / 100) * m) : p.maxCredit;
  if (lower >= p.threshold) v = Math.min(v, Math.max(0, roundHalfUp(p.maxCredit - (p.phaseoutPct / 100) * (m - p.threshold))));
  return v;
}

export interface EitcInput {
  year: Year;
  status: Status;
  children: Children;
  /** earned income(임금·팁·초과근무 전부 포함, Worksheet A 대상) */
  earned: number;
  /** AGI(Form 1040 line 11) — 비우면 earned 와 같다고 본다 */
  agi?: number;
  investmentIncome?: number;
  /** 자녀 없을 때: 과세연도 말 25~64세(MFJ 는 둘 중 한 명) */
  ageOk?: boolean;
}

export type Reason = "ok" | "investment" | "age" | "mfsNoChild" | "zero";

export interface EitcResult {
  credit: number;
  byEarned: number;
  /** AGI 로 찾은 표 값(AGI 를 볼 필요가 없으면 null) */
  byAgi: number | null;
  reason: Reason;
  params: Params;
}

/** Worksheet A — 2025 Form 1040 instructions line 27a 순서 */
export function computeEitc(i: EitcInput): EitcResult {
  const p = params(i.year, i.status, i.children);
  const earned = Math.max(0, i.earned || 0);
  const agi = i.agi === undefined ? earned : Math.max(0, i.agi || 0);
  const out = (credit: number, byEarned: number, byAgi: number | null, reason: Reason): EitcResult => ({ credit, byEarned, byAgi, reason, params: p });
  if (i.status === "mfs" && i.children === 0) return out(0, 0, null, "mfsNoChild");
  if (i.children === 0 && i.ageOk === false) return out(0, 0, null, "age");
  if ((i.investmentIncome ?? 0) > p.investmentIncomeLimit) return out(0, 0, null, "investment");
  const byEarned = tableAmount(i.year, i.status, i.children, earned);
  if (byEarned === 0) return out(0, 0, null, "zero");
  if (agi === earned || agi < p.threshold) return out(byEarned, byEarned, null, "ok");
  const byAgi = tableAmount(i.year, i.status, i.children, agi);
  const credit = Math.min(byEarned, byAgi);
  return out(credit, byEarned, byAgi, credit === 0 ? "zero" : "ok");
}

/** 그해 표의 핵심 숫자(본문 표용) */
export function summary(year: Year) {
  const kids: Children[] = [0, 1, 2, 3];
  return kids.map((c) => ({
    children: c,
    ...params(year, "other", c),
    thresholdMfj: params(year, "mfj", c).threshold,
    completedMfj: params(year, "mfj", c).completed,
  }));
}
