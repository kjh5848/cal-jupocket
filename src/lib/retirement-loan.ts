/**
 * 퇴직연금을 깨지 않고 쓰는 길 — 수급권 담보대출.
 *
 * irp-account.ts 쪽이 "넣을 때"(납입한도·세액공제)를 다룬다면 이 파일은
 * "중간에 꺼낼 때"다. 그리고 꺼내는 길이 둘이라는 것이 이 주제의 전부다.
 * 중도인출은 적립금을 빼내는 것이고, 담보대출은 적립금을 그대로 둔 채
 * 그 수급권을 담보로 돈을 빌리는 것이다(법 제7조 제2항).
 *
 * 숫자는 전부 rates/retirement-loan-2026.json 에서 온다. 그 파일은
 * 근로자퇴직급여 보장법 제7조와 같은 법 시행령 제2조·제14조·제18조
 * 조문 원문에서 확인한 것이다.
 *
 * 다루지 않는 것(rates 의 notVerified 참조): 금리·이자율, DSR 산입 여부,
 * 고용노동부장관 고시의 휴업·재난 사유와 한도, 필요 서류. 조문에 없다.
 */
import rates from "../rates/retirement-loan-2026.json";

/** 원 단위로 맞춘다 — 한도는 올려 잡으면 안 되므로 버린다. */
const won = (n: number) => Math.floor(Math.max(0, n));

/** 사유가 그 길로 열리는지 — 되거나, 조건이 붙거나, 안 되거나. */
export type Availability = "yes" | "limited" | "no";

export interface LoanReason {
  key: string;
  /** 시행령의 호 번호. 표에 그대로 싣는다. */
  clause: string;
  label: string;
  collateral: Availability;
  dcWithdrawal: Availability;
  irpWithdrawal: Availability;
  note: string;
}

export const reasons: LoanReason[] = rates.reasons as LoanReason[];

/** 적립금의 100분의 50 (시행령 제2조 제2항 제1호). */
export const limitPercent: number = rates.collateralLimit.percentOfBalance;

/**
 * 담보로 제공할 수 있는 한도.
 *
 * 시행령 제2조 제2항 제1호는 "가입자별 적립금의 100분의 50" 이라고만
 * 적는다. 대출 실행액이 아니라 담보로 제공할 수 있는 권리의 한도다.
 */
export function collateralLimit(balance: number): number {
  return won((balance * limitPercent) / 100);
}

/**
 * 담보대출로만 열리는 사유 — 중도인출 사유에는 없는 것.
 *
 * 이 글의 반전이 여기 있다. 대학등록금·혼례비·장례비(시행령 제2조
 * 제1항 제4호의2)는 담보제공 사유에는 있는데 제14조·제18조의 중도인출
 * 사유 목록에는 아예 없다.
 */
export function collateralOnly(): LoanReason[] {
  return reasons.filter(
    (r) =>
      r.collateral === "yes" &&
      r.dcWithdrawal === "no" &&
      r.irpWithdrawal === "no",
  );
}

/**
 * 담보로는 조건 없이 되는데 중도인출에는 조건이 붙는 사유.
 *
 * 의료비(제2호)와 휴업·재난(제5호)이 여기 걸린다. "된다/안 된다"로만
 * 적으면 이 층이 지워지므로 따로 센다.
 */
export function narrowerWhenWithdrawing(): LoanReason[] {
  return reasons.filter(
    (r) =>
      r.collateral === "yes" &&
      (r.dcWithdrawal === "limited" || r.irpWithdrawal === "limited"),
  );
}

export const principle = rates.principle;
export const scope = rates.scope;
export const collateralLimitRule = rates.collateralLimit;
export const loanRepaymentWithdrawal = rates.loanRepaymentWithdrawal;
export const lawVersion = rates.lawVersion;
export const verifiedOn = rates.verifiedOn;
export const sources = rates.sources;
