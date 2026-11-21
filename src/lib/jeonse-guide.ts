/**
 * 전세 일정 도우미(채팅) — AI 없이 동작하는 부분(2026-11-08).
 *
 *  1. 내 일정: hugSchedule() 날짜에 요일·D-day 를 붙인다
 *  2. 상황 안내: "집주인이 보증금을 안 줘요" 같은 상황별 할 일과 기록 남기는 법
 *  3. 집주인과 연락할 때: 문자(답장)·내용증명·녹음 — HUG 이행청구 증빙 기준과 통신비밀보호법·판례로 확인한 것만
 *  4. 글로 물으면 용어·상황을 먼저 이 자료에서 찾는다(못 찾을 때만 AI)
 *
 * 숫자는 전부 rates(hug-jeonse-2026.json), 날짜는 hugSchedule(). 손으로 적은 숫자 없음.
 */
import r from "../rates/hug-jeonse-2026.json";
import { hugSchedule, type ScheduleInput, type ScheduleItem } from "./hug-jeonse";
import { WEEKDAYS, weekday, fromDay, dday } from "./date-calc";
import { TERMS, type Term } from "../data/jeonse-terms";

const D = r.deadlines;
const G = r.guarantee;
const S = r.sources;
const C = r.claim;
const L = r.legal;
const eokText = (won: number) => `${won / 100_000_000}억원`;

/* ── 1. 내 일정 ─────────────────────────────────────────── */

export interface PlanItem extends ScheduleItem {
  /** "12월 20일(일)" */
  when: string;
  /** "D-42" · "D-day" · "D+3" */
  dday: string;
  past: boolean;
  /** 이 할 일에 나오는 용어(채팅에서 눌러 뜻을 본다) */
  terms: string[];
}

/** "12월 20일(일)" — today 와 해가 다르면 "2027년 12월 26일(일)" */
export function dateText(day: number, today?: number): string {
  const [y, m, d] = fromDay(day).split("-").map(Number);
  const yr = today !== undefined && Number(fromDay(today).slice(0, 4)) !== y ? `${y}년 ` : "";
  return `${yr}${m}월 ${d}일(${WEEKDAYS[weekday(day)]})`;
}

const termNames = TERMS.map((t) => ({ t, keys: keysOf(t) }));
function keysOf(t: Term): string[] {
  // "전세보증금반환보증(전세반환보증)" → 두 이름, "근저당 · 채권최고액" → 두 이름
  return t.t.split(/[()·×]/).map((x) => x.trim()).filter((x) => x.length >= 2 && !/^\d/.test(x) && !/%/.test(x));
}

/** 글 속에 나오는 용어 이름(용어 목록의 t) */
export function termsIn(text: string): string[] {
  return termNames.filter((x) => x.keys.some((k) => text.includes(k))).map((x) => x.t.t);
}

export function plan(x: ScheduleInput, today: number): PlanItem[] {
  return hugSchedule(x).map((i) => ({
    ...i,
    when: dateText(i.day, today),
    dday: dday(i.day, today),
    past: i.day < today,
    terms: termsIn(`${i.title} ${i.what}`),
  }));
}

/**
 * 일정 항목 설명(what)의 말끝만 해요체로 — 대화(전세 도우미)에서만 쓴다.
 * what 은 체크리스트 글(합니다체 본문)도 그대로 쓰므로 hug-jeonse.ts 의 원문은 두고, 숫자·낱말은 건드리지 않고 말끝만 바꾼다.
 */
export function haeyo(s: string): string {
  return s
    .replace(/생깁니다/g, "생겨요")
    .replace(/마칩니다/g, "마쳐요")
    .replace(/봅니다/g, "봐요")
    .replace(/받습니다/g, "받아요")
    .replace(/있습니다/g, "있어요")
    .replace(/합니다/g, "해요")
    .replace(/([가-힣])입니다/g, (_, c: string) => ((c.charCodeAt(0) - 0xac00) % 28 ? `${c}이에요` : `${c}예요`));
}

/** 오늘 이후 가장 가까운 할 일 */
export function nextItem(items: PlanItem[]): PlanItem | undefined {
  return items.find((i) => !i.past);
}

