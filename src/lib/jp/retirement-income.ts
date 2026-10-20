/**
 * 일본 退職所得の源泉徴収税額 — 일본어판 /ja/retirement-income-tax/ 가 쓴다. 근거는 rates/jp/retirement-income-2026.json.
 *
 * 원문(国税庁 タックスアンサー [令和8年4月1日現在法令等], 2026-10-21 확인):
 * - No.1420 — 退職所得 = (収入金額 − 退職所得控除額) × 1/2, 控除額 20年以下 40万円 × A(80万円 미만이면 80万円)·
 *   20年超 800万円 + 70万円 × (A − 20), 勤続年数 1年未満 端数 切り上げ, 障害者 退職 +100万円.
 * - No.2732 — 特定役員(1/2 없음)·短期(残額 300万円 超는 150万円 + …), 課税退職所得金額 1,000円未満 切り捨て,
 *   80万円 최저를 적용한 뒤 100万円 가산, 申告書 없으면 支給額 × 20.42%(1円未満 切り捨て).
 * - 別紙 速算表 — ((A) × (B) − (C)) × 102.1%, 1円未満 切り捨て.
 *
 * 102.1%·20.42% 는 부동소수 곱셈을 쓰지 않고 정수로 나눈다(例2 380,322.5円 → 380,322円).
 * 같은 해 여러 종류(No.2741)·前年以前 重複期間·住民税 는 계산하지 않는다(rates outOfScope).
 */
import rates from "../../rates/jp/retirement-income-2026.json";

export type Category = "general" | "specifiedOfficer" | "shortTerm";

const [D20, DOVER] = rates.deduction;
const PER_YEAR_20 = D20.perYearYen; // 400,000
const MIN_DEDUCTION = D20.minYen!; // 800,000
const BASE_20 = DOVER.baseYen!; // 8,000,000
const PER_YEAR_OVER = DOVER.perYearYen; // 700,000
const DISABILITY_ADD = rates.disabilityAddYen; // 1,000,000
const SHORT_THRESHOLD = rates.categories.shortTermThresholdYen; // 3,000,000
const SHORT_HALF = rates.categories.shortTermHalfPartYen; // 1,500,000
const SURTAX_NUM = rates.withholdingTable.surtaxNumerator; // 1021
const SURTAX_DEN = rates.withholdingTable.surtaxDenominator; // 1000

/** 速算表 — 税率는 % 정수로(5·10·20·23·33·40·45) */
export const BRACKETS = rates.withholdingTable.brackets.map((b) => ({
  upToYen: b.upToYen,
  pct: Math.round(b.rate * 100),
  deductionYen: b.deductionYen,
}));

/** 申告書なし 20.42% → 2042 / 10000 */
const NO_DECL_NUM = Math.round(rates.noDeclarationWithholding * 10000);

const int = (n: number) => (Number.isFinite(n) && n > 0 ? Math.floor(n) : 0);

/** 勤続年数 — 1年未満の端数は1年に切り上げ(10年2か月 → 11年). 0年0か月은 0. */
export function serviceYears(years: number, months: number): number {
  const y = int(years);
  const m = int(months);
  const total = y * 12 + m;
  return Math.ceil(total / 12);
}

/** 退職所得控除額 — 80万円 최저 뒤에 障害者 100万円 가산(No.2732 注) */
export function retirementDeduction(years: number, disability = false): number {
  const a = int(years);
  const base = a <= 20 ? Math.max(PER_YEAR_20 * a, MIN_DEDUCTION) : BASE_20 + PER_YEAR_OVER * (a - 20);
  return base + (disability ? DISABILITY_ADD : 0);
}

/** 課税退職所得金額(1,000円未満 切り捨て 전) */
export function retirementIncome(payment: number, deduction: number, category: Category): number {
  const pay = int(payment);
  const rem = Math.max(0, pay - int(deduction));
  if (category === "specifiedOfficer") return rem;
  if (category === "shortTerm" && rem > SHORT_THRESHOLD) return SHORT_HALF + (rem - SHORT_THRESHOLD);
  return rem / 2;
}

/** 1,000円未満 切り捨て */
export function floorThousand(yen: number): number {
  return Math.floor(int(yen) / 1000) * 1000;
}

/** 速算表 — 課税退職所得金額(1,000円 단위)에 대한 源泉徴収税額(1円未満 切り捨て) */
export function withholdingTax(taxable: number): number {
  const a = floorThousand(taxable);
  if (a === 0) return 0;
  const b = BRACKETS.find((x) => x.upToYen === null || a <= x.upToYen)!;
  // ((A × pct / 100) − C) × 1021 / 1000 = (A × pct − C × 100) × 1021 / 100000
  const base = a * b.pct - b.deductionYen * 100;
  return Math.floor((base * SURTAX_NUM) / (100 * SURTAX_DEN));
}

/** 申告書なし — 支給額 × 20.42%(1円未満 切り捨て) */
export function noDeclarationTax(payment: number): number {
  return Math.floor((int(payment) * NO_DECL_NUM) / 10000);
}

export interface RetirementInput {
  /** 退職金の支給額(源泉徴収される前の金額) */
  payment: number;
  /** 勤続期間 — 年 */
  years: number;
  /** 勤続期間 — か月(0〜11) */
  months: number;
  category: Category;
  /** 障害者になったことが直接の原因で退職 */
  disability: boolean;
}

export interface RetirementResult {
  serviceYears: number;
  deduction: number;
  /** 1,000円未満 切り捨て 뒤 課税退職所得金額 */
  taxable: number;
  /** 速算表 税率(%)·控除額 — taxable 0 이면 null */
  bracket: { pct: number; deductionYen: number } | null;
  /** 申告書あり 源泉徴収税額 */
  tax: number;
  /** 申告書なし 源泉徴収税額 */
  taxNoDeclaration: number;
}

export function retirementTax(i: RetirementInput): RetirementResult {
  const sy = serviceYears(i.years, i.months);
  const deduction = retirementDeduction(sy, i.disability);
  const taxable = floorThousand(retirementIncome(i.payment, deduction, i.category));
  const b = taxable === 0 ? null : BRACKETS.find((x) => x.upToYen === null || taxable <= x.upToYen)!;
  return {
    serviceYears: sy,
    deduction,
    taxable,
    bracket: b ? { pct: b.pct, deductionYen: b.deductionYen } : null,
    tax: withholdingTax(taxable),
    taxNoDeclaration: noDeclarationTax(i.payment),
  };
}

export function formatYen(yen: number): string {
  return Math.floor(yen).toLocaleString("ja-JP") + "円";
}
