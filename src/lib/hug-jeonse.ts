/**
 * HUG 전세보증 — 가입 가능 여부 추산과 전세 계약 일정(2026-11-07).
 *
 * 근거: src/rates/hug-jeonse-2026.json (HUG 전세반환보증·전세안심보증 상품개요, 주택임대차보호법,
 * 부동산 거래신고 등에 관한 법률). 조사: docs/research/2026-11-07-hug-jeonse.md
 *
 * 결과는 '판정'이 아니라 '추산'이다 — HUG 심사는 주택가격 적용 순서·서류·권리관계를 더 본다.
 * 보증료: hugPremium() — 반환보증 구간별 요율표(2026-11-08 확인). 할인·할증 적용 순서는 원문에 없어 줄을 나눠 보여 준다.
 */
import r from "../rates/hug-jeonse-2026.json";
import { addMonths } from "./date-calc";

const G = r.guarantee;
const D = r.deadlines;
const P = r.premium;

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

/* ── 보증료 ─────────────────────────────────────────── */

export type PremiumDiscount = "none" | "lowIncome" | "multiChild" | "elderly" | "singleElderly" | "newlywed" | "singleParent" | "disabled";

export interface PremiumInput {
  type: HouseType;
  deposit: number;
  /** hugGuarantee() 의 seniorTotal · housePrice */
  seniorTotal: number;
  housePrice: number;
  /** 보증기간(일). 2년 계약이면 730 */
  days: number;
  /** 사회배려계층 할인 하나(중복 불가) */
  discount?: PremiumDiscount;
  /** 전세안심보증이면 전세대출 금액(대출보증 부분 보증료) */
  loan?: number;
  /** 단독·다가구가 타전세계약확인서를 내는가 — 안 내면 그 구간 최고요율 */
  othersConfirmed?: boolean;
}

export interface PremiumResult {
  /** 부채비율(%) 소수 한 자리 — 표시용 */
  debtRatioPct: number;
  /** 0: 70% 이하, 1: 80% 이하, 2: 80% 초과 */
  debtBand: 0 | 1 | 2;
  /** 연 요율, 1/1000 % 단위 정수(154 = 연 0.154%) */
  rateMilli: number;
  ratePct: number;
  /** 요율 × 보증금 × 기간 */
  base: number;
  surchargeApplied: boolean;
  /** 할증 금액(base × 10%) */
  surcharge: number;
  discountPct: number;
  /** (base + 할증) × 할인율 — 적용 순서는 추산 */
  discountAmount: number;
  /** 전세안심보증 대출보증 부분 */
  loanPart: number;
  /** 반환보증 부분 + 할증 − 할인 + 대출보증 부분 */
  total: number;
  /** 연말정산 세액공제 대상 보증금 한도 안인가 */
  taxCreditOk: boolean;
}

export function hugPremium(x: PremiumInput): PremiumResult {
  const T = P.rateTable;
  const band = T.bandMaxWon.findIndex((m) => x.deposit <= m);
  const row = band === -1 ? T.bandMaxWon.length : band;
  const ltvLine = Math.floor((x.housePrice * G.ltvLimitPct) / 100);
  const debt = x.seniorTotal + x.deposit;
  // 나눗셈 대신 정수 교차곱 — 경계(정확히 70%·80%)에서 부동소수 오차를 피한다
  const debtBand: 0 | 1 | 2 = debt * 100 <= ltvLine * T.debtRatioBandsPct[0] ? 0 : debt * 100 <= ltvLine * T.debtRatioBandsPct[1] ? 1 : 2;
  const table = x.type === "apartment" ? T.rateMilliPct.apartment : T.rateMilliPct.other;
  const maxRate = x.type === "multi" && x.othersConfirmed === false;
  const rateMilli = table[row][maxRate ? 2 : debtBand];
  const base = Math.floor((x.deposit * rateMilli * x.days) / (100_000 * 365));
  const surchargeApplied = x.seniorTotal * 100 > ltvLine * P.surchargeSeniorShareOfLtvPct;
  const surcharge = surchargeApplied ? Math.floor((base * P.surchargePct) / 100) : 0;
  const discountPct = !x.discount || x.discount === "none" ? 0 : P.discountPct[x.discount];
  const discountAmount = Math.floor(((base + surcharge) * discountPct) / 100);
  const loanPart = x.loan ? Math.floor((x.loan * P.loanPartRateMilliPct * x.days) / (100_000 * 365)) : 0;
  return {
    debtRatioPct: ltvLine > 0 ? Math.round((debt * 1000) / ltvLine) / 10 : 0,
    debtBand,
    rateMilli,
    ratePct: rateMilli / 1000,
    base,
    surchargeApplied,
    surcharge,
    discountPct,
    discountAmount,
    loanPart,
    total: base + surcharge - discountAmount + loanPart,
    taxCreditOk: x.deposit <= P.taxCreditDepositMax,
  };
}