/* ── 2·3. 상황 안내와 기록 남기기 ──────────────────────────── */

export interface Guide {
  id: string;
  /** 사용자가 고르는 말 */
  ask: string;
  /** 검색어(글로 물을 때) */
  match: RegExp;
  steps: string[];
  /** 기록 남기는 법 */
  record?: string[];
  sources: { name: string; url: string }[];
}

const SRC = {
  hugReturn: { name: "HUG 전세반환보증 안내", url: S.returnGuarantee },
  registry: { name: "HUG 안심전세포털 등기부 확인", url: S.registryCheck },
  accident: { name: "HUG 보증사고 이행청구 안내", url: S.accidentClaim },
  accidentSteps: { name: "HUG 보증 이행절차", url: S.accidentSteps },
  lease: { name: "주택임대차보호법", url: S.leaseProtectionAct },
  report: { name: "부동산 거래신고 등에 관한 법률", url: S.leaseReportAct },
  loan: { name: "HUG 전세안심보증 안내", url: S.loanGuarantee },
  secrecy: { name: "통신비밀보호법 제3조", url: S.commSecrecyAct },
  precedent: { name: "대법원 2006도4981 판결", url: S.recordingPrecedent },
  termination: { name: "HUG 계약종료(해지) 안내", url: S.claimTermination },
  moveOut: { name: "HUG 주택명도(퇴거) 안내", url: S.claimMoveOut },
  exclusions: { name: "HUG 보증이행 시 보상하지 않는 채무", url: S.claimExclusions },
  publicNotice: { name: "민법 제113조(의사표시의 공시송달)", url: S.civilPublicNotice },
  publicNoticeEffect: { name: "민사소송법 제196조", url: S.publicNoticeEffect },
  residentCopy: { name: "주민등록법 시행령 제47조", url: S.residentCopy },
  leaseRegistry: { name: "주택임대차보호법 제3조의3(임차권등기명령)", url: S.leaseRegistryOrder },
  interest: { name: "소송촉진법 제3조·법정이율 규정", url: S.lawsuitInterestRate },
  paymentOrder: { name: "민사소송법 제470조(지급명령 이의신청)", url: S.paymentOrderObjection },
  dividend: { name: "민사집행법 제84조·제88조·제148조", url: S.auctionDividendWho },
  smallDeposit: { name: "주택임대차보호법 제8조(소액임차인)", url: S.smallDeposit },
  fraudAct: { name: "전세사기피해자 지원 및 주거안정에 관한 특별법", url: S.fraudVictimAct },
  legalAid: { name: "대한법률구조공단", url: S.legalAid },
  loanGuarantee: { name: "HUG 전세안심보증 상품개요", url: S.loanGuarantee },
  products: { name: "HUG 개인보증 상품 목록", url: S.guaranteeLookup },
};

/** 집주인과 연락할 때 — 모든 상황에 공통 */
export const CONTACT: Guide = {
  id: "contact",
  ask: "집주인과 연락할 때 뭘 남겨야 해요?",
  match: /녹음|문자로|카톡|내용증명|증거|기록|통화|연락/,
  steps: [
    "중요한 말(날짜·금액·갱신 여부)은 문자나 카톡으로 보내고, 집주인 답장을 꼭 받아 두세요. HUG는 문자·카톡을 증빙으로 볼 때 집주인 답장이 있어야 한다고 안내해요.",
    "답장이 없거나 연락이 안 되면 내용증명 우편으로 보내세요. 집주인에게 도착했다는 기록(도달 증빙)이 남아요.",
    "통화나 만나서 한 이야기는 녹음해 두어도 돼요. 법은 '다른 사람들끼리의 대화'를 몰래 녹음하는 것을 금지하고, 내가 참여한 대화를 내가 녹음하는 것은 이 금지에 해당하지 않는다고 대법원이 판단했어요. 내가 빠진 다른 사람들끼리의 대화를 녹음하면 안 돼요.",
    "다만 갱신거절을 통화로 알렸다면, HUG는 공인속기사가 작성한 녹취록(통화 날짜·집주인 전화번호가 보이는 것)만 증빙으로 받아요. 문자·카톡도 집주인 전화번호와 날짜가 보이고 답장이 있어야 해요.",
    "녹음한 뒤에는 핵심 내용을 문자로 다시 보내 확인받으세요(\"오늘 통화에서 ○월 ○일에 보증금을 돌려주신다고 하셨죠?\").",
    "계약금·잔금은 계좌이체로 보내세요. 보증 신청 때 보증금을 냈다는 증빙이 필요해요.",
  ],
  sources: [SRC.lease, SRC.termination, SRC.accident, SRC.secrecy, SRC.precedent, SRC.hugReturn],
};

