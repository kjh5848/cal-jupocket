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
  "/guide/severance-pay-calculator/": ["퇴직금", "퇴직금 계산", "평균임금", "퇴직금 얼마"],
  "/guide/minus-account-calculator/": ["마이너스통장", "마이너스통장 이자", "마이너스통장 이자계산기", "마통 이자", "통장대출 이자", "한도대출 이자", "일할 이자"],
  "/guide/prepayment-fee-calculator/": ["중도상환수수료", "중도상환수수료 계산", "중도상환수수료 계산기", "대출 중도상환", "조기상환수수료", "주담대 중도상환수수료", "신용대출 중도상환수수료", "전세대출 중도상환수수료", "3년"],
  "/guide/installment-savings-calculator/": ["적금", "적금이자", "적금 이자", "적금계산기", "적금 이자 계산기", "정기적금 이자계산기", "적금 만기", "적금 만기 수령액", "단리 복리"],
  "/guide/deposit-interest-calculator/": ["예금이자", "예금 이자", "예금이자계산기", "정기예금 이자", "정기예금 이자계산기", "예금 세후 이자", "이자소득세 15.4%", "단리 복리"],
  "/guide/loan-calculator/": ["대출", "대출이자", "대출이자 계산기", "상환표", "원리금균등", "원금균등", "만기일시", "주택담보대출 이자", "전세대출 이자", "신용대출 이자"],
  "/guide/parental-leave-pay-calculator/": ["육아휴직 급여", "육아휴직 월급", "출산휴가 급여"],
  "/guide/hourly-wage-calculator/": ["시급", "시급계산기", "시급 계산", "알바 시급", "시급 월급", "일급", "주급", "최저시급 월급"],
  "/guide/dsr-calculator/": ["DSR", "DSR계산기", "DSR 계산", "DSR 한도", "DSR 40%", "스트레스 DSR", "대출 한도", "주택담보대출 한도", "마이너스통장 DSR"],
  "/guide/daily-worker-insurance-calculator/": ["일용직 4대보험", "일용직 4대보험 계산", "일용직 국민연금", "일용직 국민연금 계산", "일용직 건강보험", "일용직 건강보험료 계산", "일용직 고용보험", "일용직 고용보험 계산", "건설일용직 4대보험", "일용직 4대보험 공제"],
  "/guide/ordinary-wage-calculator/": ["통상임금", "통상임금 계산", "통상임금계산기", "통상임금 계산 방법", "통상시급", "통상시급 계산", "통상시급 계산기", "1일 통상임금", "1일 통상임금 계산기", "기본시급"],
  "/guide/overtime-pay-calculator/": ["야근수당", "야근수당계산기", "야근수당 계산", "연장근로수당", "연장근로수당 계산", "야간수당", "야간수당 계산기", "휴일근로수당", "휴일수당", "가산수당", "통상시급"],
  "/guide/brokerage-fee-calculator/": ["중개보수", "중개보수계산기", "복비", "복비 계산기", "복비계산기", "부동산 수수료", "부동산 중개수수료", "중개수수료", "월세 복비", "전세 복비"],
  "/tools/percent/": ["퍼센트", "퍼센트계산기", "퍼센트 계산", "퍼센트 계산법", "퍼센트 계산방법", "퍼센트 계산 공식", "주식 퍼센트 계산기", "%", "할인율 계산", "할인율 계산기", "할인율 계산법", "증감률 계산", "증감률 계산기"],
  "/guide/parking-account-interest-calculator/": ["파킹통장", "파킹통장 이자", "파킹통장 이자 계산", "파킹통장 이자 계산기", "파킹통장 이자계산기", "파킹통장 이자 계산 방법", "파킹통장 세금", "파킹통장 이자소득세", "파킹통장 이자 지급일"],
  "/tools/compound/": ["복리", "복리계산기", "복리 계산기", "복리 계산", "복리 계산법", "복리 계산 공식", "복리 계산 방법", "월복리 계산기", "연복리 계산기", "적립식 복리", "적립식 복리계산기", "적립식 복리 계산식", "주식복리계산기", "코인복리계산기"],
  "/tools/date-diff/": ["날짜 계산", "날짜계산기", "날짜 계산기 일수", "남은 날짜 계산", "일수 계산", "기간 계산", "며칠", "며칠 뒤", "업무일 계산", "영업일 계산", "평일 계산", "개월 계산"],
  "/tools/dday/": ["디데이", "디데이계산기", "디데이 계산", "디데이계산", "D-day", "D-day 계산기", "디데이 계산기 시간", "디데이 계산기 기준일", "며칠 남았", "남은 시간", "N일째"],
  "/tools/age/": ["만 나이", "만나이", "만나이계산기", "만 나이 계산", "만 나이 계산기", "만나이 계산법", "만 나이 계산 방법", "나이 계산", "나이 계산기", "연 나이", "세는 나이", "한국 나이", "개월 수", "아기 개월수", "만나이계산기 개월수"],
  "/tools/date-day/": ["요일 계산", "요일 계산기", "요일계산기", "날짜 요일", "날짜 요일 계산", "날짜 요일 확인", "무슨 요일", "무슨요일", "몇 요일", "오늘 날짜 요일", "요일 계산법", "요일 계산 방법", "몇주차", "몇 주차", "이번주 몇주차", "오늘 몇주차", "10월 몇주차", "주차 계산", "주차 계산기", "달력 주차 계산", "ISO 주차", "연중 일수", "윤년"],
  "/tools/anniversary/": ["커플 기념일", "커플 기념일 계산기", "기념일 계산기", "기념일 계산", "기념일 며칠째", "커플 디데이", "커플 디데이 계산기", "사귄 날짜 계산", "사귄 날", "연애 일수", "100일 계산", "100일 계산기", "100일 계산 기준일", "1000일 계산", "1000일 계산기", "1주년", "기념일 계산기 1주년", "결혼기념일 계산기", "결혼기념일 계산기 주년", "결혼 몇 주년", "아기 100일 계산기", "백일 계산"],
  "/tools/birthday-dday/": ["생일 디데이", "생일 디데이 계산", "생일 디데이 계산기", "생일 카운트다운", "생일 카운트다운 타이머", "생일까지 며칠", "생일까지 남은 날", "다음 생일", "생일 계산기", "생일 계산기 2026", "몇번째 생일 계산기", "생일 요일", "생일 요일 확인", "윤년 생일", "윤년 생일 뜻", "2월 29일 생일"],
  "/tools/unix-time/": ["유닉스 타임스탬프", "유닉스 시간", "유닉스 시간 변환", "타임스탬프 변환", "타임스탬프 뜻", "unix timestamp", "unix time", "epoch", "epoch 변환", "에포크 시간", "밀리초 변환", "2038년 문제"],
  "/tools/time-calc/": ["시간 계산", "시간 계산기", "시간계산기", "날짜 시간 계산기", "경과 시간", "경과 시간 계산", "몇시간 후", "몇시간 후 계산", "몇 시간 뒤", "시간 더하기", "시간 더하기 계산기", "시간 빼기", "시간 빼기 계산", "시간 더하기 빼기 계산기", "두 시각 사이", "몇 시간 차이", "남은 시간 계산기"],
  "/tools/pyeong/": ["평수", "평수 계산", "평수 계산기", "평수계산기", "평 계산", "평수 계산법", "제곱미터 평", "제곱미터 평수", "평 제곱미터", "평 제곱미터 변환", "㎡ 평", "m2 평", "전용면적 평수", "전용면적 평수 계산", "공급면적", "아파트 평수 계산기", "집 평수 계산", "방 크기 평수", "가로세로 평수계산기", "평형 계산기", "84제곱미터 평수", "59제곱미터 평수", "아파트 면적 계산기", "전용률", "전용률 계산", "평당 분양가", "공용면적"],
  "/guide/minimum-wage-calculator/": ["최저임금", "최저시급", "2026 최저임금"],
  "/guide/take-home-calculator/": ["실수령액", "월급 얼마", "연봉 실수령", "세후 월급", "월급 실수령액", "하루 실수령액", "월급 하루", "일급 환산"],
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
  { href: "/tools/char-count/", name: "글자 수 세기", blurb: "공백 포함·제외 · 바이트 · 원고지", type: "text", icon: "document", keywords: ["글자 수", "글자수 세기", "글자수", "바이트 계산"] },
  { href: "/tools/school-year/", name: "입학·졸업 연도 계산기", blurb: "생년월일 → 초·중·고 입학·졸업 연도", type: "date", icon: "calendar", keywords: ["입학 연도", "졸업 연도", "학번 계산", "몇 학년"] },
  { href: "/tools/csat-dday/", name: "수능 디데이", blurb: "수능까지 D-몇 · 남은 주 · 남은 시간", type: "date", icon: "calendar", keywords: ["수능 디데이", "수능 d-day", "수능 며칠 남았"] },
  { href: "/tools/service-period/", name: "근속 기간 계산기", blurb: "입사일·퇴사일 → 몇 년 몇 개월 며칠", type: "date", icon: "calendar", keywords: ["근속 기간", "근속기간 계산", "재직 기간", "경력 기간"] },
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
    // 범용(/tools/) 도구는 법 숫자가 없다 — '원문 검증' 표시를 붙이지 않는다
    ...(href.startsWith("/tools/") ? {} : { verified: "law" as const }),
  };
}

const calcHrefs = [...clusters.flatMap((c) => c.links.filter((l) => l.kind === "calc").map((l) => l.href)), ...CALC_GUIDES];

export const liveTools: Tool[] = calcHrefs.map(liveTool).sort((a, b) => a.no! - b.no!);
export const nextTools: Tool[] = NEXT.map((n) => ({ ...n, no: null, status: "next" as const, keywords: [n.name, ...n.keywords] }));
export const tools: Tool[] = [...liveTools, ...nextTools];

export const toolCount = () => ({ live: liveTools.length, total: BACKLOG_TOTAL });
