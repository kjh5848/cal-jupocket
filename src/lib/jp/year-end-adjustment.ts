/**
 * 일본 年末調整(令和8年分) — 일본어판 /ja/year-end-adjustment/ 가 쓴다. 근거는 rates/jp/year-end-adjustment-2026.json
 * (国税庁 タックスアンサー [令和8年4月1日現在法令等]·令和8年分 年末調整のしかた·令和8年度改正 Q&A·
 * 所得税法 別表第五/租税特別措置法 第29条の4 令和8年12月1日 施行 版, 2026-10-21 확인).
 *
 * 흐름(rates steps):
 *   給与の総額 → 給与所得控除後の給与等の金額 − 所得金額調整控除 = 合計所得金額
 *   − 所得控除 → 1,000円未満 切り捨て = 課税給与所得金額 → 速算表 = 算出所得税額
 *   − 住宅借入金等特別控除(申告書 금액, 남는 부분 切り捨て) = 年調所得税額
 *   × 102.1% → 100円未満 切り捨て = 年調年税額 → 源泉徴収 합계와의 차액 = 還付 / 徴収
 *
 * 모두 정수 계산(× 30/100·× 9/10·× 1021/1000). 부동소수 곱셈을 쓰지 않는다.
 * 대상 아님: 給与 2,000万円 초과(No.2665). 年末調整用 速算表는 課税給与所得金額 18,050,000円까지지만(注2)
 *   給与 2,000万円 이하면 控除가 0 이어도 17,430,000円을 넘지 않아 따로 막지 않는다.
 * 계산하지 않음(rates outOfScope): 11/30 이전 마지막 給与·年の中途 退職·住宅借入金等特別控除額 산정·特定支出控除.
 * 生命保険料控除·地震保険料控除는 保険料控除申告書에서 계산한 控除額을 그대로 받는다.
 */
import rates from "../../rates/jp/year-end-adjustment-2026.json";

const int = (n: number) => (Number.isFinite(n) && n > 0 ? Math.floor(n) : 0);

export const EXCLUDED_PAY_OVER = rates.excludedPayOverYen; // 20,000,000
const SURTAX_NUM = rates.surtax.numerator; // 1021
const SURTAX_DEN = rates.surtax.denominator; // 1000

/** 速算表 — 税率는 % 정수(5·10·20·23·33·40·45) */
export const BRACKETS = rates.incomeTaxBrackets.brackets.map((b) => ({
  upToYen: b.upToYen,
  pct: Math.round(b.rate * 100),
  deductionYen: b.deductionYen,
}));

const SPECIAL = rates.employmentIncome.special691000to2200000.rows;
const STEP = rates.employmentIncome.table2200000to6600000.stepYen; // 4,000

/** No.1410 令和8年分 給与所得控除額(2,200,000~6,600,000円 구간 하한 L 에만 쓴다) */
function deductionAt(l: number): number {
  return l <= 3_600_000 ? (l * 30) / 100 + 80_000 : (l * 20) / 100 + 440_000;
}

/**
 * 給与所得控除後の給与等の金額(令和8年分 年末調整)
 * - 691,000円未満 0 (別表第五) · 691,000~2,200,000円 措法 第29条の4 (741,000円未満 0·給与 − 740,000円·固定 3행)
 * - 2,200,000~6,600,000円 別表第五: 4,000円 구간 하한 L 에서 L − 控除額(L)
 * - 6,600,000~8,500,000円 給与 × 90% − 1,100,000円(1円未満 切り捨て) · 8,500,000円 이상 給与 − 1,950,000円
 */
export function employmentIncome(salary: number): number {
  const s = int(salary);
  if (s < 691_000) return 0;
  if (s < 2_200_000) {
    const row = SPECIAL.find((r) => s >= r.fromYen && s < r.belowYen)!;
    if ("fixedYen" in row && typeof row.fixedYen === "number") return row.fixedYen;
    return s < 741_000 ? 0 : s - 740_000;
  }
  if (s < 6_600_000) {
    const l = 2_200_000 + Math.floor((s - 2_200_000) / STEP) * STEP;
    return l - deductionAt(l);
  }
  if (s < 8_500_000) return Math.floor((s * 9) / 10) - 1_100_000;
  return s - 1_950_000;
}

/** 所得金額調整控除(年末調整: 子ども·特別障害者等) — 給与 850万円 초과일 때 (min(給与, 1,000万円) − 850万円) × 10%, 1円未満 切り上げ */
export function incomeAdjustment(salary: number, eligible: boolean): number {
  const s = int(salary);
  if (!eligible || s <= 8_500_000) return 0;
  return Math.ceil((Math.min(s, 10_000_000) - 8_500_000) / 10);
}

/** 基礎控除(令和8年分) — 本人 合計所得金額 기준 */
export function basicDeduction(totalIncome: number): number {
  const t = int(totalIncome);
  return rates.basicDeduction.brackets.find((b) => b.upToYen === null || t <= b.upToYen)!.deductionYen;
}