/** 할인 이름(사회배려계층) — 조건은 원문 그대로 */
export const DISCOUNT_LABEL: Record<Exclude<PremiumDiscount, "none">, string> = {
  lowIncome: `연소득(배우자 포함) ${P.lowIncomeMax / 10_000_000}천만원 이하`,
  multiChild: `미성년 자녀 ${P.multiChildMin}명 이상`,
  elderly: `만 ${P.elderlyAge}세 이상`,
  singleElderly: `혼자 사는 만 ${P.elderlyAge}세 이상`,
  newlywed: `신혼부부(혼인 ${P.newlywedMarriedYearsMax}년 이내, 합산 연소득 ${P.newlywedIncomeMax / 10_000_000}천만원 이하)`,
  singleParent: "한부모가족",
  disabled: "장애인 가구",
};

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
    { key: "lease-report", day: x.contract + D.leaseReportDays, title: "임대차 신고 마감", what: `신고 대상 계약(대통령령으로 정한 금액 초과)이면 계약일부터 ${D.leaseReportDays}일 안에 집주인과 함께 주택 소재지 관청에 신고합니다(읍·면·동에 맡긴 곳은 주민센터). 전입신고를 하면 신고한 것으로 봅니다.`, basis: "부동산 거래신고 등에 관한 법률 제6조의2·제6조의5" },
    { key: "pre-limit", day: x.start - D.preLimitReviewDaysBefore, title: "HUG 사전한도심사 마감", what: `계약 시작 ${D.preLimitReviewDaysBefore}일 전까지 안심전세앱에서 신청합니다(아파트·오피스텔·연립·다세대).`, basis: "HUG 전세반환보증 상품개요" },
    { key: "move-in", day: x.moveIn, title: "전입신고·확정일자", what: "잔금일에 등기부를 한 번 더 떼 보고, 전입신고와 확정일자를 받습니다. 대항력은 인도와 전입을 마친 다음 날부터 생깁니다.", basis: "주택임대차보호법 제3조·제3조의2" },
    { key: "loan-guarantee", day: addMonths(early, D.loanGuaranteeMonths), title: "버팀목 대출·전세안심보증 신청 마감", what: `잔금일과 전입일 중 빠른 날부터 ${D.loanGuaranteeMonths}개월 안에 신청합니다.`, basis: "HUG 전세안심보증 상품개요, 주택도시기금 버팀목 안내" },
    { key: "return-guarantee", day: late + half, title: "전세반환보증 가입 마감(추산)", what: "잔금일과 전입일 중 늦은 날부터 계약기간의 절반이 지나기 전에 가입합니다.", basis: "HUG 전세반환보증 상품개요" },
    { key: "renewal-open", day: addMonths(x.end, -D.renewalNoticeFromMonths), title: "갱신·이사 의사 알리기 시작", what: `만료 ${D.renewalNoticeFromMonths}개월 전부터 갱신을 요구하거나 갱신하지 않겠다고 알릴 수 있습니다.`, basis: "주택임대차보호법 제6조·제6조의3" },
    { key: "renewal-deadline", day: addMonths(x.end, -D.renewalNoticeToMonths), title: "갱신거절 통지 마감 — 증빙 보관", what: `만료 ${D.renewalNoticeToMonths}개월 전까지 알리지 않으면 같은 조건으로 갱신된 것으로 봅니다. HUG 보증금 청구에는 이 기한 안에 알렸다는 증빙(내용증명 도달, 답장이 있는 문자 등)이 필요합니다.`, basis: "주택임대차보호법 제6조, HUG 보증사고 이행청구 안내" },
    { key: "end", day: x.end, title: "계약 만료", what: "보증금을 돌려받는 날입니다. 받기 전에 전출하면 대항력을 잃을 수 있으니, 꼭 이사해야 하면 임차권등기를 먼저 마칩니다.", basis: "주택임대차보호법 제3조·제3조의3" },
    { key: "accident", day: addMonths(x.end, D.accidentAfterMonths), title: "보증사고 — 이행청구 준비", what: `만료 후 ${D.accidentAfterMonths}개월까지 정당한 사유 없이 못 받으면 보증사고입니다. 임차권등기명령을 마친 뒤 HUG에 이행청구합니다(결정문으로 청구할 수 있지만 지급 전에 등기가 끝나야 합니다).`, basis: "HUG 보증사고 이행청구 안내, 주택임대차보호법 제3조의3" },
  ];
  return items.filter((i) => i.day >= x.contract).sort((a, b) => a.day - b.day);
}
