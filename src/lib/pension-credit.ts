/**
 * 연금계좌세액공제 — 소득세법 제59조의3.
 *
 * 한도는 두 단계가 겹쳐 있다. 연금저축계좌는 600만원까지만 세고, 그 600만원
 * 이내 금액과 퇴직연금계좌(IRP) 납입액을 합쳐 900만원까지 센다. 그래서 같은
 * 900만원이라도 연금저축에만 넣으면 600만원, IRP 에 넣으면 900만원이 공제
 * 대상이 된다.
 *
 * ISA 만기 자금을 연금계좌로 옮기면(같은 조 제3항·제4항) 그 금액의 10%와
 * 300만원 중 적은 금액이 한도 위에 더해진다. 직전 과세기간과 나눠 옮긴 경우의
 * 차감 규정은 다루지 않는다 — 함수가 받는 값은 한 과세기간 기준이다.
 */
import pensionAccount from "../rates/pension-account-2026.json";
import rates from "../rates/2026.json";

export const SAVINGS_CAP = pensionAccount.savingsOnlyLimit; // 6,000,000
export const COMBINED_CAP = pensionAccount.combinedLimit; // 9,000,000
export const ISA_EXTRA_CAP = 3_000_000;
export const ISA_EXTRA_RATE = 0.1;

export interface Contribution {
  /** 연금저축계좌 납입액 */
  savings: number;
  /** 퇴직연금계좌(IRP 등) 납입액 */
  irp: number;
  /** ISA 만기 전환금액. 없으면 0 */
  isaTransfer?: number;
}

/** 세액공제 대상 금액. */
export function eligibleAmount({ savings, irp, isaTransfer = 0 }: Contribution): number {
  if (savings < 0 || irp < 0 || isaTransfer < 0) throw new RangeError("납입액은 0 이상이어야 한다");
  const base = Math.min(Math.min(savings, SAVINGS_CAP) + irp, COMBINED_CAP);
  const isaExtra = Math.min(Math.floor(isaTransfer * ISA_EXTRA_RATE), ISA_EXTRA_CAP);
  return base + isaExtra;
}

/**
 * 공제율(%). 종합소득금액 4,500만원 이하(근로소득만 있으면 총급여 5,500만원 이하)면 15,
 * 넘으면 12. 어느 쪽인지는 호출하는 쪽이 판정해 넘긴다.
 */
export function creditRatePercent(lowIncome: boolean): number {
  return lowIncome
    ? pensionAccount.creditRatePercentBelowThreshold
    : pensionAccount.creditRatePercentAboveThreshold;
}

export interface Credit {
  eligible: number;
  /** 소득세에서 빠지는 금액 */
  incomeTax: number;
  /** 지방소득세(소득세의 10%)까지 합친 금액 */
  withLocal: number;
}

export function pensionCredit(c: Contribution, lowIncome: boolean): Credit {
  const eligible = eligibleAmount(c);
  const incomeTax = Math.floor((eligible * creditRatePercent(lowIncome)) / 100);
  const withLocal = incomeTax + Math.floor(incomeTax * rates.localTaxRate);
  return { eligible, incomeTax, withLocal };
}

/**
 * 공제가 낼 세금보다 크면 — 소득세법 제61조 제2항.
 * 세액공제 합계는 산출세액을 넘을 수 없다. 넘는 몫은 없는 것으로 하고,
 * 그만큼은 연금계좌세액공제를 받지 않은 것으로 본다(제3항).
 * 여기서는 연금계좌세액공제 하나만 놓고 본다(다른 공제가 있으면 그만큼 더 줄어든다).
 */
export function cappedByTax(credit: number, computedTax: number): { used: number; unused: number } {
  if (credit < 0 || computedTax < 0) throw new RangeError("0 이상이어야 한다");
  const used = Math.min(credit, computedTax);
  return { used, unused: credit - used };
}

export interface Room {
  /** 한도를 넘겨 공제 대상에서 빠진 납입액(연금저축 600만원 초과분 + 합계 900만원 초과분) */
  over: number;
  /** 900만원까지 남은 금액 — IRP·DC 에 더 넣으면 공제 대상이 되는 몫(ISA 추가분은 따로) */
  room: number;
  /** room 을 채우면 더 줄어드는 세금(지방소득세 포함). 산출세액 한도에 걸리면 그만큼만 */
  extraWithLocal: number;
}

/**
 * 한도까지 얼마 남았나 — 제59조의3 제1항 한도(600만·900만)만으로 닫히는 숫자.
 * 남은 한도는 ISA 추가분을 뺀 기본 금액으로 센다(ISA 추가분은 900만원 위에 따로 얹힌다).
 * computedTax(산출세액)를 주면 제61조 한도까지만 — 더 넣어도 줄일 세금이 없으면 0.
 */
export function roomToCap(c: Contribution, lowIncome: boolean, computedTax = 0): Room {
  const base = Math.min(Math.min(c.savings, SAVINGS_CAP) + c.irp, COMBINED_CAP);
  const over = c.savings + c.irp - base;
  const room = COMBINED_CAP - base;
  const now = pensionCredit(c, lowIncome).incomeTax;
  const full = pensionCredit({ ...c, irp: c.irp + room }, lowIncome).incomeTax;
  const cap = (x: number) => (computedTax > 0 ? Math.min(x, computedTax) : x);
  const extraWithLocal = withLocalTax(cap(full)) - withLocalTax(cap(now));
  return { over, room, extraWithLocal };
}

/**
 * 연금계좌에서 꺼낼 때의 세금 — 소득세법 제20조의3·제21조·제129조.
 * 과세 대상은 공제받은 원금과 운용수익뿐이다. 공제받지 않은 원금은 세금이 없다.
 * 반환값은 소득세이고, withLocal 은 지방소득세 10% 를 더한 값이다.
 */
export function withdrawalTax(
  a: { creditedPrincipal: number; gains: number; uncreditedPrincipal?: number },
  ratePercent: number,
): { taxable: number; incomeTax: number; withLocal: number } {
  const taxable = a.creditedPrincipal + a.gains;
  const incomeTax = Math.floor((taxable * ratePercent) / 100);
  return { taxable, incomeTax, withLocal: incomeTax + Math.floor(incomeTax * rates.localTaxRate) };
}

/** 연금수령 세율(%) — 연금수령일 현재 나이. 제129조 제1항 제5호의2 가목 표. */
export function annuityRatePercent(age: number): number {
  const t = pensionAccount.withdrawalTax.annuityByAge.table;
  if (age < 70) return t[0].ratePercent;
  if (age < 80) return t[1].ratePercent;
  return t[2].ratePercent;
}

export const NON_ANNUITY_RATE = pensionAccount.withdrawalTax.nonAnnuity.ratePercent; // 15

/** 소득세에 지방소득세(소득세의 10%)를 더한 값. */
export const withLocalTax = (incomeTax: number): number => incomeTax + Math.floor(incomeTax * rates.localTaxRate);
