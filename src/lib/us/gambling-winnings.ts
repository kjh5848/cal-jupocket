/**
 * 미국 연방 복권·도박 당첨금 원천징수와 추가 연방세 — 미국판 /en-us/lottery-tax/ 가 쓴다.
 * 한국 복권 당첨금 세금(분리과세 22%·33%)과 제도가 달라 짝(hreflang)이 아니다(조사표 43행 미국 칸 '제도').
 *
 * 원문(2026-10-24 확인) — rates/us/gambling-winnings-2026.json:
 * - 26 U.S.C. 3402(q)(1)·(3)·(4)·(5) + 1(j)(2)(F): proceeds(당첨금 − 베팅액, 현물은 FMV) > $5,000 이면 proceeds 전액 × 24%.
 *   주 복권·sweepstakes·wagering pool 은 300배 요건 없음, 그 밖 베팅은 proceeds ≥ 300 × 베팅액일 때만, slot·keno·bingo 는 없음.
 * - W-2G 지침(Rev. January 2026): 현물을 지급자가 세금 부담하면 31.58%.
 * - Rev. Proc. 2025-32 §4.01 세율표(2026)·§4.14 표준공제.
 *
 * 추가 연방세 = tax(다른 소득 + 당첨금 − 공제) − tax(다른 소득 − 공제), 세율표 공식(Tax Computation Worksheet 방식).
 * 과세 대상은 당첨금 총액(베팅액은 항목별 공제의 도박 손실로만 돌아온다). 일반 세율만 — 장기 양도·적격 배당 세율, 주(州)세는 계산하지 않는다.
 */
import rates from "../../rates/us/gambling-winnings-2026.json";

export type Status = "single" | "mfj" | "hoh" | "mfs";
/** lottery = 주 복권·sweepstakes·wagering pool(300배 요건 없음) · wager = 경마·스포츠 등 그 밖 베팅(300배 요건) · slots = slot·keno·bingo(정규 원천징수 없음) */
export type Game = "lottery" | "wager" | "slots";

export const SOURCES = rates.sources;
export const ANCHORS = rates.anchorTests;

const W = rates.withholding;
export const REGULAR_RATE = W.regularRate;
export const PROCEEDS_THRESHOLD = W.proceedsThreshold;
export const NONCASH_PAYER_RATE = W.noncashPayerPaidRate;
export const BACKUP_RATE = W.backupRate;
export const FOREIGN_RATE = W.foreignPersonRate;
export const W2G_MINIMUM = rates.reporting.w2gMinimum2026;
export const RATIO_300 = 300;

type Bracket = { upTo: number | null; base: number; rate: number; over: number };
const TABLES = rates.taxRateTables2026 as unknown as Record<Status, Bracket[]>;
const STD = rates.standardDeduction2026;

export function brackets(status: Status): Bracket[] {
  return TABLES[status];
}

export function standardDeduction(status: Status): number {
  return STD[status];
}

/** 센트 단위 반올림(부동소수 오차 제거) */
const cents = (x: number) => Math.round(x * 100) / 100;
const pos = (x: number | undefined) => Math.max(0, cents(x || 0));

/** 2026 세율표(Rev. Proc. 2025-32 §4.01) 공식 — 과세소득 x 의 연방 소득세 */
export function taxFromTable(status: Status, taxable: number): number {
  const x = pos(taxable);
  if (x === 0) return 0;
  const row = TABLES[status].find((b) => b.upTo === null || x <= b.upTo)!;
  return cents(row.base + row.rate * (x - row.over));
}

/** 과세소득 x 가 걸린 구간의 한계세율 */
export function marginalRate(status: Status, taxable: number): number {
  const x = pos(taxable);
  return TABLES[status].find((b) => b.upTo === null || x <= b.upTo)!.rate;
}

/** 정규 원천징수(§3402(q)) — 당첨금·베팅액(현물은 FMV)으로 */
export function regularWithholding(winnings: number, wager: number, game: Game = "lottery"): number {
  const proceeds = pos(pos(winnings) - pos(wager));
  if (game === "slots") return 0;
  if (proceeds <= PROCEEDS_THRESHOLD) return 0;
  if (game === "wager" && proceeds < RATIO_300 * pos(wager)) return 0;
  return cents(REGULAR_RATE * proceeds);
}

/** 현물 경품을 지급자가 세금까지 부담할 때(W-2G 지침 Noncash payments) — 31.58% × (FMV − 베팅액) */
export function noncashPayerPaidWithholding(fmv: number, wager: number): number {
  const proceeds = pos(pos(fmv) - pos(wager));
  if (proceeds <= PROCEEDS_THRESHOLD) return 0;
  return cents(NONCASH_PAYER_RATE * proceeds);
}

export interface LotteryInput {
  status: Status;
  game: Game;
  /** 이번에 받는 당첨금(일시금 또는 올해 연금 지급분) */
  winnings: number;
  /** 베팅액(복권 값) */
  wager: number;
  /** 당첨금 말고 다른 소득(공제 전) */
  otherIncome: number;
  /** 표준공제 또는 항목별 공제 합계 — 비우면 신고 상태의 표준공제 */
  deduction?: number;
}

export interface LotteryResult {
  proceeds: number;
  withholding: number;
  deduction: number;
  taxableWithout: number;
  taxableWith: number;
  taxWithout: number;
  taxWith: number;
  /** 당첨금 때문에 늘어나는 연방 소득세 */
  additionalTax: number;
  /** 추가 연방세 − 원천징수(양수 = 신고 때 더 낼 돈, 음수 = 과다 원천징수) */
  balanceDue: number;
  /** 당첨금을 더한 뒤 한계세율 */
  topRate: number;
  /** 추가 연방세 ÷ 당첨금 */
  effectiveRate: number;
  /** 당첨금 − 원천징수 */
  netAfterWithholding: number;
  /** 당첨금 − 추가 연방세 */
  netAfterFederal: number;
  /** W-2G 를 받을 만한지(2026 기준 $2,000, 원천징수가 있으면 금액과 관계없이) — slot 등 종류별 기준은 다름 */
  w2g: boolean;
}

export function computeLottery(i: LotteryInput): LotteryResult {
  const winnings = pos(i.winnings);
  const wager = pos(i.wager);
  const proceeds = pos(winnings - wager);
  const withholding = regularWithholding(winnings, wager, i.game);
  const deduction = i.deduction === undefined ? standardDeduction(i.status) : pos(i.deduction);
  const other = pos(i.otherIncome);
  const taxableWithout = pos(other - deduction);
  const taxableWith = pos(other + winnings - deduction);
  const taxWithout = taxFromTable(i.status, taxableWithout);
  const taxWith = taxFromTable(i.status, taxableWith);
  const additionalTax = cents(taxWith - taxWithout);
  const balanceDue = cents(additionalTax - withholding);
  const w2gByAmount = i.game !== "slots" && proceeds >= W2G_MINIMUM && (i.game !== "wager" || proceeds >= RATIO_300 * wager);
  return {
    proceeds,
    withholding,
    deduction,
    taxableWithout,
    taxableWith,
    taxWithout,
    taxWith,
    additionalTax,
    balanceDue,
    topRate: marginalRate(i.status, taxableWith),
    effectiveRate: winnings > 0 ? additionalTax / winnings : 0,
    netAfterWithholding: cents(winnings - withholding),
    netAfterFederal: cents(winnings - additionalTax),
    w2g: withholding > 0 || w2gByAmount,
  };
}
