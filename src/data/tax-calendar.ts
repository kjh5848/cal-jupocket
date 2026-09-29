/**
 * 한 해 세금 달력 — 시간 축과 자산 축을 한 데이터로 그린다.
 *
 * 같은 표를 두 가지로 읽는다.
 *
 *   시간 축   1월에 뭐가 오나            → byMonth()
 *   자산 축   집이 있으면 뭘 내나         → byDomain()
 *
 * **왜 하나로 두나.** 달력과 분류를 따로 만들면 반드시 어긋난다. 재산세
 * 날짜를 한 곳에서 고치고 다른 곳을 잊으면, 우리가 파는 것(검증된 숫자)이
 * 우리 안에서 서로 다른 말을 하게 된다.
 *
 * **왜 "세금 달력"이라는 이름을 페이지에 쓰지 않나.** 아무도 그 말을
 * 검색하지 않는다 — 네이버 검색광고에서 달력·캘린더·월별·일정을 합쳐
 * 2,510 이고 그중 2,440 이 "공모주일정"이다(`docs/keyword-research.md` v15).
 * 사람들은 그 달에 닥친 **세금의 이름**을 친다. 달력은 구조이지 진입점이
 * 아니다.
 *
 * **모든 항목은 조문 근거를 가진다.** `article` 이 비면 테스트가 떨어진다.
 * 날짜는 손으로 적지 않고 `src/rates/*.json` 에서 확인한 값만 옮긴다.
 */

/** 무엇을 가졌거나 무엇을 해서 내는 세금인가. */
export type Domain =
  | "work" // 일해서 버는 돈 — 근로·사업소득
  | "business" // 사업자로서 — 부가세·사업장
  | "property" // 부동산
  | "vehicle" // 자동차
  | "living" // 그냥 살아서 — 주민세처럼 보유·소득과 무관
  | "wealth" // 물려주고 받는 돈 — 상속·증여
  | "retirement"; // 노후·연금

export const DOMAIN_LABEL: Record<Domain, string> = {
  work: "일해서 버는 돈",
  business: "사업자",
  property: "부동산",
  vehicle: "자동차",
  living: "살면서",
  wealth: "물려주고 받는 돈",
  retirement: "노후·연금",
};

export interface TaxEvent {
  /** 1~12. 기간이 두 달에 걸치면 시작하는 달. */
  month: number;
  label: string;
  /** "7월 16일" 처럼 사람이 읽는 꼴. 하루짜리면 to 를 비운다. */
  from: string;
  to?: string;
  domain: Domain;
  /** 누구에게 오나. 한 줄. */
  who: string;
  /** 조문. 비면 테스트가 떨어진다. */
  article: string;
  /** 이 날짜를 확인한 rates 파일. */
  source: string;
  /** 우리 글이 있으면. */
  href?: string;
  /** 고지서가 오는가, 내가 신고하는가. */
  kind: "신고" | "고지" | "기준일";
}

