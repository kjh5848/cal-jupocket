/**
 * 일본 iDeCo(個人型確定拠出年金)·小規模企業共済 掛金의 節税額과 拠出限度額 — 일본어판 /ja/ideco/ 가 쓴다.
 * 근거는 rates/jp/ideco-deduction-2026.json(2026-10-23 확인):
 * - 所得税法 第75条(国税庁 No.1135): 小規模企業共済等掛金控除 = 그해 낸 掛金 전액(한도·공제율 없음)
 * - 確定拠出年金法施行令 第36条: 個人型 拠出限度額(月額) — 현행(2026-10-01 시행)과 2026-12-01 시행 개정(令和7年政令第442号)
 * - 厚生労働省 確定拠出年金Q&A No.227~230-2: 最低掛金額 5,000円·1,000円 단위(限度額은 1,000円 단위로 내림, 5,000円 미만이면 拠出 불가)
 * - 小規模企業共済法 第4条: 掛金月額 1,000~70,000円, 500円 단위
 * - 地方税法 第314条の2·第35条·第314条の3: 住民税도 같은 공제, 所得割 표준세율 합계 10%
 *
 * 所得税 절세액 = 年税額(공제 전) − 年税額(공제 뒤). 年税額은 年末調整 lib 의 速算表·× 102.1%·100円未満 切り捨て를 쓴다
 * (令和8年分, rates/jp/year-end-adjustment-2026.json 검증됨). 合計所得金額은 掛金 공제로 변하지 않으므로 基礎控除는 공제 전후 같다.
 * 住民税 절세액은 掛金 × 10% 目安 — 調整控除 A = 5万円(人的控除差 가산 없음)이면 정확, 끝수 처리는 확인하지 않아 하지 않는다.
 * 정수 계산만 쓴다.
 */
import rates from "../../rates/jp/ideco-deduction-2026.json";
import { employmentIncome, basicDeduction, floorThousand, calculatedIncomeTax, annualTaxWithSurtax, BRACKETS } from "./year-end-adjustment";

const int = (n: number) => (Number.isFinite(n) && n > 0 ? Math.floor(n) : 0);

/** 加入者 구분 */
export type Category =
  | "cat1" // 第1号(自営業者など)·第4号(任意加入被保険者)
  | "cat2None" // 第2号 — 企業年金なし
  | "cat2DC" // 第2号 — 企業型DCのみ
  | "cat2Other" // 第2号 — DB·厚生年金基金など(他制度)あり
  | "cat2Public" // 第2号 — 公務員·私学教職員(共済)
  | "cat3"; // 第3号(専業主婦·主夫)

export type Period = "current" | "dec2026";

export interface LimitOptions {
  /** 第1号: その月に納める付加保険料·国民年金基金の掛金(月額) */
  addOn?: number;
  /** 第2号: 企業型DCの事業主掛金(月額) */
  employer?: number;
  /** 第2号: 他制度掛金相当額·共済掛金相当額(月額) */
  other?: number;
}

const ideco = rates.contributionLimitsMonthlyYen;
/** 施行令 第36条 현행(2026-10-01 施行) */
export const CURRENT = {
  cat1: 68_000,
  cat2None: ideco.currentFrom20261001.ideco.category2NoCompanyPlan, // 23,000
  cat2Base: 20_000,
  cat2Threshold: 35_000,
  cat3: ideco.currentFrom20261001.ideco.category3, // 23,000
} as const;
/** 令和7年政令第442号(2026-12-01 施行) */
export const DEC2026 = {
  cat1: 75_000,
  cat2: 62_000,
  cat3: ideco.scheduledFrom20261201.ideco.category3, // 23,000
} as const;

export const MIN_MONTHLY = rates.idecoContributionRules.monthlyMinYen; // 5,000
export const STEP_MONTHLY = rates.idecoContributionRules.monthlyStepYen; // 1,000
export const SMB = rates.smallEnterpriseMutualAid; // 1,000~70,000, 500円 단위
export const RESIDENT_RATE_PCT = Math.round(rates.residentTax.totalStandardRate * 100); // 10
export const NOTICE = ideco.otherPlanContributionEquivalent.noticeValuesMonthlyYen;

