/**
 * 퇴직소득세 — 소득세법 제48조(근속연수공제·환산급여공제)·제55조 제2항(÷12 × 근속연수), 지방세법 제92조 제4항,
 * 제129조 제1항 제5호의3(연금수령 70%·60%·50%). rates: severance-2026.json, 기본세율은 2026.json.
 *
 * 근속연수는 1년 미만을 1년으로 올린다(제48조 제1항). 근속연수를 개월 단위로 나누는 세부(시행령)와 임원 한도는 넣지 않았다.
 */
import r from "../rates/severance-2026.json";
import { taxOn } from "./deduction";

const T = r.tax;
/** 원 미만 버림 — 부동소수점 오차 보정 */
const fl = (v: number) => Math.floor(v + 1e-6);

/** 근속연수 — 1년 미만 끝수는 1년으로 */
export function serviceYears(years: number): number {
  return Math.max(1, Math.ceil(years - 1e-9));
}

/** 근속연수공제(제48조 제1항 제1호 표) */
export function serviceDeduction(years: number): number {
  const y = serviceYears(years);
  const row = T.serviceDeduction.find((b) => b.upToYears === null || y <= b.upToYears)!;
  return row.base + row.perYear * (y - row.fromYears);
}

/** 환산급여공제(제48조 제1항 제2호 표) */
export function convertedDeduction(converted: number): number {
  const c = Math.max(0, converted);
  const row = T.convertedDeduction.find((b) => b.upTo === null || c <= b.upTo)!;
  return fl(row.base + (c - row.over) * row.rate);
}

/** 퇴직금 → 퇴직소득세·지방소득세 */
export function severanceTax(amount: number, years: number) {
  const income = Math.max(0, fl(amount));
  const y = serviceYears(years);
  const sDed = Math.min(serviceDeduction(y), income);
  const converted = fl(((income - sDed) * 12) / y);
  const cDed = Math.min(convertedDeduction(converted), converted);
  const base = converted - cDed;
  const tax = fl((taxOn(base) * y) / 12);
  const local = fl((taxOn(base) * r.localTax.ratio * y) / 12);
  const total = tax + local;
  return {
    income, years: y, serviceDeduction: sDed, converted, convertedDeduction: cDed, base, tax, local, total,
    net: income - total,
    /** 실효세율(지방세 포함) */
    effective: income ? total / income : 0,
  };
}

/** 퇴직소득을 연금으로 받을 때 원천징수 비율 — 실제 수령연차별 70%·60%·50% */
export function pensionReceiptRatio(receiptYear: number): number {
  const P = r.pensionReceipt;
  return receiptYear <= 10 ? P.upTo10 : receiptYear <= 20 ? P.upTo20 : P.over20;
}

/** 퇴직금(평균임금 × 30일 × 근속연수) — 1년 단위 */
export function severancePay(averageDailyWage: number, years: number): number {
  return fl(averageDailyWage * r.pay.daysPerYear * years);
}

/** 평균임금 — 이전 3개월 임금 총액 ÷ 그 기간의 총일수 */
export function averageDailyWage(threeMonthWages: number, days: number): number {
  return days > 0 ? threeMonthWages / days : 0;
}
