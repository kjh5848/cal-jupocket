/**
 * 연말정산 어림 계산 — 소득세법 제47조·제50조·제51조의3·제52조·제55조·제59조·제59조의2·제59조의4·제61조.
 *
 * 근로소득만 있는 사람의 기본 흐름만 계산한다. 신용카드·의료비·교육비·기부금은
 * 넣지 않는다(입력이 많다). 그래서 '어림' 이다. 지방소득세는 따로다.
 * 자녀세액공제는 2026. 4. 21. 개정 부칙(법률 제21548호)까지 읽고 넣었다.
 */
import y from "../rates/year-end-2026.json";
import { taxOn } from "./deduction";
import { pensionCredit } from "./pension-credit";
import ded from "../rates/deduction-2026.json";

const DESCENDANT_MAX_AGE = ded.age.descendant;

const C = y.calc;

/** 근로소득공제 — 제47조 표, 한도 2천만원, 총급여보다 클 수 없다 */
export function earnedIncomeDeduction(pay: number): number {
  const row = C.earnedIncomeDeduction.table.find((r) => r.upTo === null || pay <= r.upTo)!;
  const d = row.base + (pay - row.over) * row.rate;
  return Math.min(Math.floor(d), C.earnedIncomeDeduction.cap, pay);
}

/** 근로소득세액공제 — 제59조 ① 표와 ② 총급여별 한도 */
export function earnedIncomeTaxCredit(computedTax: number, pay: number): number {
  const t = C.earnedIncomeTaxCredit.table;
  const raw = computedTax <= t[0].upTo! ? computedTax * t[0].rate : t[1].base + (computedTax - t[1].over) * t[1].rate;
  const c = C.earnedIncomeTaxCredit.caps.find((x) => x.payUpTo === null || pay <= x.payUpTo)!;
  const cap = Math.max(c.start - (pay - c.over) * c.rate, c.floor);
  return Math.floor(Math.min(raw, cap));
}

const K = C.childTaxCredit;
const ageByYear: Record<string, number> = K.buchik.ageByYear;

/**
 * 그 과세기간분 자녀세액공제(제59조의2 ①)의 연령기준.
 * 2026~2029년분은 부칙 제2조 ②의 연도별 나이, 2017년생은 같은 조 ③이 ②를 빼므로 개정규정의 13세.
 */
export function childCreditAge(taxYear: number, birthYear: number): number {
  if (birthYear === K.buchik.excludedBirthYear) return K.age;
  return ageByYear[String(taxYear)] ?? K.age;
}

/** 제53조 ⑤ — 과세기간 중 그 나이가 되는 날이 하루라도 있으면 대상이다. 그래서 '그해 − 출생연도' 로 본다 */
export function childCreditEligible(taxYear: number, birthYear: number): boolean {
  return taxYear - birthYear >= childCreditAge(taxYear, birthYear);
}

/** 그 과세기간분 ① 공제를 받는 가장 늦은 출생연도. 2026년분 → 2016 */
export function latestEligibleBirthYear(taxYear: number): number {
  let b = taxYear;
  while (!childCreditEligible(taxYear, b)) b--;
  return b;
}

/**
 * 그 과세기간분 ① 공제 대상 출생연도 범위 — 위는 부칙의 나이, 아래는 기본공제 요건 20세 이하(제50조 ① 3호 나목).
 * 20세 이하도 제53조 ⑤로 본다: 그해에 20세인 날이 있으면 된다 → 대체로 그해 − 21년생까지(1월 1일생은 경계).
 * 장애인은 아래 한도가 없다.
 * 2026년분 → 2005~2016년생
 */
export function childCreditBirthRange(taxYear: number): { from: number; to: number } {
  return { from: taxYear - DESCENDANT_MAX_AGE - 1, to: latestEligibleBirthYear(taxYear) };
}

/** 출산·입양 순서 — 제59조의2 ③ 각 호. 3은 '셋째 이상' */
export type BirthOrder = 1 | 2 | 3;

/** 자녀세액공제 — 제59조의2 ①(나이 기준을 넘긴 자녀 수) + ③(그해 출산·입양) */
export function childTaxCredit(children: number, births: BirthOrder[] = []): number {
  const n = Math.max(0, Math.floor(children));
  const a = K.amounts;
  const base = n === 0 ? 0 : n === 1 ? a.one : a.two + (n - 2) * a.perExtra;
  return base + births.reduce((sum, o) => sum + a.birth[o - 1], 0);
}

export interface YearEndInput {
  /** 총급여(비과세 제외) */
  pay: number;
  /** 기본공제 인원(본인 포함) */
  persons: number;
  /** 국민연금 등 본인 부담 연금보험료 */
  pensionInsurance: number;
  /** 건강·고용·장기요양보험료 본인 부담분 */
  socialInsurance: number;
  /** 연금저축·IRP 납입액 */
  pensionSavings?: number;
  irp?: number;
  /**
   * 제59조의2 ① 대상 자녀·손자녀 수 — 기본공제대상자이면서 나이 기준을 넘긴 사람.
   * 2026년분은 2016년 이전 출생({@link latestEligibleBirthYear}).
   */
  children?: number;
  /** 그해 출산·입양 신고한 공제대상자녀의 순서 — 제59조의2 ③ */
  births?: BirthOrder[];
  /** 표준세액공제(13만원)를 받는가 — 특별세액공제를 신청하면 false */
  standard?: boolean;
  /** 1년 동안 이미 뗀 소득세 */
  prepaid: number;
}

export function yearEnd(i: YearEndInput) {
  const earnedDeduction = earnedIncomeDeduction(i.pay);
  const earnedIncome = i.pay - earnedDeduction;
  const personal = C.basicDeductionPerHead.amount * Math.max(1, i.persons);
  const base = Math.max(0, earnedIncome - personal - i.pensionInsurance - i.socialInsurance);
  const computedTax = taxOn(base);
  const earnedCredit = earnedIncomeTaxCredit(computedTax, i.pay);
  // 근로소득만 있으면 총급여 5,500만원 이하가 연금계좌 15% 구간(제59조의3)
  const pension = pensionCredit({ savings: i.pensionSavings ?? 0, irp: i.irp ?? 0 }, i.pay <= 55_000_000).incomeTax;
  const standard = i.standard === false ? 0 : C.standardTaxCredit.amount;
  // 공제대상자녀는 기본공제대상자여야 한다(제59조의2 ①). 본인을 뺀 인원을 넘을 수 없다.
  // ①과 ③은 따로 센다 — 입양한 자녀는 둘 다에 들 수 있다.
  const room = Math.max(1, i.persons) - 1;
  const children = Math.min(i.children ?? 0, room);
  const births = (i.births ?? []).slice(0, room);
  const child = childTaxCredit(children, births);
  const credits = Math.min(earnedCredit + child + pension + standard, computedTax); // 제61조
  const decided = computedTax - credits;
  return {
    earnedDeduction,
    earnedIncome,
    personal,
    base,
    computedTax,
    earnedCredit,
    child,
    /** 기본공제 인원이 모자라 계산에서 뺀 자녀가 있는가 */
    childClamped: children < (i.children ?? 0) || births.length < (i.births ?? []).length,
    pension,
    standard,
    /** 실제로 뺀 세액공제 — 산출세액까지만(제61조). 결정세액 + 이것 = 산출세액 */
    credits,
    decided,
    prepaid: i.prepaid,
    /** 양수면 더 낼 세금, 음수면 돌려받을 세금(소득세 기준) */
    diff: decided - i.prepaid,
  };
}
