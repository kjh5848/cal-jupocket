/**
 * HUG 전세보증 — 가입 가능 여부 추산과 전세 계약 일정(2026-11-07).
 *
 * 근거: src/rates/hug-jeonse-2026.json (HUG 전세반환보증·전세안심보증 상품개요, 주택임대차보호법,
 * 부동산 거래신고 등에 관한 법률). 조사: docs/research/2026-11-07-hug-jeonse.md
 *
 * 결과는 '판정'이 아니라 '추산'이다 — HUG 심사는 주택가격 적용 순서·서류·권리관계를 더 본다.
 * 보증료는 계산하지 않는다(구간별 요율표 미확인).
 */
import r from "../rates/hug-jeonse-2026.json";
import { addMonths } from "./date-calc";

const G = r.guarantee;
const D = r.deadlines;

export type HouseType = "apartment" | "officetel" | "row" | "multi";
export type PriceBasis = "public" | "market";

export interface GuaranteeInput {
  type: HouseType;
  capital: boolean;
  /** 보증금(원) */
  deposit: number;
  /** 선순위채권 — 근저당 채권최고액 등(원) */
  senior: number;
  /** 단독·다가구·다중: 나보다 앞선 다른 세입자 보증금 합계(원) */
  otherDeposits?: number;
  /** 가격 기준 — public: 공시가격(× 140%), market: 시세·감정가 그대로 */
  basis: PriceBasis;
  price: number;
}

export interface GuaranteeResult {
  /** HUG 가 보는 주택가격(추산) */
  housePrice: number;
  /** 보증금 + 선순위 가 넘으면 안 되는 선(주택가격 × 90%) */
  ltvLine: number;
  /** 선순위 한도(주택가격 × 60%, 다가구 등은 × 80%) */
  seniorLine: number;
  /** 선순위로 보는 금액(다가구 등은 다른 세입자 보증금 포함) */
  seniorTotal: number;
  depositCap: number;
  depositOk: boolean;
  ltvOk: boolean;
  seniorOk: boolean;
  ok: boolean;
  /** 보증한도 = 주택가격 × 90% − 선순위 (0 밑으로 내려가지 않음) */
  guaranteeLimit: number;
  /** 지금 조건에서 보증이 되는 최대 보증금(상한·90% 선 중 작은 쪽) */
  maxDeposit: number;
}

const floorWon = (v: number) => Math.floor(v);

export function hugGuarantee(x: GuaranteeInput): GuaranteeResult {
  const housePrice = floorWon(x.basis === "public" ? (x.price * G.publicPriceMultiplierPct) / 100 : x.price);
  const multi = x.type === "multi";
  const seniorTotal = x.senior + (multi ? (x.otherDeposits ?? 0) : 0);
  const ltvLine = floorWon((housePrice * G.ltvLimitPct) / 100);
  const seniorLine = floorWon((housePrice * (multi ? G.seniorLimitMultiFamilyPct : G.seniorLimitPct)) / 100);
  const depositCap = x.capital ? G.depositCap.capital : G.depositCap.other;
  const depositOk = x.deposit <= depositCap;
  const ltvOk = x.deposit + seniorTotal <= ltvLine;
  const seniorOk = seniorTotal <= seniorLine;
  const guaranteeLimit = Math.max(0, ltvLine - seniorTotal);
  return {
    housePrice,
    ltvLine,
    seniorLine,
    seniorTotal,
    depositCap,
    depositOk,
    ltvOk,
    seniorOk,
    ok: depositOk && ltvOk && seniorOk,
    guaranteeLimit,
    maxDeposit: seniorOk ? Math.min(depositCap, guaranteeLimit) : 0,
  };
}

/* ── 일정 ─────────────────────────────────────────────── */

export interface ScheduleInput {
  /** 계약일 · 잔금일(임대차 시작) · 전입일 · 계약 만료일 — date-calc 의 day 번호 */
  contract: number;
  start: number;
  moveIn: number;
  end: number;
}