const H = r.houseHunting;
const HOUSE = {
  choose: { name: "HUG 전세사기예방센터 — 어떤 집에 살까?", url: S.houseChoose },
  search: { name: "HUG 전세사기예방센터 — 내 집은 어디에?", url: S.houseSearch },
  check: { name: "HUG 전세사기예방센터 — 이 집, 괜찮을까?", url: S.houseCheck },
  price: { name: "HUG 전세사기예방센터 — 이 집 얼마예요?", url: S.housePrice },
};

/** 집 보는 중(대부분의 사용자) — HUG 전세사기예방센터 '계약 체결 전 유의사항' 4쪽에서 옮김 */
export const HOUSE_GUIDES: Guide[] = [
  {
    id: "house-find",
    ask: "집을 어떻게 찾아야 할지 모르겠어요",
    match: /어떻게\s*찾|집\s*찾|어디서\s*찾|부동산\s*앱|어플|직방|다방|네이버\s*부동산/,
    steps: [
      "보러 다니기 전에 기준을 글로 써 두세요: 집 크기·형태, 통근·통학 시간(시간대별로), 밤길·소음, 얼마나 오래된 집까지 괜찮은지. 그리고 포기할 수 있는 것과 절대 못 버리는 것의 순서를 정해요. 안 써 두면 한두 가지 장점에 홀려 중요한 걸 놓치기 쉬워요.",
      "예산은 보증금만이 아니라 한 달 주거비로 보세요. 대출 이자·관리비·공과금·교통비까지 더해서 소득에 비해 너무 크지 않게 상한을 정해요.",
      "전세대출을 받을 거면 대출 상품을 먼저 알아보고, 대출이 되는 집을 찾아요.",
      "부동산 앱은 시세를 보는 용도로만 쓰세요. 사진과 다르거나 이미 없는 매물이 많아요. 실제 집은 그 매물을 맡은 중개사무소에 가서 확인해요.",
      "중개사무소에는 \"전세보증금반환보증에 가입되는 집을 보여 주세요\"라고 꼭 말하세요.",
      "공공임대(전세임대·행복주택 등)는 소득·자산 조건이 있지만 대체로 시세보다 싸요. 마이홈(myhome.go.kr)과 LH 청약(apply.lh.or.kr)에서 공고를 봐요.",
    ],
    sources: [HOUSE.choose, HOUSE.search],
  },
  {
    id: "house-visit",
    ask: "집 보러 갈 때 뭘 봐야 해요?",
    match: /보러\s*갈|집\s*볼\s*때|뭘\s*봐|체크리스트|확인할\s*것/,
    steps: [
      "가기 전: 사진을 찍고 메모할 준비를 하세요. 여러 집을 본 뒤 비교할 때 헷갈리지 않아요. 가능하면 한 명과 같이 가서, 한 사람은 중개사 설명을 적고 다른 사람은 집을 점검해요.",
      "동·호수를 꼭 적어 두세요. 등기부 같은 서류를 떼려면 정확한 주소가 필요하고, 계약서에 본 집과 다른 집이 적히는 일도 막아요.",
      "햇빛: 맑은 날 낮에 잘 드는지 봐요.",
      "물: 욕실·세탁실 수압과 배수, 하수구 역류가 없는지 직접 틀어 봐요.",
      "곰팡이·물 샘: 벽·천장·장판에 누수·결로·곰팡이 흔적이 없는지 봐요.",
      "소리: 벽을 두드려 방음을 확인하고, 냉난방(보일러·에어컨·이중창)과 환기·배수구 냄새를 봐요.",
      "안전: 도어락·CCTV·방범창·가스 배관 방범 덮개, 콘센트·가스 호스 상태, 비상구·소화전 같은 소방시설을 봐요.",
      `면적이 최저주거기준(${H.minHousingAreaM2}㎡) 이하가 아닌지, 아파트가 아니면 건축물대장(정부24)에서 주택이 아닌 용도(근린생활시설 등)로 쓰는 위반건축물이 아닌지 확인해요.`,
    ],
    sources: [HOUSE.search, HOUSE.check],
  },
  {
    id: "house-price",
    ask: "이 집 가격이 괜찮은지 어떻게 알아요?",
    match: /시세|깡통|매매\s*가|비싼|싼\s*건지|적당한/,
    steps: [
      `보증금이 그 집 매매 시세의 ${H.avoidDepositOverPricePct}%를 넘으면 피하는 게 좋다고 HUG는 안내해요. 집값이 내려가면 보증금을 돌려받기 어려울 수 있어요(깡통전세).`,
      "매매 시세는 국토교통부 실거래가 공개시스템, KB시세, 부동산테크, 공시가격(부동산공시가격알리미), 등기부에 적힌 매매가로 확인해요. 모든 집 시세가 한곳에 모여 있지는 않아서 여러 곳을 봐야 해요.",
      "같은 건물의 다른 집, 같은 동네 비슷한 집의 전세·월세도 비교해서 비싸게 계약하지 않게 해요.",
      `HUG 보증 기준(보증금 + 근저당이 HUG가 보는 집값의 ${G.ltvLimitPct}% 안)에 드는지는 JU포켓 HUG 보증 계산기에서 바로 볼 수 있어요.`,
    ],
    sources: [HOUSE.price, SRC.hugReturn],
  },
];


