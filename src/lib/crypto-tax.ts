/**
 * 가상자산(코인) 과세 — 소득세법 제21조 제1항 제27호·제3항, 제37조 제1항 제3호·제5항, 제64조의3 제2항(250만원 공제·20%),
 * 제84조 제3호, 지방세법 제93조 제18항(2%). 2027. 1. 1. 이후 양도·대여분부터. rates: crypto-2026.json
 *
 * 제37조 제5항의 비교(2026. 12. 31. 시가 vs 실제 취득가액)는 가상자산마다 따로 한다. 여러 코인을 합계로 넣으면
 * 합계끼리 큰 쪽을 잡게 되어 코인별로 비교한 것보다 취득가액이 작거나 같다 — 세금이 실제보다 크게 나올 수 있다.
 */
import r from "../rates/crypto-2026.json";

/** 원 미만 버림 — 20%·2% 를 정수 백분율로 곱해 부동소수점 1원 모자람을 막는다 */
const pctOf = (v: number, rate: number) => Math.floor((v * Math.round(rate * 100)) / 100);

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
  const tax = income <= r.deduction ? 0 : pctOf(taxable, r.rate);
  const local = income <= r.deduction ? 0 : pctOf(taxable, r.localRate);
  return { basis, income, taxable, tax, local, total: tax + local };
}

/**
 * 계산기 화면용 — cryptoTax() 에 더해:
 *   preBasis        2027년 전 보유분으로 빼는 취득가액(실제 취득가액과 2026. 12. 31. 시가 중 큰 쪽, 제37조 ⑤)
 *   stepUp          2026년 말 시가 규정으로 늘어난 취득가액(시가 − 실제 취득가액, 음수면 0)
 *   stepUpSaving    그 규정이 없을 때보다 줄어든 세금
 *   deductionSaving 250만원 공제로 줄어든 세금(공제가 없을 때 소득금액 전부에 붙었을 세금 − 낼 세금)
 *   room            올해 세금 없이 더 낼 수 있는 이익(250만원 − 소득금액, 손실이면 그만큼 더 — 한 해 안에서는 손익을 합한다, 제21조 ③)
 *   kept            손에 남는 이익(소득금액 − 세금, 손실이면 0)
 *   loss            한 해 손익이 손실인가 — 다음 해 이월 규정은 조문에서 찾지 못했다(rates notVerified)
 *   effectiveRate   세금 ÷ 소득금액(%, 소수 둘째 자리 반올림 — 표시용)
 */
export function cryptoPage(o: CryptoInput) {
  const x = cryptoTax(o);
  const noFv = cryptoTax({ ...o, preFairValue: 0 });
  const plain = Math.max(0, x.income);
  return {
    ...x,
    fees: o.fees ?? 0,
    cost: o.cost ?? 0,
    preBasis: Math.max(o.preCost ?? 0, o.preFairValue ?? 0),
    stepUp: Math.max(0, (o.preFairValue ?? 0) - (o.preCost ?? 0)),
    stepUpSaving: noFv.total - x.total,
    deductionSaving: pctOf(plain, r.rate) + pctOf(plain, r.localRate) - x.total,
    room: Math.max(0, r.deduction - x.income),
    kept: Math.max(0, x.income - x.total),
    loss: x.income < 0,
    effectiveRate: x.income > 0 ? Math.round((x.total / x.income) * 10000) / 100 : 0,
  };
}
