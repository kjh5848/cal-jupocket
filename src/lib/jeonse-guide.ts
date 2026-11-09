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
    "녹음한 뒤에는 핵심 내용을 문자로 다시 보내 확인받으세요(\"오늘 통화에서 ○월 ○일에 보증금을 돌려주신다고 하셨죠?\").",
    "계약금·잔금은 계좌이체로 보내세요. 보증 신청 때 보증금을 냈다는 증빙이 필요해요.",
  ],
  sources: [SRC.lease, SRC.accident, SRC.secrecy, SRC.precedent, SRC.hugReturn],
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

export const GUIDES: Guide[] = [
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
      `만료 ${D.renewalNoticeFromMonths}개월 전부터 ${D.renewalNoticeToMonths}개월 전 사이에 집주인에게 "갱신하지 않겠다"고 알리세요.`,
      `${D.renewalNoticeToMonths}개월 전까지 아무 말도 안 하면 같은 조건으로 자동 연장(묵시적 갱신)돼요. 그때는 언제든 해지를 알릴 수 있고, 집주인이 받은 날부터 ${D.terminationEffectMonths}개월이 지나면 끝나요.`,
      "HUG에 보증금을 청구할 일이 생기면 기한 안에 알렸다는 증빙이 필요해요. 그래서 알릴 때 기록을 남기는 게 가장 중요해요.",
    ],
    record: [
      "문자·카톡으로 보내고 집주인 답장을 받아 두세요.",
      "답장이 없으면 바로 내용증명을 보내세요. 도착 기록이 남아요.",
    ],
    sources: [SRC.lease, SRC.accident],
  },
  {
    id: "not-returned",
    ask: "집주인이 보증금을 안 돌려줘요",
    match: /안\s*돌려|못\s*받|돌려주지|보증금.*(안|못)|보증사고|연락이?\s*안/,
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