/** 집주인 연락두절 — HUG 계약종료(해지) 안내 4번(의사표시 공시송달 준비 절차) 그대로 */
export const LANDLORD_GONE: Guide = {
  id: "landlord-gone",
  ask: "집주인이 연락이 안 돼요(내용증명이 돌아왔어요)",
  match: /연락\s*(두절|이\s*안|안\s*(돼|되|받)|끊)|잠적|잠수|반송|돌아왔|공시송달|주소를?\s*(몰|모르)/,
  steps: [
    "먼저 계약서와 등기부에 적힌 집주인 주소로 갱신거절 내용증명을 보내세요.",
    "반송되면 신분증·임대차계약서·내용증명 반송 내역을 들고 주민센터에 가서 집주인의 주민등록표 초본을 신청해 지금 주소를 확인해요. 반송된 내용증명이 있어야 신청할 수 있고, 발급이 거부될 수도 있어요.",
    "초본에 나온 주소로 한 번 더 내용증명을 보내세요. 그것도 반송되면 법원에 '의사표시 공시송달'을 신청할 수 있어요. 처음부터 공시송달을 신청할 수는 없고, 주소를 모른다는 것을 이렇게 보여 줘야 해요.",
    "신청할 때는 임대차계약서 사본, 갱신거절 통지문, 반송 내역, 집주인 초본을 내요. HUG는 집주인 초본 주소지 관할 법원을 권해요.",
    `공시송달은 법원 게시 후 ${L.publicNoticeEffectWeeks}주가 지나야 효력이 생기고, HUG 안내로는 신청부터 효력까지 보통 ${C.publicNoticeTypicalMonths.min}~${C.publicNoticeTypicalMonths.max}개월 걸려요. 그런데 HUG 청구에는 만료 ${D.renewalNoticeToMonths}개월 전까지 '닿아야' 해요. 그래서 집주인 연락이 불안하면 만료 6개월 전 무렵부터 바로 시작하는 게 안전해요(이 시점은 JU포켓 권장이에요).`,
    "HUG에 청구할 때는 법원 사건 내역 조회처럼 공시송달이 언제 효력을 냈는지 보여 주는 서류를 같이 내요.",
  ],
  record: [
    "보낸 내용증명 원본·등기번호·반송 봉투를 버리지 말고 모아 두세요.",
    "집주인 전화·문자를 시도한 기록(날짜·번호)도 캡처해 두세요.",
  ],
  sources: [SRC.termination, SRC.publicNotice, SRC.publicNoticeEffect, SRC.residentCopy, SRC.accident],
};

