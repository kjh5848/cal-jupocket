/**
 * 도구 레지스트리 — 홈 도감·분류·검색·담긴 수가 전부 여기서 나온다(설계 4-1).
 *
 * 공개 도구(live)는 손으로 적지 않는다: 클러스터의 계산기 + 계산기 카드가 있는 글(CALC_GUIDES)을
 * 링크허브 번호와 합쳐 만든다. 손으로 적는 것은 한 줄 설명(BLURB)·검색 동의어(SYN)·곧 담길 도구(NEXT)뿐.
 * 새 도구를 공개하면 CALC_GUIDES 나 클러스터에 넣고 NEXT 에서 뺀다.
 */
import { clusters } from "./clusters";
import { hubEntries } from "./linkhub";
import { typeOfCluster, type ToolType } from "./tool-types";
import { BACKLOG_TOTAL } from "./tool-backlog-count";

export interface Tool {
  /** 도감 번호 = 링크허브 번호. 곧 담길 도구는 null */
  no: number | null;
  href: string;
  name: string;
  blurb: string;
  type: ToolType;
  /** 검색 동의어 — 이름 자체를 포함한다 */
  keywords: string[];
  status: "live" | "next";
  /** 카드 아이콘 — data/icons.ts 키 */
  icon: string;
  /** 법 원문으로 검증한 도구 */
  verified?: "law";
}

/** 클러스터에서는 글(guide)로 분류돼 있지만 계산기 카드가 있는 페이지 */
const CALC_GUIDES = [
  "/guide/capital-gains-calculator/", "/guide/child-incentive-amount/", "/guide/divorce-acquisition-tax/",
  "/guide/earned-incentive-amount/", "/guide/family-loan-interest/", "/guide/four-insurance-calculator/",
  "/guide/gift-tax-calculator/", "/guide/industrial-accident-disability/", "/guide/industrial-accident-leave-pay/",
  "/guide/irp-tax-credit-calculator/", "/guide/jongbu-calculator/", "/guide/lotto-tax-calculator/",
  "/guide/medical-credit-limit/", "/guide/severance-tax-calculator/", "/guide/year-end-calculator/",
];

const BLURB: Record<string, string> = {
  "/guide/capital-gains-calculator/": "양도차익 → 장기보유특별공제 → 양도세",
  "/guide/child-incentive-amount/": "소득·재산으로 자녀장려금 금액",
  "/guide/divorce-acquisition-tax/": "재산분할로 받은 집의 취득세",
  "/guide/earned-incentive-amount/": "가구 유형·소득으로 근로장려금 금액",
  "/guide/family-loan-interest/": "빌린 금액·이자율로 증여이익과 증여세 시작 연도",
  "/guide/four-insurance-calculator/": "월급에서 떼는 국민연금·건강·장기요양·고용보험",
  "/guide/gift-tax-calculator/": "받은 금액 − 관계별 공제 → 증여세",
  "/guide/industrial-accident-disability/": "평균임금 × 등급별 일수 → 장해급여",
  "/guide/industrial-accident-leave-pay/": "평균임금 70% → 하루 휴업급여",
  "/guide/irp-tax-credit-calculator/": "넣은 돈 × 12%·15% → 돌려받는 세금",
  "/guide/jongbu-calculator/": "공시가격으로 종합부동산세",
  "/guide/lotto-tax-calculator/": "당첨금 → 세금과 실수령액",
  "/guide/medical-credit-limit/": "의료비 → 공제 한도와 돌려받는 세금",
  "/guide/severance-tax-calculator/": "퇴직금·근속연수 → 퇴직소득세",
  "/guide/year-end-calculator/": "총급여·기납부세액 → 환급금 어림",
};

