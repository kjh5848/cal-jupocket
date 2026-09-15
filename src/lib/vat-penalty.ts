/**
 * 부가세 가산세 — 부가가치세법 제60조.
 *
 * 숫자는 전부 rates/vat-penalty-2026.json 에서 온다. 여기서 하는 일은
 * **공급가액에 요율을 곱하는 것**뿐이다.
 *
 * 이 파일이 조심하는 세 가지:
 *
 * 1. **기준이 세액이 아니라 공급가액이다.** 국세기본법 가산세(무신고·
 *    과소신고·납부지연, lib/penalty.ts)는 *세액* 기준인데 제60조는
 *    *공급가액* 기준이다. 그래서 낼 세금이 없어도 가산세는 붙는다.
 *    두 파일의 금액을 같은 축에 놓고 비교하면 안 된다.
 * 2. **중복 배제가 있다.** 제60조 제9항이 "이 항이 적용되는 부분에는
 *    저 항을 적용하지 않는다"를 다섯 줄로 정한다. 요율을 단순 합산하면
 *    실제보다 크게 나온다 — 합계를 내지 않는 이유다.
 * 3. **원 단위로 자른다.** money.won() 을 거쳐 소수점을 남기지 않는다.
 */
import rates from "../rates/vat-penalty-2026.json";
import { won } from "./money";

export interface PenaltyRow {
  /** 화면에 그대로 나가는 사유. */
  label: string;
  /** 0.01 = 1%. */
  rate: number;
  /** 공급가액 × rate, 원 단위. */
  amount: number;
  /** 근거 조항. */
  clause: string;
  tone?: "warn";
}

/** 공급가액에 요율을 곱한다 — 이 파일의 유일한 계산이다. */
export function onSupply(supplyValue: number, rate: number): number {
  return won(supplyValue * rate);
}

function row(
  supplyValue: number,
  label: string,
  rate: number,
  clause: string,
  tone?: "warn",
): PenaltyRow {
  return { label, rate, amount: onSupply(supplyValue, rate), clause, tone };
}

/** 세금계산서를 제때 못 줬을 때 — 제60조 제2항. */
export function invoiceRows(supplyValue: number): PenaltyRow[] {
  const t = rates.taxInvoice;
  return [
    row(supplyValue, "지연발급 — 확정신고기한까지는 발급", t.lateIssue, "제2항 제1호"),
    row(supplyValue, "미발급 — 확정신고기한까지 발급 안 함", t.notIssued, "제2항 제2호", "warn"),
    row(supplyValue, "└ 종이로 발급했거나 다른 사업장 명의로 발급", t.notIssuedException, "제2항 제2호 단서"),
    row(supplyValue, "필요적 기재사항 부실기재", t.wrongEntry, "제2항 제5호"),
  ];
}

/** 전자세금계산서 발급명세 전송 — 제60조 제2항 제3호·제4호. */
export function transmitRows(supplyValue: number): PenaltyRow[] {
  const t = rates.taxInvoice;
  return [
    row(supplyValue, "지연전송", t.eTransmitLate, "제2항 제3호"),
    row(supplyValue, "미전송", t.eTransmitNone, "제2항 제4호"),
  ];
}

/** 합계표 — 제60조 제6항(매출)·제7항(매입). */
export function listRows(supplyValue: number): PenaltyRow[] {
  const s = rates.salesList;
  const p = rates.purchaseList;
  return [
    row(supplyValue, "매출처별 합계표 미제출", s.notSubmitted, "제6항 제1호"),
    row(supplyValue, "매출처별 합계표 부실기재", s.wrongEntry, "제6항 제2호"),
    row(supplyValue, "예정신고 때 못 내고 확정신고 때 제출", s.lateAtFinalReturn, "제6항 제3호"),
    row(supplyValue, "매입처별 합계표 미제출·부실기재", p.notSubmittedOrWrong, "제7항 제2호"),
  ];
}

/** 사업자등록 — 제60조 제1항. */
export function registrationRows(supplyValue: number): PenaltyRow[] {
  const r = rates.registration;
  return [
    row(supplyValue, "등록을 기한까지 신청하지 않음", r.lateRegistration, "제1항 제1호"),
    row(supplyValue, "타인 명의로 등록하거나 그 등록을 이용", r.otherName, "제1항 제2호", "warn"),
  ];
}

/** 가공·위장 세금계산서 — 제60조 제3항·제4항. */
export function falseInvoiceRows(supplyValue: number): PenaltyRow[] {
  const f = rates.falseInvoice;
  return [
    row(supplyValue, "공급 없이 발급하거나 발급받음", f.issuedWithoutSupply, "제3항 제1호·제2호", "warn"),
    row(supplyValue, "실제 거래자가 아닌 명의로 발급·수취", f.thirdPartyNameIssued, "제3항 제3호·제4호", "warn"),
    row(supplyValue, "공급가액을 과다하게 적음", f.overstatedIssued, "제3항 제5호·제6호", "warn"),
  ];
}

export const vatPenaltyRates = rates;