/** 보증사고 뒤 HUG에 청구하는 순서 — HUG 보증사고·이행절차·명도 안내 그대로 */
export const AFTER_ACCIDENT: Guide = {
  id: "after-accident",
  ask: "HUG에 보증금 청구는 어떻게 해요?",
  // 보증이 '있는' 사람의 사고(경매 포함 — 보증사고 ②)는 여기. '보증 없음' 안내보다 앞에 둔다
  match: /이행\s*청구|대위\s*변제|청구\s*(서류|방법|절차)|HUG(에|한테)?\s*(청구|신청)|명도|퇴거|보증.{0,12}(들었|가입했|있는데).{0,24}(경매|공매|못\s*받|안\s*돌려)/,
  steps: [
    `보증사고는 두 가지예요: ① 계약이 끝나거나 해지된 뒤 ${D.accidentAfterMonths}개월까지 정당한 이유 없이 못 받음 ② 계약 중 경매·공매로 배당을 받고도 다 못 받음.`,
    "①이면 먼저 집이 있는 곳을 관할하는 지방법원·지원·시군법원에 임차권등기명령을 신청하세요. 등기가 된 뒤에는 이사해도 대항력과 우선변제권이 유지돼요. 결정문만으로도 청구는 할 수 있지만, 보증금을 받기 전에 등기가 끝나 있어야 해요.",
    `HUG(대표번호 ${C.callCenter})에 사고를 알리고 이행청구서를 내요. 주요 서류: 신분증 사본, 확정일자 받은 계약서 원본, 임차권등기 접수일 이후 뗀 주민등록 등·초본(주소 변동 포함), 이행청구일 기준 ${C.sealCertValidMonths}개월 안에 뗀 인감증명서와 인감도장, 임차권등기명령 결정문, 임차권등기가 올라간 등기부, 갱신거절을 기한 안에 알린 증빙, 통장 사본.`,
    "HUG 안심대출이 아닌 다른 전세대출을 받았다면 그 은행의 금융거래확인서도 내요.",
    `HUG가 심사해서 결과를 알려 주고, 이행청구일부터 ${C.subrogationWithinMonths}개월 안에 대신 갚아요(대위변제). 단 집을 비워 줘야(명도) 돈을 받아요.`,
    `이사 날이 정해지면 이사 ${C.moveOutNoticeBusinessDays}영업일 전까지 HUG에 알리세요. 이사 날에는 ① 집주인에게 비워 준 날짜·비밀번호(열쇠 둔 곳)를 알린 문자나 내용증명 ② 짐을 다 뺀 뒤 현관과 집 안 사진 ③ 관리비·전기·수도·가스 정산 내역을 안심전세앱으로 내요.`,
    "HUG 담당자가 확인하기 전에 마음대로 전출하면 거절될 수 있어요. 다른 곳으로 전입신고를 하면 우선변제권을 잃는 것도 HUG가 보상하지 않는 경우예요.",
    "HUG는 보증금 원금만 대신 갚아요. 늦게 돌려줘서 생긴 이자·지연손해금은 HUG가 주지 않아요 — 받으려면 집주인을 상대로 따로 청구해야 해요.",
  ],
  record: ["HUG에 낸 서류는 사본을 남기고, 담당자 이름·통화 날짜를 적어 두세요."],
  sources: [SRC.accident, SRC.accidentSteps, SRC.moveOut, SRC.exclusions, SRC.leaseRegistry],
};