export type SpouseIncomeKind = "salary" | "income";

/** 配偶者の合計所得金額 — 給与のみ면 給与収入에서 같은 給与所得控除後 表로 구한다(Q&A Q2-3) */
export function spouseTotalIncome(amount: number, kind: SpouseIncomeKind): number {
  return kind === "salary" ? employmentIncome(amount) : int(amount);
}

/** 配偶者控除·配偶者特別控除 — 本人 合計所得 1,000万円 초과면 0 */
export function spouseDeduction(
  taxpayerIncome: number,
  spouseIncome: number,
  elderly70: boolean,
): { kind: "spouse" | "special" | "none"; yen: number } {
  const t = int(taxpayerIncome);
  const sp = int(spouseIncome);
  const col = rates.spouseSpecialDeduction.taxpayerColumnsUpToYen.findIndex((u) => t <= u);
  if (col < 0) return { kind: "none", yen: 0 };
  if (sp <= rates.spouseDeduction.spouseIncomeLimitYen) {
    const b = rates.spouseDeduction.brackets[col];
    return { kind: "spouse", yen: elderly70 ? b.elderly70plusYen : b.generalYen };
  }
  const row = rates.spouseSpecialDeduction.rows.find((r) => sp > r.spouseOverYen && sp <= r.spouseUpToYen);
  return row ? { kind: "special", yen: row.deductionYen[col] } : { kind: "none", yen: 0 };
}

/** 特定親族特別控除(1人分) — 合計所得 62万円超 123万円以下. 62万円以下는 扶養控除(特定扶養親族) 쪽 */
export function specifiedRelativeDeduction(relativeIncome: number): number {
  const x = int(relativeIncome);
  const row = rates.specifiedRelativeDeduction.brackets.find((b) => x > b.overYen && x <= b.upToYen);
  return row ? row.deductionYen : 0;
}

const DEP = rates.dependentDeduction.amountsYen;
const PER = rates.personalDeductionsYen;

export interface Dependents {
  /** 一般の控除対象扶養親族(16歳以上19歳未満·23歳以上70歳未満) */
  general: number;
  /** 特定扶養親族(19歳以上23歳未満) */
  specified: number;
  /** 老人扶養親族(同居老親等以外) */
  elderly: number;
  /** 老人扶養親族のうち同居老親等 */
  elderlyLivingTogether: number;
}

export function dependentDeduction(d: Dependents): number {
  return (
    int(d.general) * DEP.general +
    int(d.specified) * DEP.specified19to22 +
    int(d.elderly) * DEP.elderly70plus +
    int(d.elderlyLivingTogether) * DEP.elderlyLivingTogether
  );
}

export type WidowKind = "none" | "widow" | "singleParent";

export interface YearEndInput {
  /** 給与の総額(その年 1/1~12/31 に支払が確定したもの) */
  salary: number;
  /** その年に源泉徴収された税額の合計 */
  withheld: number;
  /** 社会保険料(給与から差し引かれた額 + 申告した額) */
  socialInsurance: number;
  /** 小規模企業共済等掛金(iDeCo 등) */
  smallBusinessMutualAid: number;
  /** 生命保険料控除額(保険料控除申告書で計算した額) */
  lifeInsuranceDeduction: number;
  /** 地震保険料控除額(保険料控除申告書で計算した額) */
  earthquakeInsuranceDeduction: number;
  /** 所得金額調整控除の対象(本人 特別障害者 / 23歳未満の扶養親族 / 特別障害者の同一生計配偶者·扶養親族) */
  incomeAdjustmentEligible: boolean;
  /** 配偶者 — null 이면 없음(또는 대상 아님) */
  spouse: { amount: number; kind: SpouseIncomeKind; elderly70: boolean } | null;
  dependents: Dependents;
  /** 特定親族(19歳以上23歳未満·扶養控除 대상 아님) 1人の合計所得金額 — null 이면 없음 */
  specifiedRelativeIncome: number | null;
  /** 障害者(本人·同一生計配偶者·扶養親族)の人数 */
  disabled: number;
  /** 特別障害者(同居特別障害者 이외)の人数 */
  speciallyDisabled: number;
  /** 同居特別障害者の人数 */
  speciallyDisabledLivingTogether: number;
  widow: WidowKind;
  workingStudent: boolean;
  /** 住宅借入金等特別控除額(申告書の金額) */
  housingLoanCredit: number;
}

