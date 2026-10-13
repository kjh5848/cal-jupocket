/**
 * 복권 당첨금 세금 — 소득세법 제84조 제2호(건별 200만원 이하 과세 안 함), 제129조 제1항 제6호(20%, 3억원 초과분 30%),
 * 제14조 제3항 제8호 라목(분리과세), 지방세법 제103조의13(소득세의 10%). rates: lottery-2026.json
 *
 * 당첨금 전액을 소득금액으로 본다 — 복권 구입비를 필요경비로 빼는 조문을 찾지 못했다(notVerified).
 */
import r from "../rates/lottery-2026.json";

/** 원 미만 버림 — 부동소수점 오차 보정 */
const fl = (v: number) => Math.floor(v + 1e-6);

export interface LotteryTax {
  prize: number;
  taxable: boolean;
  /** 3억원까지 20% 부분 */
  baseTax: number;
  /** 3억원 초과분 30% 부분 */
  overTax: number;
  tax: number;
  local: number;
  total: number;
  net: number;
  /** 세금 합계 ÷ 당첨금 */
  effective: number;
}

export function lotteryTax(prize: number): LotteryTax {
  const p = Math.max(0, Math.floor(prize));
  const taxable = p > r.minimum.upTo;
  const baseTax = taxable ? fl(Math.min(p, r.rate.over) * r.rate.base) : 0;
  const overTax = taxable ? fl(Math.max(0, p - r.rate.over) * r.rate.overRate) : 0;
  const tax = baseTax + overTax;
  const local = fl(tax * r.local.ratio);
  const total = tax + local;
  return { prize: p, taxable, baseTax, overTax, tax, local, total, net: p - total, effective: p ? total / p : 0 };
}