/** 내 보증이 어떤 보증인지 — 반환보증과 대출보증은 지키는 사람이 다르다 */
export const PRODUCT_KIND: Guide = {
  id: "product-kind",
  ask: "내가 든 보증이 보증금을 지켜 주는 건가요?",
  match: /어떤\s*보증|무슨\s*보증|대출\s*보증|구상|보증서|보증\s*(종류|차이)|임대\s*보증금\s*보증|임대인\s*보증/,
  steps: [
    "전세반환보증: 세입자가 가입하고, 계약이 끝났을 때 집주인이 돌려줘야 할 보증금을 HUG가 책임져요. 내 보증금을 지켜 주는 보증이에요.",
    "전세안심보증: 반환보증과 은행 대출 보증을 한 번에 드는 상품이에요. 대출 부분은 보증을 받는 쪽(보증채권자)이 은행이고 세입자는 갚아야 할 사람(주채무자)이에요.",
    "그래서 '대출 보증'만 있는 경우는 은행을 지키는 보증이에요. 보증기관이 은행에 대신 갚으면 그 돈은 세입자가 보증기관에 갚아야 할 빚으로 남아요. 내 보증금을 돌려받는 보증과는 달라요.",
    "확인하는 법: 보증서에서 '보증채권자'가 나인지 은행인지, '보증금액'이 전세보증금인지 대출금인지 보세요.",
    "집주인(임대사업자)이 가입한 임대보증금보증은 내가 든 보증이 아니에요. HUG 누리집의 '보증가입정보 조회 > 가입주택조회'에서 우리 집이 들어 있는지 볼 수 있고, 보증 내용이 내 계약서와 같은지 확인하세요.",
  ],
  sources: [SRC.hugReturn, SRC.loanGuarantee, SRC.products],
};

/** 보증이 없거나 거절됐을 때 — 법 절차의 큰 줄기와 무료 상담처만(개별 사건 판단 아님) */
export const NO_GUARANTEE: Guide = {
  id: "no-guarantee",
  ask: "보증이 없거나 거절됐어요. 어떻게 돌려받아요?",
  // 이미 일이 난 사람만 — "보증 안 되는 집 계약해도?", "경매 이력 있는 집?", "전세사기 안 당하려면?" 같은 예방 질문은 계약 전 안내로 간다
  match: /보증(보험)?(이|을)?\s*(없는데|없어서|없었|안\s*들었|거절\s*(됐|당했|받았))|(경매|공매)(로|에|가|이)?\s*(넘어|진행|개시|들어갔)|배당\s*요구|소송|지급\s*명령|전세\s*사기\s*(당했|피해)|피해자|지연\s*(이자|손해)/,
  steps: [
    "계약이 끝났는데 못 받았다면 먼저 임차권등기명령을 신청하세요. 그래야 이사해도 대항력과 우선변제권이 남아요. 신청·등기에 든 비용은 집주인에게 청구할 수 있어요.",
    `집주인에게 돈을 내라고 법원에 요구하는 방법은 지급명령과 소송이 있어요. 지급명령은 집주인이 송달받고 ${L.paymentOrderObjectionWeeks}주 안에 이의를 내면 보통 소송으로 넘어가요. 집주인 주소를 몰라 공시송달이 필요하면 지급명령은 쓸 수 없어요.`,
    `금전 지급을 구하는 소송에서는 소장이 송달된 다음 날부터 연 ${L.lawsuitInterestPct}%의 지연손해금을 판결로 받을 수 있어요(다툴 만한 범위는 빠질 수 있어요). HUG 보증이 있어도 이 이자는 HUG가 주지 않아요.`,
    "집이 경매로 넘어가면 법원이 정한 배당요구 종기까지 배당요구를 하세요. 종기까지 배당요구를 한 채권자만 배당을 받는 게 원칙이에요.",
    "보증금이 적은 세입자는 경매에서 일정 금액을 먼저 받을 수 있어요(소액임차인 최우선변제). 금액은 지역과 근저당 설정일에 따라 달라서 법 원문이나 상담으로 확인하세요.",
    `전세사기 피해라면 국토교통부에 '전세사기피해자등' 결정을 신청할 수 있어요. 보증금 ${eokText(L.fraudActDepositMax)} 이하(위원회가 올릴 수 있음) 등의 요건이 있고, ${L.fraudActFirstContractBy.slice(0, 4)}년 ${Number(L.fraudActFirstContractBy.slice(5, 7))}월 ${Number(L.fraudActFirstContractBy.slice(8, 10))}일까지 처음 계약한 세입자에게 적용돼요. 이 법은 ${L.fraudActValidUntil.slice(0, 4)}년 ${Number(L.fraudActValidUntil.slice(5, 7))}월 ${Number(L.fraudActValidUntil.slice(8, 10))}일까지 효력이 있어요(그 전에 신청한 사람은 이후에도 적용).`,
    `혼자 판단하기 어려우면 대한법률구조공단(전화 ${L.legalAidPhone})에 무료 법률상담을 받아 보세요. 여기 안내는 절차의 큰 줄기일 뿐이고, 내 사건에 맞는 판단은 상담에서 받으세요.`,
  ],
  sources: [SRC.leaseRegistry, SRC.paymentOrder, SRC.interest, SRC.dividend, SRC.smallDeposit, SRC.fraudAct, SRC.legalAid],
};