/** 施行令上の拠出限度額(月額, 0 未満は 0) */
export function legalLimit(cat: Category, period: Period, o: LimitOptions = {}): number {
  const addOn = int(o.addOn ?? 0);
  const employer = int(o.employer ?? 0);
  const other = int(o.other ?? 0);
  let v: number;
  if (period === "current") {
    const over = (x: number) => Math.max(0, x - CURRENT.cat2Threshold);
    switch (cat) {
      case "cat1": v = CURRENT.cat1 - addOn; break;
      case "cat2None": v = CURRENT.cat2None; break;
      case "cat2DC": v = CURRENT.cat2Base - over(employer); break;
      case "cat2Other": v = CURRENT.cat2Base - over(employer + other); break;
      case "cat2Public": v = CURRENT.cat2Base - over(other); break;
      case "cat3": v = CURRENT.cat3; break;
    }
  } else {
    switch (cat) {
      case "cat1": v = DEC2026.cat1 - addOn; break;
      case "cat2None": v = DEC2026.cat2; break;
      case "cat2DC": v = DEC2026.cat2 - employer; break;
      case "cat2Other": v = DEC2026.cat2 - employer - other; break;
      case "cat2Public": v = DEC2026.cat2 - other; break;
      case "cat3": v = DEC2026.cat3; break;
    }
  }
  return Math.max(0, v);
}

/** 実際に出せる掛金の上限(月額) — 1,000円 단위로 내리고, 5,000円 未満なら 0(拠出できない) */
export function maxContribution(cat: Category, period: Period, o: LimitOptions = {}): number {
  const v = Math.floor(legalLimit(cat, period, o) / STEP_MONTHLY) * STEP_MONTHLY;
  return v < MIN_MONTHLY ? 0 : v;
}

export type MonthlyCheck = "ok" | "belowMin" | "notStep" | "overLimit";

/** iDeCo 掛金(月額)の確認 */
export function checkIdeco(monthly: number, max: number): MonthlyCheck {
  const m = int(monthly);
  if (m === 0) return "ok";
  if (m < MIN_MONTHLY) return "belowMin";
  if (m % STEP_MONTHLY !== 0) return "notStep";
  if (m > max) return "overLimit";
  return "ok";
}

/** 小規模企業共済 掛金(月額)の確認 */
export function checkSmb(monthly: number): MonthlyCheck {
  const m = int(monthly);
  if (m === 0) return "ok";
  if (m < SMB.monthlyMinYen) return "belowMin";
  if (m % SMB.monthlyStepYen !== 0) return "notStep";
  if (m > SMB.monthlyMaxYen) return "overLimit";
  return "ok";
}

export type IncomeKind = "salary" | "income";

export interface SavingInput {
  /** 給与収入(salary) または 合計所得金額(income) */
  kind: IncomeKind;
  amount: number;
  /** 社会保険料控除 */
  socialInsurance: number;
  /** 基礎控除·社会保険料·掛金 以外の所得控除の合計(配偶者·扶養·生命保険料など) */
  otherDeductions: number;
  /** 1年に払う掛金(iDeCo + 小規模企業共済) */
  annualContribution: number;
}

export interface SavingResult {
  totalIncome: number;
  basic: number;
  /** 課税所得金額(1,000円未満切り捨て) — 掛金控除の前·後 */
  taxableBefore: number;
  taxableAfter: number;
  /** 所得税+復興特別所得税(× 102.1%·100円未満切り捨て) — 前·後 */
  incomeTaxBefore: number;
  incomeTaxAfter: number;
  incomeTaxSaving: number;
  /** 掛金控除前の課税所得にかかる税率(%) — 0 なら所得税がかからない */
  marginalPct: number;
  /** 住民税(所得割 10%)の目安 */
  residentSaving: number;
  total: number;
}

export function taxSaving(i: SavingInput): SavingResult {
  const totalIncome = i.kind === "salary" ? employmentIncome(i.amount) : int(i.amount);
  const basic = basicDeduction(totalIncome);
  const base = totalIncome - int(i.socialInsurance) - int(i.otherDeductions) - basic;
  const c = int(i.annualContribution);
  const taxableBefore = floorThousand(Math.max(0, base));
  const taxableAfter = floorThousand(Math.max(0, base - c));
  const incomeTaxBefore = annualTaxWithSurtax(calculatedIncomeTax(taxableBefore));
  const incomeTaxAfter = annualTaxWithSurtax(calculatedIncomeTax(taxableAfter));
  const b = taxableBefore === 0 ? null : BRACKETS.find((x) => x.upToYen === null || taxableBefore <= x.upToYen)!;
  const residentSaving = Math.floor((c * RESIDENT_RATE_PCT) / 100);
  const incomeTaxSaving = incomeTaxBefore - incomeTaxAfter;
  return {
    totalIncome,
    basic,
    taxableBefore,
    taxableAfter,
    incomeTaxBefore,
    incomeTaxAfter,
    incomeTaxSaving,
    marginalPct: b ? b.pct : 0,
    residentSaving,
    total: incomeTaxSaving + residentSaving,
  };
}

export function formatYen(yen: number): string {
  return Math.floor(yen).toLocaleString("ja-JP") + "円";
}
