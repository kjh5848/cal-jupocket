/**
 * 미국 연방 의료비 항목별 공제(Schedule A line 1–4) — 미국판 /en-us/medical-expense-deduction/ 가 쓴다.
 * 한국 의료비 세액공제(총급여 3% 초과분 × 15%)와 제도가 달라 짝(hreflang)이 아니다.
 *
 * 원문(2026-10-21 확인) — rates/us/medical-expense-2026.json:
 * - 26 U.S.C. 213(a) · Topic 502 · Schedule A line 3·4: 공제액 = max(0, 보전받지 않은 의료비 − AGI × 7.5%).
 * - Pub 502 · standard mileage rates: 의료 주행 2025 21¢, 2026 1~6월 20.5¢ · 7~12월 23.5¢ + 주차비·통행료.
 * - Pub 502 · Rev. Proc. 2025-32 §3.27: LTC 보험료는 사람마다 그해 말 나이 구간 한도까지만.
 * - Pub 501 (2025) Table 6·7 · Rev. Proc. 2025-32 §3.14: 표준공제와 65세 이상·시각장애 박스 추가액.
 *
 * 계산은 센트까지(1040 금액 반올림 규칙은 안 씀). '아낀 세금'은 계산하지 않는다(세율표 안 씀).
 */
import rates from "../../rates/us/medical-expense-2026.json";

export type Year = 2025 | 2026;
export type FilingStatus = "single" | "marriedFilingJointly" | "marriedFilingSeparately" | "headOfHousehold" | "qualifyingSurvivingSpouse";

export const AGI_PERCENT = rates.floor.agiPercent;
export const LODGING_PER_NIGHT = rates.lodgingPerNightPerPerson;
export const SOURCES = rates.sources;

const rateOf = (period: string) => rates.mileage.byPeriod.find((p) => p.period === period)!.rate;
/** 의료 주행 단가(달러/마일) */
export const MILEAGE = {
  2025: rateOf("2025"),
  2026: { firstHalf: rateOf("2026-01-01..2026-06-30"), secondHalf: rateOf("2026-07-01..2026-12-31") },
} as const;

export const LTC_LIMITS: Record<Year, { ageFrom?: number; ageTo?: number; limit: number }[]> = {
  2025: rates.longTermCarePremiumLimit["2025"],
  2026: rates.longTermCarePremiumLimit["2026"],
};

const SD = rates.standardDeduction;
export const MAX_BOXES: Record<FilingStatus, number> = SD.maxBoxes;

const cents = (x: number) => Math.round(x * 100) / 100;
const pos = (x: number) => Math.max(0, x || 0);

/** Schedule A line 3 = AGI × 7.5% */
export function agiFloor(agi: number): number {
  return cents((pos(agi) * AGI_PERCENT) / 100);
}

/** Schedule A line 4 = line 1 − line 3, 음수면 0 */
export function medicalDeduction(agi: number, expenses: number): number {
  return cents(Math.max(0, pos(expenses) - agiFloor(agi)));
}

/**
 * 의료 목적 주행 — 표준 단가 × 마일 + 주차비·통행료.
 * 2025 는 miles 하나(21¢), 2026 은 1~6월 miles · 7~12월 milesLate 를 따로 곱한다.
 */
export function mileageAmount(year: Year, miles: number, tollsParking = 0, milesLate = 0): number {
  const m = year === 2025 ? pos(miles) * MILEAGE[2025] : pos(miles) * MILEAGE[2026].firstHalf + pos(milesLate) * MILEAGE[2026].secondHalf;
  return cents(m + pos(tollsParking));
}

/** 그해 말 나이의 LTC 보험료 한도 */
export function ltcLimit(year: Year, age: number): number {
  const a = Math.floor(pos(age));
  const band = LTC_LIMITS[year].find((b) => (b.ageFrom === undefined || a >= b.ageFrom) && (b.ageTo === undefined || a <= b.ageTo));
  return band ? band.limit : 0;
}

/** qualified LTC 보험료 중 의료비에 넣을 수 있는 금액(한 사람) = min(보험료, 나이 한도) */
export function ltcIncludible(year: Year, age: number, premium: number): number {
  return cents(Math.min(pos(premium), ltcLimit(year, age)));
}

const MARRIED_RATE: Record<FilingStatus, boolean> = {
  single: false,
  headOfHousehold: false,
  marriedFilingJointly: true,
  marriedFilingSeparately: true,
  qualifyingSurvivingSpouse: true,
};

/**
 * 표준공제 — 기본액 + 박스(65세 이상·시각장애, 본인·배우자) × 추가액.
 * 박스 추가액은 Single·HOH 가 unmarried, MFJ·MFS·QSS 가 married 단가(Pub 501 Table 7 · Rev. Proc. 2025-32).
 * spouseItemizes(MFS 만): 배우자가 항목별 공제를 하면 0.
 */
export function standardDeduction(year: Year, status: FilingStatus, boxes = 0, spouseItemizes = false): number {
  if (status === "marriedFilingSeparately" && spouseItemizes) return 0;
  const t = SD[String(year) as "2025" | "2026"];
  const n = Math.min(Math.max(0, Math.floor(boxes || 0)), MAX_BOXES[status]);
  const add = MARRIED_RATE[status] ? t.agedOrBlindAdditional.married : t.agedOrBlindAdditional.unmarried;
  return t[status] + n * add;
}

export interface MedicalInput {
  year: Year;
  status: FilingStatus;
  agi: number;
  /** 보험 등으로 보전받지 않은 의료비(주행·LTC 제외) */
  expenses: number;
  miles?: number;
  milesLate?: number;
  tollsParking?: number;
  /** 사람마다 [그해 말 나이, LTC 보험료] */
  ltc?: [number, number][];
  /** 의료비 말고 다른 항목별 공제 합계(사용자가 직접) */
  otherItemized?: number;
  boxes?: number;
  spouseItemizes?: boolean;
}

export interface MedicalResult {
  mileage: number;
  ltc: number;
  /** Schedule A line 1 */
  line1: number;
  /** line 3 */
  floor: number;
  /** line 4 */
  deduction: number;
  itemizedTotal: number;
  standard: number;
  /** 항목별 − 표준 (양수면 항목별이 큼) */
  difference: number;
}

export function computeMedical(i: MedicalInput): MedicalResult {
  const mileage = mileageAmount(i.year, i.miles ?? 0, i.tollsParking ?? 0, i.milesLate ?? 0);
  const ltc = cents((i.ltc ?? []).reduce((s, [age, prem]) => s + ltcIncludible(i.year, age, prem), 0));
  const line1 = cents(pos(i.expenses) + mileage + ltc);
  const floor = agiFloor(i.agi);
  const deduction = medicalDeduction(i.agi, line1);
  const itemizedTotal = cents(deduction + pos(i.otherItemized ?? 0));
  const standard = standardDeduction(i.year, i.status, i.boxes ?? 0, i.spouseItemizes ?? false);
  return { mileage, ltc, line1, floor, deduction, itemizedTotal, standard, difference: cents(itemizedTotal - standard) };
}