export const TAX_EVENTS: TaxEvent[] = [
  // ── 1월 ────────────────────────────────────────────────
  {
    month: 1,
    label: "부가세 2기 확정신고",
    from: "1월 1일",
    to: "1월 25일",
    domain: "business",
    who: "일반과세자 — 직전 해 7~12월분",
    article: "부가가치세법 제49조",
    source: "vat-2026.json",
    href: "/guide/vat-filing/",
    kind: "신고",
  },
  {
    month: 1,
    label: "간이과세자 부가세 신고",
    from: "1월 1일",
    to: "1월 25일",
    domain: "business",
    who: "간이과세자 — 한 해에 한 번뿐이다",
    article: "부가가치세법 제49조",
    source: "vat-2026.json",
    href: "/guide/simplified-vat/",
    kind: "신고",
  },

  // ── 2월 ────────────────────────────────────────────────
  {
    month: 2,
    label: "사업장현황신고",
    from: "2월 10일",
    domain: "business",
    who: "면세사업자 — 부가세 신고 대신 이걸 한다",
    article: "국세청 사업장현황신고 개요",
    source: "vat-2026.json",
    kind: "신고",
  },

  // ── 3월 ────────────────────────────────────────────────
  {
    month: 3,
    label: "자동차세 1기분 분할납부",
    from: "3월 16일",
    to: "3월 31일",
    domain: "vehicle",
    who: "연세액을 4분의 1씩 나눠 내겠다고 신청한 사람만",
    article: "지방세법 제128조 제1항 단서",
    source: "local-tax-2026.json",
    kind: "고지",
  },

  // ── 4월 ────────────────────────────────────────────────
  {
    month: 4,
    label: "부가세 1기 예정고지",
    from: "4월 1일",
    to: "4월 10일",
    domain: "business",
    who: "개인사업자 — 고지서가 온다. 납부는 4월 25일까지",
    article: "부가가치세법 제48조 · 시행령 제90조 제5항",
    source: "vat-prepay-2026.json",
    href: "/guide/vat-prepayment/",
    kind: "고지",
  },

  // ── 5월 ────────────────────────────────────────────────
  {
    month: 5,
    label: "종합소득세 신고",
    from: "5월 1일",
    to: "5월 31일",
    domain: "work",
    who: "3.3% 떼인 사람, 사업자, 소득이 둘 이상인 사람",
    article: "소득세법 제70조",
    source: "filing-2026.json",
    href: "/guide/who-must-file/",
    kind: "신고",
  },

  // ── 6월 ────────────────────────────────────────────────
  {
    month: 6,
    label: "재산세 과세기준일",
    from: "6월 1일",
    domain: "property",
    who: "이날 소유자가 그해 재산세를 전부 낸다 — 6월 2일에 팔아도 낸다",
    article: "지방세법 제114조",
    source: "local-tax-2026.json",
    kind: "기준일",
  },
  {
    month: 6,
    label: "성실신고확인대상자 종합소득세 신고",
    from: "5월 1일",
    to: "6월 30일",
    domain: "business",
    who: "성실신고확인대상 사업자 — 한 달 더 있다",
    article: "소득세법 제70조의2",
    source: "filing-2026.json",
    kind: "신고",
  },

  // ── 7월 ────────────────────────────────────────────────
  {
    month: 7,
    label: "주민세 과세기준일",
    from: "7월 1일",
    domain: "living",
    who: "이날 그 지자체에 주소가 있으면 대상",
    article: "지방세법 제79조 제2항",
    source: "local-tax-2026.json",
    kind: "기준일",
  },
  {
    month: 7,
    label: "부가세 1기 확정신고",
    from: "7월 1일",
    to: "7월 25일",
    domain: "business",
    who: "일반과세자 — 1~6월분",
    article: "부가가치세법 제49조",
    source: "vat-2026.json",
    href: "/guide/vat-filing/",
    kind: "신고",
  },
  {
    month: 7,
    label: "재산세 (건축물·주택 절반·선박·항공기)",
    from: "7월 16일",
    to: "7월 31일",
    domain: "property",
    who: "집이 있으면 절반이 이때 온다. 주택분 세액 20만원 이하면 조례에 따라 7월에 한 번에 올 수 있다",
    article: "지방세법 제115조 제1항",
    source: "local-tax-2026.json",
    kind: "고지",
  },

  // ── 8월 ────────────────────────────────────────────────
  {
    month: 8,
    label: "주민세 개인분",
    from: "8월 16일",
    to: "8월 31일",
    domain: "living",
    who: "세대주. 금액은 지자체 조례로 정해져 1만원을 넘지 않는다",
    article: "지방세법 제78조 · 제79조 제3항",
    source: "local-tax-2026.json",
    kind: "고지",
  },

  // ── 9월 ────────────────────────────────────────────────
  {
    month: 9,
    label: "재산세 (토지·주택 나머지 절반)",
    from: "9월 16일",
    to: "9월 30일",
    domain: "property",
    who: "땅이 있으면 이때만 온다. 집은 7월에 이어 두 번째",
    article: "지방세법 제115조 제1항",
    source: "local-tax-2026.json",
    kind: "고지",
  },
  {
    month: 9,
    label: "자동차세 2기분 분할납부",
    from: "9월 16일",
    to: "9월 30일",
    domain: "vehicle",
    who: "분할납부를 신청한 사람만",
    article: "지방세법 제128조 제1항 단서",
    source: "local-tax-2026.json",
    kind: "고지",
  },

  // ── 10월 ───────────────────────────────────────────────
  {
    month: 10,
    label: "부가세 2기 예정고지",
    from: "10월 1일",
    to: "10월 10일",
    domain: "business",
    who: "개인사업자 — 고지서가 온다. 납부는 10월 25일까지",
    article: "부가가치세법 제48조 · 시행령 제90조 제5항",
    source: "vat-prepay-2026.json",
    href: "/guide/vat-prepayment/",
    kind: "고지",
  },

  // ── 11월 ───────────────────────────────────────────────
  {
    month: 11,
    label: "종합소득세 중간예납",
    from: "11월 1일",
    to: "11월 15일",
    domain: "work",
    who: "5월에 세금을 더 낸 사람 — 고지서가 온다. 납부는 11월 30일까지",
    article: "소득세법 제65조 제1항",
    source: "income-prepay-2026.json",
    href: "/guide/income-prepayment/",
    kind: "고지",
  },
];

/**
 * 날짜가 달력에 없는 것 — 사람마다 다르다.
 *
 * 상속·증여는 사망일·증여일에서 세는 것이라 "몇 월"이 없다. 달력에 억지로
 * 넣으면 거짓말이 된다.
 */
export interface RelativeDeadline {
  label: string;
  domain: Domain;
  rule: string;
  article: string;
  source: string;
  href?: string;
}

export const RELATIVE_DEADLINES: RelativeDeadline[] = [
  {
    label: "증여세 신고",
    domain: "wealth",
    rule: "증여받은 날이 속하는 달의 말일부터 3개월",
    article: "상속세 및 증여세법 제68조 제1항",
    source: "gift-2026.json",
    href: "/guide/gift-tax/",
  },
  {
    label: "상속세 신고",
    domain: "wealth",
    rule: "상속개시일이 속하는 달의 말일부터 6개월 (국외 거주면 9개월)",
    article: "상속세 및 증여세법 제67조",
    source: "inheritance-2026.json",
    href: "/guide/inheritance-tax/",
  },
  {
    label: "배우자상속재산분할기한",
    domain: "wealth",
    rule: "상속세 신고기한의 다음 날부터 9개월 — 이날까지 나누고 등기까지 끝내야 배우자 상속공제를 실제 금액으로 받는다",
    article: "상속세 및 증여세법 제19조 제2항",
    source: "inheritance-2026.json",
    href: "/guide/inheritance-tax/",
  },
];

/** 그 달에 무엇이 오나. */
export function byMonth(month: number): TaxEvent[] {
  return TAX_EVENTS.filter((e) => e.month === month);
}

/** 이걸 가진 사람은 한 해에 무엇을 내나. */
export function byDomain(domain: Domain): TaxEvent[] {
  return TAX_EVENTS.filter((e) => e.domain === domain).sort(
    (a, b) => a.month - b.month,
  );
}

/** 달력에 들어간 영역들 — 빈 영역은 내보내지 않는다. */
export function activeDomains(): Domain[] {
  const seen = new Set(TAX_EVENTS.map((e) => e.domain));
  return (Object.keys(DOMAIN_LABEL) as Domain[]).filter((d) => seen.has(d));
}
