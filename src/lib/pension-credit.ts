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
