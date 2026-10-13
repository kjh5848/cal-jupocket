/**
 * 연말정산 어림 계산 — 소득세법 제47조·제50조·제51조의3·제52조·제55조·제59조·제59조의4·제61조.
 *
 * 근로소득만 있는 사람의 기본 흐름만 계산한다. 신용카드·의료비·교육비·기부금·
 * 자녀세액공제는 넣지 않는다(입력이 많고, 자녀세액공제는 개정 조문의 적용 시기를
 * 확인하지 않았다). 그래서 '어림' 이다. 지방소득세는 따로다.
 */
import y from "../rates/year-end-2026.json";
import { taxOn } from "./deduction";
import { pensionCredit } from "./pension-credit";

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
  const credits = Math.min(earnedCredit + pension + standard, computedTax); // 제61조
  const decided = computedTax - credits;
  return {
    earnedDeduction,
    earnedIncome,
    personal,
    base,
    computedTax,
    earnedCredit,
    pension,
    standard,
    decided,
    prepaid: i.prepaid,
    /** 양수면 더 낼 세금, 음수면 돌려받을 세금(소득세 기준) */
    diff: decided - i.prepaid,
  };
}