export interface ScheduleItem {
  key: string;
  day: number;
  title: string;
  what: string;
  basis: string;
}

/** 날짜 순으로 정렬된 할 일. 계약일보다 앞서는 항목(이미 지난 사전한도심사 등)은 뺀다. */
export function hugSchedule(x: ScheduleInput): ScheduleItem[] {
  const early = Math.min(x.start, x.moveIn);
  const late = Math.max(x.start, x.moveIn);
  const half = Math.floor((x.end - x.start) * D.returnGuaranteeTermFraction);
  const items: ScheduleItem[] = [
    { key: "lease-report", day: x.contract + D.leaseReportDays, title: "임대차 신고 마감", what: `계약일부터 ${D.leaseReportDays}일 안에 주민센터나 부동산거래관리시스템에 신고합니다. 전입신고를 하면 신고한 것으로 봅니다.`, basis: "부동산 거래신고 등에 관한 법률 제6조의2·제6조의5" },
    { key: "pre-limit", day: x.start - D.preLimitReviewDaysBefore, title: "HUG 사전한도심사 마감", what: `계약 시작 ${D.preLimitReviewDaysBefore}일 전까지 안심전세앱에서 신청합니다(아파트·오피스텔·연립·다세대).`, basis: "HUG 전세반환보증 상품개요" },
    { key: "move-in", day: x.moveIn, title: "전입신고·확정일자", what: "잔금일에 등기부를 한 번 더 떼 보고, 전입신고와 확정일자를 받습니다. 대항력은 인도와 전입을 마친 다음 날부터 생깁니다.", basis: "주택임대차보호법 제3조·제3조의2" },
    { key: "loan-guarantee", day: addMonths(early, D.loanGuaranteeMonths), title: "버팀목 대출·전세안심보증 신청 마감", what: `잔금일과 전입일 중 빠른 날부터 ${D.loanGuaranteeMonths}개월 안에 신청합니다.`, basis: "HUG 전세안심보증 상품개요, 주택도시기금 버팀목 안내" },
    { key: "return-guarantee", day: late + half, title: "전세반환보증 가입 마감(추산)", what: "잔금일과 전입일 중 늦은 날부터 계약기간의 절반이 지나기 전에 가입합니다.", basis: "HUG 전세반환보증 상품개요" },
    { key: "renewal-open", day: addMonths(x.end, -D.renewalNoticeFromMonths), title: "갱신·이사 의사 알리기 시작", what: `만료 ${D.renewalNoticeFromMonths}개월 전부터 갱신을 요구하거나 갱신하지 않겠다고 알릴 수 있습니다.`, basis: "주택임대차보호법 제6조·제6조의3" },
    { key: "renewal-deadline", day: addMonths(x.end, -D.renewalNoticeToMonths), title: "갱신거절 통지 마감 — 증빙 보관", what: `만료 ${D.renewalNoticeToMonths}개월 전까지 알리지 않으면 같은 조건으로 갱신된 것으로 봅니다. HUG 보증금 청구에는 이 기한 안에 알렸다는 증빙(내용증명 도달, 답장이 있는 문자 등)이 필요합니다.`, basis: "주택임대차보호법 제6조, HUG 보증사고 이행청구 안내" },
    { key: "end", day: x.end, title: "계약 만료", what: "보증금을 돌려받는 날입니다. 받기 전에 전출하지 않습니다.", basis: "주택임대차보호법" },
    { key: "accident", day: addMonths(x.end, D.accidentAfterMonths), title: "보증사고 — 이행청구 준비", what: `만료 후 ${D.accidentAfterMonths}개월이 지나도 못 받으면 보증사고입니다. 임차권등기명령을 신청하고 HUG에 이행청구합니다.`, basis: "HUG 보증사고 이행청구 안내, 주택임대차보호법 제3조의3" },
  ];
  return items.filter((i) => i.day >= x.contract).sort((a, b) => a.day - b.day);
}