/** 글로 물을 때 첫 일치가 답 — 문제 상황 안내를 집 보기·계약 전 안내('사기'·'깡통' 등)보다 먼저 찾는다 */
export const GUIDES: Guide[] = [
  LANDLORD_GONE,
  AFTER_ACCIDENT,
  NO_GUARANTEE,
  PRODUCT_KIND,
  ...HOUSE_GUIDES,
  {
    id: "before-contract",
    ask: "계약하기 전에 서류는 뭘 봐요?",
    match: /계약\s*전|계약하기\s*전|등기부|서류|사기/,
    steps: [
      "등기부등본 갑구에서 맨 아래 소유자가 계약할 사람과 같은지, 압류·가압류·경매·신탁·가등기가 없는지 보세요.",
      `을구에서 근저당 금액(채권최고액)을 보세요. 보증금 + 근저당이 집값의 ${G.ltvLimitPct}% 안이어야 HUG 보증이 돼요.`,
      "아파트가 아니면 건축물대장에 위반건축물 표시가 없는지 보세요.",
      "등기부에 안 나오는 세금 체납과 다른 세입자 보증금은 집주인에게 납세증명서와 확정일자 부여 현황을 보여 달라고 하세요. 계약할 때 집주인은 이것을 보여 줘야 해요(주택임대차보호법 제3조의7).",
      "계약일이 정해지면 '내 전세 일정 짜기'로 할 일 날짜를 뽑아 드려요.",
    ],
    sources: [SRC.registry, SRC.hugReturn, SRC.lease],
  },
  {
    id: "renewal",
    ask: "계약을 연장하지 않고 이사 가려고 해요",
    match: /갱신|연장|이사\s*가|재계약|만료|나가려/,
    steps: [
      `만료 ${D.renewalNoticeFromMonths}개월 전부터 ${D.renewalNoticeToMonths}개월 전 사이에 집주인에게 "갱신하지 않겠다"고 알리세요. HUG는 만료 ${D.renewalNoticeToMonths}개월 전(그날이 토요일·공휴일이면 직전 평일)까지 집주인에게 '닿아야' 보증금을 청구할 수 있다고 안내해요.`,
      "알리는 사람은 계약서에 적힌 세입자 본인이에요. 함께 계약했다면 모두가 알려야 하고, 가족이 대신 보내면 위임장을 붙여요.",
      "받는 사람은 지금 등기부상 소유자예요. 알리기 전에 등기부를 떼어 집주인이 바뀌지 않았는지 보세요. 공동 소유면 모두에게 보내요.",
      `${D.renewalNoticeToMonths}개월 전까지 아무 말도 안 하면 같은 조건으로 자동 연장(묵시적 갱신)돼요. 그러면 HUG에 바로 청구할 수 없어요. 이때는 언제든 해지를 알릴 수 있고, 집주인이 받은 날부터 ${D.terminationEffectMonths}개월이 지나면 끝나요.`,
      `이미 기한을 놓쳤다면 집주인과 'HUG 양식의 임대차 계약 종료 확인서'를 써서 보증기간 만료일부터 ${C.endConfirmWithinMonths}개월 안에 HUG에 내면 청구할 수 있어요.`,
    ],
    record: [
      "내용증명: 보내는 사람·받는 사람 이름과 주소, 집 주소·계약기간·보증금, '갱신하지 않겠다'는 말을 적어 같은 문서 3장을 우체국에 내요. 등기번호로 도착했는지 확인해요.",
      "문자·카톡: 세입자 본인이라는 것, 집 주소·계약기간, 갱신 거절을 적고 집주인 답장을 받아요. HUG는 답장한 날을 통지한 날로 봐요.",
      "통화: 공인속기사가 쓴 녹취록이 있어야 증빙이 돼요.",
      "집주인이 법인이면 내용증명으로, 법인 등기부의 본점 주소로 보내세요.",
    ],
    sources: [SRC.termination, SRC.lease, SRC.accident],
  },
  {
    id: "not-returned",
    ask: "집주인이 보증금을 안 돌려줘요",
    match: /안\s*돌려|못\s*받|돌려주지|보증금.*(안|못)|보증사고/,
    steps: [
      `계약이 끝나고 ${D.accidentAfterMonths}개월까지 정당한 사유 없이 못 받으면 HUG에서 말하는 '보증사고'예요.`,
      "보증금을 받기 전에 먼저 이사(전출)하지 마세요. HUG 담당자 확인 전에 전출하면 청구가 거절될 수 있어요.",
      "이사를 꼭 가야 하면 법원에 임차권등기명령(이사 가도 내 권리가 남도록 등록)을 신청하세요. HUG 청구에도 필요해요.",
      "그다음 HUG에 보증 이행(대신 돌려 달라고 청구)을 신청해요. HUG는 청구일부터 1개월 안에 대신 돌려주는데, 집을 비워 줘야(명도) 받을 수 있어요.",
    ],
    record: [
      "집주인과 나눈 문자·카톡을 지우지 말고 캡처해 두세요.",
      "갱신하지 않겠다고 알린 기록(답장 있는 문자나 내용증명)이 청구에 필요해요.",
    ],
    sources: [SRC.accident, SRC.accidentSteps, SRC.lease],
  },
  {
    id: "moved-in",
    ask: "잔금 치르고 이사했어요",
    match: /잔금|입주|이사\s*했|전입/,
    steps: [
      "잔금일에 등기부를 한 번 더 떼어 계약 때와 달라진 게 없는지 보세요.",
      "그날 바로 전입신고를 하고 계약서에 확정일자를 받으세요. 임대차 신고를 할 때 계약서를 함께 내면 확정일자를 받은 것으로 봐요.",
      "집에 들어가 살면서 전입신고를 마친 다음 날부터 대항력(집주인이 바뀌어도 계약을 주장할 수 있는 힘)이 생겨요.",
      `버팀목 대출·전세안심보증은 잔금일과 전입일 중 빠른 날부터 ${D.loanGuaranteeMonths}개월 안에 신청해요.`,
    ],
    sources: [SRC.lease, SRC.loan],
  },
];

