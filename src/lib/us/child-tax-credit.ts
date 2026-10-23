/**
 * 미국 연방 Child Tax Credit · Credit for Other Dependents · Additional Child Tax Credit(26 U.S.C. 24, Schedule 8812)
 * — 미국판 /en-us/child-tax-credit/ 가 쓴다. 한국 자녀장려금과 제도가 달라 짝(hreflang)이 아니다(조사표 26행 미국 칸 '제도').
 *
 * 원문(2026-10-23 확인) — rates/us/child-tax-credit-2026.json:
 * - §24(h)(2)~(7)·(b)(1)·(d)(1): 자녀 1명 $2,200 · 기타 부양가족 $500 · MAGI 가 $400,000(MFJ)/$200,000 넘는 $1,000(끝수 포함)마다 $50 감소
 *   · 환급(ACTC) 상한 자녀 1명 $1,700 · 15% × (earned − $2,500), 자녀 3명 이상은 사회보장세 − EIC 와 비교.
 * - Rev. Proc. 2024-40(2025)·2025-32(2026) §3.05: 두 해 모두 $2,200 · $1,700.
 * - Schedule 8812 (2025) 줄 1~27 순서 그대로. 2026 서식은 아직 없음 — 2026 값은 Rev. Proc. 2025-32 금액 + 2025 서식 방법.
 *
 * 세액(line 13, Credit Limit Worksheet A)·사회보장세·EIC 는 사용자 입력. 자격 판정·Worksheet B·Form 2555·주(州) credit 은 계산하지 않는다.
 */
import rates from "../../rates/us/child-tax-credit-2026.json";

export type Year = 2025 | 2026;
/** mfj = 부부 공동, other = 그 밖 모든 신고 상태(line 9) */
export type Status = "mfj" | "other";

export const SOURCES = rates.sources;
export const ANCHORS = rates.anchorTests;

const N = rates.amounts.notIndexed;
export const ODC = N.odcPerDependent;
export const THRESHOLD = N.phaseoutThreshold;
export const PHASEOUT_STEP = N.phaseoutStep;
export const PHASEOUT_RATE = N.phaseoutRate;
export const EARNED_FLOOR = N.earnedIncomeFloor;
export const EARNED_RATE = N.earnedIncomeRate;
/** Part II-B 를 보는 자녀 수(2025 서식 '$5,100' = 3 × $1,700) */
export const PART_IIB_CHILDREN = 3;

const AMOUNTS: Record<Year, { ctcPerChild: number; actcCapPerChild: number }> = {
  2025: rates.amounts["2025"],
  2026: rates.amounts["2026"],
};

export function amounts(year: Year) {
  return AMOUNTS[year];
}

/** 센트 단위 반올림(부동소수 오차 제거) */
const cents = (x: number) => Math.round(x * 100) / 100;
const pos = (x: number | undefined) => Math.max(0, cents(x || 0));
const int = (x: number | undefined) => Math.max(0, Math.floor(x || 0));

export interface CtcInput {
  year: Year;
  status: Status;
  /** CTC 자격 자녀(17세 미만·SSN) */
  children: number;
  /** 기타 부양가족(17세 이상 자녀·SSN 없는 자녀·부모 등) */
  otherDependents: number;
  /** line 3 MAGI */
  magi: number;
  /** line 13 Credit Limit Worksheet A — 세액 한도 */
  taxLimit: number;
  /** line 18a earned income */
  earned: number;
  /** line 21 W-2 box 4 + box 6 (자녀 3명 이상일 때만 씀) */
  socialSecurityTaxes?: number;
  /** line 24 Form 1040 line 27a EIC (자녀 3명 이상일 때만 씀) */
  eic?: number;
}

export interface CtcResult {
  line4: number;
  line5: number;
  line6: number;
  line7: number;
  line8: number;
  line9: number;
  line10: number;
  line11: number;
  line12: number;
  line13: number;
  /** CTC + ODC(비환급) */
  line14: number;
  line16a: number;
  line16b: number;
  line17: number;
  line20: number;
  /** Part II-B 를 거쳤으면 숫자, 아니면 null */
  line25: number | null;
  /** ACTC(환급형) */
  line27: number;
  total: number;
  /** ACTC 가 없는 이유 */
  actcReason: "ok" | "noCredit" | "fullyUsed" | "noChildren" | "noEarned";
}

/** Schedule 8812 (2025) Part I·II-A·II-B */
export function computeCtc(i: CtcInput): CtcResult {
  const a = AMOUNTS[i.year];
  const line4 = int(i.children);
  const line6 = int(i.otherDependents);
  const line5 = line4 * a.ctcPerChild;
  const line7 = line6 * ODC;
  const line8 = line5 + line7;
  const line9 = i.status === "mfj" ? THRESHOLD.mfj : THRESHOLD.other;
  const over = cents(pos(i.magi) - line9);
  const line10 = over > 0 ? Math.ceil(over / PHASEOUT_STEP - 1e-9) * PHASEOUT_STEP : 0;
  const line11 = cents(line10 * PHASEOUT_RATE);
  const line12 = Math.max(0, cents(line8 - line11));
  const line13 = pos(i.taxLimit);
  const zero = { line16a: 0, line16b: 0, line17: 0, line20: 0, line25: null, line27: 0 };
  const base = { line4, line5, line6, line7, line8, line9, line10, line11, line12, line13 };
  if (line12 === 0) return { ...base, line14: 0, ...zero, total: 0, actcReason: "noCredit" };
  const line14 = Math.min(line12, line13);
  const line16a = cents(line12 - line14);
  if (line4 === 0) return { ...base, line14, ...zero, line16a, total: line14, actcReason: "noChildren" };
  if (line16a === 0) return { ...base, line14, ...zero, total: line14, actcReason: "fullyUsed" };
  const line16b = line4 * a.actcCapPerChild;
  const line17 = Math.min(line16a, line16b);
  const line20 = cents(Math.max(0, pos(i.earned) - EARNED_FLOOR) * EARNED_RATE);
  let line25: number | null = null;
  let line27: number;
  if (line4 >= PART_IIB_CHILDREN && line20 < line17) {
    line25 = Math.max(0, cents(pos(i.socialSecurityTaxes) - pos(i.eic)));
    line27 = Math.min(line17, Math.max(line20, line25));
  } else {
    line27 = Math.min(line17, line20);
  }
  return {
    ...base,
    line14,
    line16a,
    line16b,
    line17,
    line20,
    line25,
    line27,
    total: cents(line14 + line27),
    actcReason: line27 > 0 ? "ok" : "noEarned",
  };
}

/** MAGI 에서 credit 이 다 없어지는 지점(line 8 이 $50 단위로 다 줄어드는 MAGI) */
export function phaseoutEnd(status: Status, line8: number): number {
  const t = status === "mfj" ? THRESHOLD.mfj : THRESHOLD.other;
  return t + Math.ceil(line8 / (PHASEOUT_STEP * PHASEOUT_RATE)) * PHASEOUT_STEP - PHASEOUT_STEP;
}
