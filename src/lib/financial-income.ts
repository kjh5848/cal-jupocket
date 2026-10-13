/**
 * 금융소득 — 소득세법 제14조 제3항 제6호(2천만원), 제62조(비교과세), 제129조(14%), 조특법 제104조의27(고배당 분리과세).
 * rates: financial-income-2026.json, 기본세율은 rates/2026.json(taxOn).
 *
 * 비교과세 계산은 Gross-up 이 없는 금융소득(예금이자 등) 기준이다. 2천만원을 채우는 순서·Gross-up 대상 판정은
 * 시행령 영역이라 넣지 않았다(notVerified). otherBase 는 금융소득을 뺀 다른 종합소득의 과세표준(소득공제 후)이다.
 */
import r from "../rates/financial-income-2026.json";
import { taxOn } from "./deduction";

const fl = (v: number) => Math.floor(v + 1e-6);
const T = r.threshold.amount;
const W = r.withholding.interest;

export function financialTax(o: { interest: number; otherBase?: number }) {
  const interest = Math.max(0, Math.floor(o.interest));
  const otherBase = Math.max(0, Math.floor(o.otherBase ?? 0));
  const withheld = fl(interest * W);
  const otherTax = taxOn(otherBase);
  const comprehensive = interest > T;
  /** ① (초과분 + 다른 소득)에 기본세율 + 2천만원 × 14% */
  const opt1 = comprehensive ? taxOn(interest - T + otherBase) + fl(T * W) : 0;
  /** ② 금융소득 전액 × 14% + 다른 소득에 기본세율 */
  const opt2 = withheld + otherTax;
  const computed = comprehensive ? Math.max(opt1, opt2) : opt2;
  /** 금융소득 때문에 더 내는 소득세(원천징수 14%와 다른 소득 세액을 뺀 것) */
  const extra = computed - withheld - otherTax;
  return { interest, withheld, comprehensive, opt1, opt2, computed, extra, extraLocal: fl(extra * r.local.ratio) };
}

/** 고배당기업 특례배당소득 세액(조특법 제104조의27 제2항 표) */
export function highDividendTax(amount: number): number {
  const a = Math.max(0, Math.floor(amount));
  const B = r.highDividend.brackets;
  let prev = 0;
  for (const b of B) {
    if (b.upTo === null || a <= b.upTo) return fl(b.base + (a - prev) * b.rate);
    prev = b.upTo;
  }
  return 0;
}