/* ── 4. 글로 물을 때 먼저 찾기 ──────────────────────────── */

export type LocalAnswer = { kind: "term"; term: Term } | { kind: "guide"; guide: Guide };

/** 용어 뜻을 묻거나 상황을 말하면 자료에서 먼저 답한다. 없으면 null(→ AI) */
export function localAnswer(q: string): LocalAnswer | null {
  const s = q.trim();
  // "보증금 못 받으면 뭐 해요?" 같은 상황 질문을 용어 질문으로 읽지 않게, '뭐 해·뭐부터'는 뺀다
  const asksMeaning = /뭐|뜻|무슨|의미|란\b|이란|가 뭔|이 뭔/.test(s) && !/뭐\s*(?:해|하|를|부터)/.test(s);
  const terms = termNames.filter((x) => x.keys.some((k) => s.includes(k)));
  if (asksMeaning && terms.length) {
    // 가장 길게 맞은 이름(예: "전입세대확인서" 가 "전입신고" 보다 우선)
    const best = terms.sort((a, b) => Math.max(...b.keys.filter((k) => s.includes(k)).map((k) => k.length)) - Math.max(...a.keys.filter((k) => s.includes(k)).map((k) => k.length)))[0];
    return { kind: "term", term: best.t };
  }
  if (/계산|얼마|보증료|(보증|가입|대출).{0,6}(될까|되나|가능)/.test(s)) return null; // 숫자·가입 판정 질문은 AI·계산으로
  const g = [...GUIDES, CONTACT].find((x) => x.match.test(s));
  return g ? { kind: "guide", guide: g } : null;
}

export function findTerm(name: string): Term | undefined {
  return TERMS.find((t) => t.t === name);
}
