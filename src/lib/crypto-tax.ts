/**
 * 가상자산(코인) 과세 — 소득세법 제21조 제1항 제27호·제3항, 제37조 제1항 제3호·제5항, 제64조의3 제2항(250만원 공제·20%),
 * 제84조 제3호, 지방세법 제93조 제18항(2%). 2027. 1. 1. 이후 양도·대여분부터. rates: crypto-2026.json
 *
 * 제37조 제5항의 비교(2026. 12. 31. 시가 vs 실제 취득가액)는 가상자산마다 따로 한다. 여러 코인을 합계로 넣으면
 * 합계끼리 큰 쪽을 잡게 되어 코인별로 비교한 것보다 취득가액이 작거나 같다 — 세금이 실제보다 크게 나올 수 있다.
 */
import r from "../rates/crypto-2026.json";

const fl = (v: number) => Math.floor(v + 1e-6);

export interface CryptoInput {
  /** 한 해 양도가액 합계 */
  proceeds: number;
  /** 2027. 1. 1. 이후 산 코인의 취득가액 */
  cost?: number;
  /** 2027. 1. 1. 전부터 보유한 코인의 실제 취득가액 */
  preCost?: number;
  /** 2027. 1. 1. 전부터 보유한 코인의 2026. 12. 31. 시가 */
  preFairValue?: number;
  /** 거래 수수료 등 부대비용 */
  fees?: number;
}

export function cryptoTax(o: CryptoInput) {
  const basis = (o.cost ?? 0) + Math.max(o.preCost ?? 0, o.preFairValue ?? 0);
  const income = o.proceeds - basis - (o.fees ?? 0);
  const taxable = Math.max(0, income - r.deduction);
  const tax = income <= r.deduction ? 0 : fl(taxable * r.rate);
  const local = income <= r.deduction ? 0 : fl(taxable * r.localRate);
  return { basis, income, taxable, tax, local, total: tax + local };
}