/** 검색 동의어 — 사람들이 실제로 치는 말(자동완성 기록 keywords/*.csv) */
const SYN: Record<string, string[]> = {
  "/freelancer-33/": ["3.3%", "3.3 계산기", "프리랜서 세금", "사업소득 원천징수"],
  "/withholding/": ["8.8%", "기타소득", "원천징수", "3.3%"],
  "/income-tax-refund/": ["종합소득세", "종소세 환급", "5월 세금"],
  "/penalty/": ["가산세", "기한 후 신고", "무신고 가산세"],
  "/guide/crypto-tax-calculator/": ["코인 세금", "가상자산 과세", "비트코인 세금"],
  "/vat/": ["부가세", "부가가치세", "공급가액", "간이과세"],
  "/national-pension-premium/": ["국민연금", "지역가입자 보험료", "연금 보험료"],
  "/guide/basic-pension-calculator/": ["기초연금", "소득인정액", "기초연금 수급"],
  "/guide/old-age-pension-age/": ["노령연금 나이", "연금 수령 나이", "조기노령연금"],
  "/guide/weekly-holiday-pay-calculator/": ["주휴수당", "주휴 시급", "알바 주휴"],
  "/guide/annual-leave-calculator/": ["연차", "연차수당", "연차 개수"],
  "/guide/unemployment-benefit-calculator/": ["실업급여", "구직급여", "실업급여 금액"],
  "/guide/parental-leave-pay-calculator/": ["육아휴직 급여", "육아휴직 월급", "출산휴가 급여"],
  "/guide/minimum-wage-calculator/": ["최저임금", "최저시급", "2026 최저임금"],
  "/guide/take-home-calculator/": ["실수령액", "월급 얼마", "연봉 실수령", "세후 월급", "월급 실수령액"],
  "/property-tax/": ["재산세", "주택 재산세", "재산세 고지서"],
  "/vehicle-tax/": ["자동차세", "자동차세 연납", "배기량 세금"],
  "/acquisition-tax/": ["취득세", "주택 취득세", "아파트 취득세"],
  "/guide/electric-car-tax-calculator/": ["전기차 세금", "전기차 취득세", "전기차 자동차세"],
  "/inheritance/": ["상속세", "상속세 면제한도", "상속 세금"],
  "/guide/capital-gains-calculator/": ["양도세", "양도소득세", "집 팔 때 세금"],
  "/guide/child-incentive-amount/": ["자녀장려금", "장려금"],
  "/guide/divorce-acquisition-tax/": ["재산분할 취득세", "이혼 취득세"],
  "/guide/earned-incentive-amount/": ["근로장려금", "장려금"],
  "/guide/family-loan-interest/": ["차용증", "가족간 차용증", "무이자 대출 증여"],
  "/guide/four-insurance-calculator/": ["4대보험", "사대보험", "4대보험료"],
  "/guide/gift-tax-calculator/": ["증여세", "증여세 면제한도", "자녀 증여"],
  "/guide/industrial-accident-disability/": ["장해등급", "산재 보상금", "장해급여"],
  "/guide/industrial-accident-leave-pay/": ["산재", "휴업급여", "산재 월급"],
  "/guide/irp-tax-credit-calculator/": ["IRP", "연금저축", "세액공제"],
  "/guide/jongbu-calculator/": ["종부세", "종합부동산세"],
  "/guide/lotto-tax-calculator/": ["로또", "로또 세금", "복권 당첨금"],
  "/guide/medical-credit-limit/": ["의료비 세액공제", "의료비 공제"],
  "/guide/severance-tax-calculator/": ["퇴직소득세", "퇴직금 세금"],
  "/guide/year-end-calculator/": ["연말정산", "13월의 월급", "연말정산 환급"],
};

/** 곧 담길 도구(점선 칸) — 루틴 우선순위 순(docs/tool-backlog.md). 공개하면 여기서 뺀다 */
const NEXT: { href: string; name: string; blurb: string; type: ToolType; icon: string; keywords: string[] }[] = [
  { href: "/guide/severance-pay-calculator/", name: "퇴직금 계산기", blurb: "입사일·퇴사일·3개월 임금 → 퇴직금", type: "labor", icon: "briefcase", keywords: ["퇴직금", "퇴직금 계산"] },
  { href: "/guide/loan-calculator/", name: "대출 이자 계산기", blurb: "원리금균등·원금균등·만기일시 상환표", type: "money", icon: "chart", keywords: ["대출", "대출이자", "상환표"] },
  { href: "/guide/deposit-interest-calculator/", name: "예금·적금 이자 계산기", blurb: "세후 이자(15.4%)까지", type: "money", icon: "coins", keywords: ["예금이자", "적금이자", "이자 계산"] },
  { href: "/guide/hourly-wage-calculator/", name: "시급 계산기", blurb: "월급 ↔ 시급, 주휴 포함", type: "labor", icon: "wallet", keywords: ["시급", "시급 계산", "월급 시급"] },
  { href: "/tools/date-diff/", name: "날짜 계산기", blurb: "두 날짜 사이 · 며칠 뒤 · D-day", type: "date", icon: "calendar", keywords: ["날짜 계산", "디데이", "D-day", "며칠"] },
  { href: "/tools/percent/", name: "퍼센트 계산기", blurb: "몇 %인지 · % 올리고 내리기", type: "unit", icon: "percent", keywords: ["퍼센트", "%", "비율"] },
];

const hubNo = new Map(hubEntries.map((e) => [e.href, e.no]));
const hubLabel = new Map(hubEntries.map((e) => [e.href, e.label]));
const clusterOf = (href: string) => clusters.find((c) => c.links.some((l) => l.href === href))!;

function liveTool(href: string): Tool {
  const c = clusterOf(href);
  const link = c.links.find((l) => l.href === href)!;
  const name = link.kind === "calc" ? link.title : hubLabel.get(href)!;
  const no = hubNo.get(href);
  if (no === undefined) throw new Error(`링크허브 번호 없음: ${href}`);
  return {
    no,
    href,
    name,
    blurb: link.blurb ?? BLURB[href] ?? "",
    type: typeOfCluster(c.id),
    keywords: [name, ...(SYN[href] ?? [])],
    status: "live",
    icon: link.icon,
    verified: "law",
  };
}

const calcHrefs = [...clusters.flatMap((c) => c.links.filter((l) => l.kind === "calc").map((l) => l.href)), ...CALC_GUIDES];

export const liveTools: Tool[] = calcHrefs.map(liveTool).sort((a, b) => a.no! - b.no!);
export const nextTools: Tool[] = NEXT.map((n) => ({ ...n, no: null, status: "next" as const, keywords: [n.name, ...n.keywords] }));
export const tools: Tool[] = [...liveTools, ...nextTools];

export const toolCount = () => ({ live: liveTools.length, total: BACKLOG_TOTAL });
