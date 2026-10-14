/**
 * 가상자산(코인) 과세 — 소득세법 제21조 제1항 제27호, 제37조 제1항 제3호·제5항, 제64조의3 제2항(250만원 공제·20%),
 * 제84조 제3호, 지방세법 제93조 제18항(2%). 2027. 1. 1. 이후 양도·대여분부터. rates: crypto-2026.json
 */
import r from "../rates/crypto-2026.json";

const fl = (v: number) => Math.floor(v + 1e-6);

export interface CryptoInput {
  /** 한 해 양도가액 합계 */
  proceeds: number;
  /** 실제 취득가액 합계 */
  cost: number;
  /** 2027. 1. 1. 전 보유분의 2026. 12. 31. 시가 합계(해당 없으면 0) */
  fairValue2026?: number;
  /** 거래 수수료 등 부대비용 */
  fees?: number;
}

export function cryptoTax(o: CryptoInput) {
  const basis = Math.max(o.cost, o.fairValue2026 ?? 0);
  const income = o.proceeds - basis - (o.fees ?? 0);
  const taxable = Math.max(0, income - r.deduction);
  const tax = income <= r.deduction ? 0 : fl(taxable * r.rate);
  const local = income <= r.deduction ? 0 : fl(taxable * r.localRate);
  return { basis, income, taxable, tax, local, total: tax + local };
}
