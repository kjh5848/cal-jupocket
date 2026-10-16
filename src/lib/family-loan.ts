/**
 * 가족 간 차용 — 무이자·저리 대출의 증여이익(상증법 제41조의4)과 이자 원천징수.
 *
 *   증여이익   대출금 × 4.6% − 실제 낸 이자 (1년 단위)        제41조의4 ①②, 시행규칙 제10조의5
 *   기준금액   1천만원 미만이면 제외, 이상이면 전액            시행령 제31조의4 ②
 *   증여세     증여이익을 증여재산가액으로 gift.ts computeGift (관계별 공제 먼저)
 *   여러 해    1년 넘는 대출은 해마다 새 증여이익(법 ②). 무상대출 이익은 합산배제가 아니라
 *              10년 합산(제47조 ①②)되고 공제도 10년 한도(제53조) → 첫해 0원이어도 몇 년째부터 세금
 *   이자 받기  비영업대금의 이익 25% + 지방소득세 10%          소득세법 제129조, 지방세법 제103조의13
 */
import r from "../rates/family-loan-2026.json";
import fin from "../rates/financial-income-2026.json";
import local from "../rates/local-extra-2026.json";
import { computeGift, relationCap, type Relation } from "./gift";
import gift from "../rates/gift-2026.json";

const L = r.loanGift;
const fl = (v: number) => Math.floor(v + 1e-6);

/** 1년치 증여이익 — principal 대출금, annualRate 실제 약정 이자율(연) */
export function loanGain(principal: number, annualRate = 0) {
  const p = Math.max(0, fl(principal));
  const fair = fl(p * L.rate);
  const interest = fl(p * Math.max(0, annualRate));
  const gain = Math.max(0, fair - interest);
  const taxable = gain >= L.threshold;
  return { fair, interest, gain, taxable, giftValue: taxable ? gain : 0 };
}

/** 이 이자율로 빌릴 때 1년 증여이익이 1천만원 미만인 가장 큰 대출금(원). 이자율이 4.6% 이상이면 Infinity */
export function noGiftPrincipal(annualRate = 0): number {
  const gap = L.rate - Math.max(0, annualRate);
  if (gap <= 0) return Infinity;
  let p = Math.floor(L.threshold / gap);
  while (loanGain(p, annualRate).gain >= L.threshold) p -= 1;
  return p;
}

/** 1년치 증여이익에 대한 증여세(관계별 공제 반영). 1천만원 미만이면 대상 아님 */
export function loanGiftTax(principal: number, annualRate = 0, relation: Relation = "ascendant", usedWithin10y = 0) {
  const g = loanGain(principal, annualRate);
  const tax = g.taxable ? computeGift({ amount: g.giftValue, relation, usedWithin10y }) : null;
  return { ...g, tax };
}

/**
 * 같은 대출이 이어질 때 증여세가 처음 생기는 해(1부터). 10년 안에 안 생기면 Infinity.
 * k년째 과세가액 = 그해까지 증여이익 합계(제47조 ②), 과세표준 = 합계 − 관계별 공제 10년 한도,
 * 50만원 미만이면 부과하지 않는다(제55조 ②). 그해 세액(기납부세액공제 등)은 계산하지 않는다.
 */
export function giftTaxStartYear(principal: number, annualRate = 0, relation: Relation = "ascendant", minor = false): number {
  const g = loanGain(principal, annualRate);
  if (!g.taxable) return Infinity;
  const cap = relationCap(relation, minor);
  for (let k = 1; k <= 10; k++) if (k * g.giftValue - cap >= gift.minimumBase.amount) return k;
  return Infinity;
}

/** 이자를 받는 사람의 세금(지급하는 쪽이 원천징수) — 비영업대금의 이익 25%, 지방소득세 10% */
export function interestWithholding(interest: number) {
  const i = Math.max(0, fl(interest));
  const tax = fl(i * fin.withholding.nonBusinessLoan);
  const localTax = fl(tax * local.localIncome.specialRatio);
  return { tax, localTax, net: i - tax - localTax };
}