export interface YearEndResult {
  /** 대상 아님 사유 — null 이면 계산함 */
  notEligible: "salaryOver20m" | null;
  employmentIncome: number;
  incomeAdjustment: number;
  totalIncome: number;
  basic: number;
  spouse: { kind: "spouse" | "special" | "none"; yen: number };
  dependents: number;
  specifiedRelative: number;
  personal: number;
  insurance: number;
  totalDeductions: number;
  /** 課税給与所得金額(1,000円未満 切り捨て) */
  taxable: number;
  bracket: { pct: number; deductionYen: number } | null;
  /** 算出所得税額 */
  calculatedTax: number;
  /** 住宅借入金等特別控除 — 실제로 뺀 금액 */
  housingApplied: number;
  /** 年調所得税額 */
  taxAfterCredit: number;
  /** 年調年税額(× 102.1%, 100円未満 切り捨て) */
  annualTax: number;
  /** 源泉徴収 합계 − 年調年税額: 양수면 還付, 음수면 徴収 */
  difference: number;
}

/** 1,000円未満 切り捨て */
export const floorThousand = (yen: number) => Math.floor(int(yen) / 1000) * 1000;

/** 速算表 — 課税給与所得金額(1,000円 단위)의 算出所得税額 */
export function calculatedIncomeTax(taxable: number): number {
  const a = floorThousand(taxable);
  if (a === 0) return 0;
  const b = BRACKETS.find((x) => x.upToYen === null || a <= x.upToYen)!;
  return (a * b.pct) / 100 - b.deductionYen;
}

/** 年調年税額 = 年調所得税額 × 102.1%, 100円未満 切り捨て */
export function annualTaxWithSurtax(taxAfterCredit: number): number {
  return Math.floor((int(taxAfterCredit) * SURTAX_NUM) / (SURTAX_DEN * 100)) * 100;
}

export function yearEndAdjustment(i: YearEndInput): YearEndResult {
  const salary = int(i.salary);
  const ei = employmentIncome(salary);
  const adj = Math.min(ei, incomeAdjustment(salary, i.incomeAdjustmentEligible));
  const total = ei - adj;

  const basic = basicDeduction(total);
  const spouse = i.spouse
    ? spouseDeduction(total, spouseTotalIncome(i.spouse.amount, i.spouse.kind), i.spouse.elderly70)
    : { kind: "none" as const, yen: 0 };
  const dependents = dependentDeduction(i.dependents);
  const specifiedRelative = i.specifiedRelativeIncome === null ? 0 : specifiedRelativeDeduction(i.specifiedRelativeIncome);
  let personal =
    int(i.disabled) * PER.disabled +
    int(i.speciallyDisabled) * PER.speciallyDisabled +
    int(i.speciallyDisabledLivingTogether) * PER.speciallyDisabledLivingTogether;
  if (i.widow !== "none" && total <= 5_000_000) personal += i.widow === "widow" ? PER.widow : PER.singleParent;
  if (i.workingStudent && total <= PER.workingStudentIncomeLimitYen) personal += PER.workingStudent;
  const insurance =
    int(i.socialInsurance) +
    int(i.smallBusinessMutualAid) +
    int(i.lifeInsuranceDeduction) +
    int(i.earthquakeInsuranceDeduction);

  const totalDeductions = insurance + basic + spouse.yen + dependents + specifiedRelative + personal;
  const taxable = floorThousand(Math.max(0, total - totalDeductions));

  const notEligible: YearEndResult["notEligible"] = salary > EXCLUDED_PAY_OVER ? "salaryOver20m" : null;

  const b = taxable === 0 ? null : BRACKETS.find((x) => x.upToYen === null || taxable <= x.upToYen)!;
  const calculatedTax = calculatedIncomeTax(taxable);
  const housingApplied = Math.min(calculatedTax, int(i.housingLoanCredit));
  const taxAfterCredit = calculatedTax - housingApplied;
  const annualTax = annualTaxWithSurtax(taxAfterCredit);

  return {
    notEligible,
    employmentIncome: ei,
    incomeAdjustment: adj,
    totalIncome: total,
    basic,
    spouse,
    dependents,
    specifiedRelative,
    personal,
    insurance,
    totalDeductions,
    taxable,
    bracket: b ? { pct: b.pct, deductionYen: b.deductionYen } : null,
    calculatedTax,
    housingApplied,
    taxAfterCredit,
    annualTax,
    difference: int(i.withheld) - annualTax,
  };
}

export const emptyInput = (): YearEndInput => ({
  salary: 0,
  withheld: 0,
  socialInsurance: 0,
  smallBusinessMutualAid: 0,
  lifeInsuranceDeduction: 0,
  earthquakeInsuranceDeduction: 0,
  incomeAdjustmentEligible: false,
  spouse: null,
  dependents: { general: 0, specified: 0, elderly: 0, elderlyLivingTogether: 0 },
  specifiedRelativeIncome: null,
  disabled: 0,
  speciallyDisabled: 0,
  speciallyDisabledLivingTogether: 0,
  widow: "none",
  workingStudent: false,
  housingLoanCredit: 0,
});

export function formatYen(yen: number): string {
  return Math.floor(yen).toLocaleString("ja-JP") + "円";
}
