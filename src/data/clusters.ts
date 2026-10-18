/**
 * 콘텐츠 클러스터 정의 — 같은 주제의 글·계산기를 한 묶음으로 본다.
 *
 * 가이드 글의 사이드바(RelatedContent.astro)·썸네일(ArticleThumb.astro)·
 * 내부 링크가 이 한 곳을 근거로 움직인다. 글을 추가하면 여기 links에 한
 * 줄(icon 포함) 넣으면 사이드바·썸네일에 자동 반영된다.
 *
 * kind: "calc"는 계산기(사이드바 배지), "guide"는 설명 글.
 * icon: data/icons.ts의 키(썸네일 워터마크 아이콘).
 */
export interface ClusterLink {
  href: string;
  title: string;
  kind: "calc" | "guide";
  icon: string;
  /** 홈 계산기 카드용 한 줄 설명(계산기에만). */
  blurb?: string;
  /**
   * 연도에 따라 숫자가 바뀌는 글에만 붙인다(세율·한도·기준금액·신고일정).
   * 제목 문자열에 "2026"을 박지 않는 이유: 내년에 열네 군데를 손으로 고쳐야
   * 하고, 한 군데를 빠뜨리면 2026과 2027이 같은 페이지에 같이 나온다.
   *
   * 올리는 순서가 있다 — rates 를 원문으로 재검증하고 verifiedOn 을 갱신한
   * 뒤에만 올린다. 숫자를 확인하지 않고 연도만 올리는 것은 가짜 최신화다.
   */
  year?: number;
}

/**
 * 화면에 쓰는 제목. year 가 있으면 "2026년 " 을 앞에 붙인다.
 *
 * 계산기에는 붙이지 않는다(항상 최신이라 연도를 달면 오히려 낡아 보인다).
 * 링크허브 라벨에도 붙이지 않는다 — 라벨은 30자 상한이 걸려 있고, 허브는
 * 번호를 찾는 색인이라 연도가 할 일이 없다.
 */
export const displayTitle = (l: ClusterLink): string =>
  l.year ? `${l.year}년 ${l.title}` : l.title;

export interface Cluster {
  id: string;
  /** 사이드바·썸네일 라벨 */
  title: string;
  links: ClusterLink[];
}

/** 클러스터별 썸네일 색(고정 — 그래픽/이미지처럼 라이트·다크 공통). */
export const clusterColor: Record<
  string,
  { bg: string; wm: string; ink: string; mark: string }
> = {
  income: { bg: "#e1f5ee", wm: "#9fe1cb", ink: "#0f6e56", mark: "#0f6e56" },
  vat: { bg: "#e6f1fb", wm: "#b5d4f4", ink: "#0c447c", mark: "#0b5cad" },
  retirement: { bg: "#eeedfe", wm: "#cecbf6", ink: "#3c3489", mark: "#534ab7" },
  // 상속·증여는 네 번째 축이다. 앞의 셋과 달리 "해마다 내는 세금" 이 아니라
  // 한 번 오는 일이라, 색도 따뜻한 쪽으로 떼어 놓는다.
  inheritance: { bg: "#fbeee6", wm: "#f0cdb4", ink: "#8a4a1c", mark: "#a85820" },
  // 지방세는 다섯 번째 축이다. 국세 셋(초록·파랑·보라)과 섞이면 "세무서에
  // 내는 것" 으로 읽히므로, 흙빛 쪽으로 떼어 놓는다 — 집과 땅의 세금이다.
  localtax: { bg: "#f0f1e8", wm: "#d3d6bd", ink: "#5a5f2e", mark: "#6e7438" },
  // 급여·근로는 여섯 번째 축이다. 세금이 아니라 월급봉투 쪽 — 주휴수당·연차처럼 근로기준법이 정하는 돈이라
  // 세목 색(초록·파랑·보라·주황·흙빛)과 떼어 장밋빛으로 둔다.
  labor: { bg: "#fbeaf0", wm: "#f2c4d4", ink: "#8a2148", mark: "#a8325c" },
  // 돈·금융은 일곱 번째 축이다(설계 3-4 신설). 세금이 아니라 빌리고 모으는 돈 — 대출·예적금. 분류 색 #0b5cad 를 표시 색으로 쓴다.
  money: { bg: "#e4eefa", wm: "#b6d0f0", ink: "#0a4682", mark: "#0b5cad" },
  // 단위·변환은 첫 범용 묶음 — 분류 색 #1f9c8e(청록)를 표시 색으로, 세목 초록(#0f6e56)보다 밝게 떼어 둔다.
  unit: { bg: "#e2f5f2", wm: "#aee0d9", ink: "#146b61", mark: "#1f9c8e" },
  // 날짜·시간은 두 번째 범용 묶음 — 분류 색 #2e7d9a(푸른 청회색)를 표시 색으로. 돈·금융 파랑(#0b5cad)보다 흐리게 떼어 둔다.
  date: { bg: "#e3f0f5", wm: "#b3d4e1", ink: "#1f5a70", mark: "#2e7d9a" },
};

export const clusters: Cluster[] = [
  {
    id: "income",
    title: "종합소득세·원천징수",
    links: [
      { href: "/freelancer-33/", title: "프리랜서 3.3% 계산기", kind: "calc", icon: "percent", blurb: "계약금액 → 실수령액, 실수령액 → 계약금액 역산" },
      { href: "/withholding/", title: "원천징수 계산기 (3.3%·8.8%)", kind: "calc", icon: "receipt", blurb: "사업소득 3.3%·기타소득 8.8% 원천징수액과 실수령액" },
      { href: "/income-tax-refund/", title: "종소세 환급 예상 계산기", kind: "calc", icon: "coins", blurb: "총수입·경비율·공제로 5월 환급/추가납부 예상" },
      { href: "/guide/33-settlement/", title: "3.3%는 종합소득세에서 정산됩니다", kind: "guide", icon: "refresh" },
      { href: "/guide/who-must-file/", title: "종합소득세 신고 대상, 나는 해야 하나", kind: "guide", icon: "checklist", year: 2026 },
      { href: "/guide/income-tax-brackets/", title: "종합소득세 세율 구간", kind: "guide", icon: "chart", year: 2026 },
      { href: "/guide/expense-rate/", title: "단순경비율 vs 기준경비율", kind: "guide", icon: "document", year: 2026 },
      { href: "/guide/multiple-payers/", title: "거래처 여러 곳, 3.3%와 합산신고", kind: "guide", icon: "coins", year: 2026 },
      { href: "/guide/family-deduction/", title: "인적공제, 부양가족 누구까지", kind: "guide", icon: "checklist", year: 2026 },
      { href: "/guide/year-end-settlement/", title: "연말정산 기간과 순서", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/penalty/", title: "가산세 계산기 (기한 후 신고)", kind: "calc", icon: "calendar", blurb: "신고를 놓쳤을 때 지금 신고하면 얼마인지" },
      { href: "/guide/late-filing-penalty/", title: "종합소득세·부가세 신고 기한을 놓쳤다면", kind: "guide", icon: "checklist", year: 2026 },
      { href: "/guide/late-filing-refund/", title: "기한후신고 환급, 언제까지 되고 언제 들어오나", kind: "guide", icon: "coins", year: 2026 },
      { href: "/guide/income-prepayment/", title: "종합소득세 중간예납, 11월 고지서는 얼마가 나오나", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/withholding-receipt/", title: "원천징수영수증, 소득마다 발급 기한이 다르다", kind: "guide", icon: "receipt" },
      { href: "/guide/earned-income-withholding-receipt/", title: "근로소득 원천징수영수증, 2월 말일까지", kind: "guide", icon: "receipt" },
      { href: "/guide/business-income-withholding-receipt/", title: "사업소득 원천징수영수증, 지급할 때", kind: "guide", icon: "receipt" },
      { href: "/guide/severance-withholding-receipt/", title: "퇴직소득 원천징수영수증, 다음 달 말일까지", kind: "guide", icon: "receipt" },
      { href: "/guide/withholding-receipt-issue/", title: "원천징수영수증 발급", kind: "guide", icon: "receipt" },
      { href: "/guide/withholding-receipt-read/", title: "원천징수영수증 보는 법", kind: "guide", icon: "receipt" },
      { href: "/guide/withholding-receipt-vs-income-certificate/", title: "원천징수영수증과 소득금액증명원의 차이", kind: "guide", icon: "receipt" },
      { href: "/guide/year-end-tax/", title: "연말정산, 2월 급여에서 맞추는 일", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/year-end-simplified/", title: "연말정산 간소화", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/year-end-calculator/", title: "연말정산 계산기", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/year-end-income-deduction/", title: "연말정산 소득공제와 세액공제", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/year-end-personal-deduction/", title: "연말정산 인적공제, 1명당 150만원", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/year-end-card-deduction/", title: "연말정산 신용카드 공제, 25%부터", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/year-end-rent-credit/", title: "연말정산 월세 세액공제", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/year-end-refund-date/", title: "연말정산 환급금 지급일", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/year-end-refund-how/", title: "연말정산 환급금 받는 법", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/year-end-refund-amount/", title: "연말정산 환급금 얼마", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/year-end-refund-unpaid/", title: "연말정산 환급금 미지급", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/year-end-extra-tax/", title: "연말정산 세금 더 내는 경우", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/year-end-correction/", title: "연말정산 경정청구, 5년 안에", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/year-end-child-tax-credit/", title: "연말정산 자녀세액공제, 2017년생은 빠진다", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/child-incentive/", title: "자녀장려금, 18세 미만 자녀 1명당 최대 100만원", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/child-incentive-amount/", title: "자녀장려금 금액, 소득별로 계산", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/child-incentive-eligibility/", title: "자녀장려금 신청 조건, 총소득·재산·자녀", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/child-incentive-apply/", title: "자녀장려금 신청 기간, 5월", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/child-incentive-pay-date/", title: "자녀장려금 지급일, 결정 뒤 30일", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/earned-incentive/", title: "근로장려금, 단독 165만·홑벌이 285만·맞벌이 330만원", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/earned-incentive-eligibility/", title: "근로장려금 대상, 나이 요건은 없다", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/earned-incentive-amount/", title: "근로장려금 금액, 가구·소득별 계산", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/earned-incentive-apply/", title: "근로장려금 신청 기간, 5월·9월·3월", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/earned-incentive-half-year/", title: "근로장려금 반기 신청, 상반기분 35%", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/earned-incentive-pay-date/", title: "근로장려금 지급일, 결정 뒤 30일", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/medical-credit/", title: "의료비세액공제, 총급여 3% 넘는 15%", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/medical-credit-limit/", title: "의료비 세액공제 한도 700만원, 계산기", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/medical-credit-eligibility/", title: "의료비 세액공제 대상, 나이·소득 무관", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/medical-credit-pooling/", title: "의료비 몰아주기, 3% 문턱이 낮은 쪽", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/medical-credit-insurance/", title: "의료비 세액공제, 실손보험금은 뺀다", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/medical-credit-glasses/", title: "의료비 안경 50만·산후조리원 200만원", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/education-credit/", title: "교육비세액공제, 2026년분 소득요건 폐지", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/education-credit-limit/", title: "교육비 한도, 대학생 900만·초중고 300만", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/education-credit-income/", title: "교육비세액공제 소득요건 폐지", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/education-credit-academy/", title: "교육비 학원비, 취학 전·초등 1~2학년", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/education-credit-student-loan/", title: "학자금 대출, 갚을 때 본인 공제", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/donation-credit/", title: "기부금세액공제 15%·1천만원 초과 30%", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/donation-credit-limit/", title: "기부금 한도, 소득금액 30%·종교 10%", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/donation-credit-rate/", title: "기부금 세액공제율, 10만원 100%의 정체", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/hometown-donation-credit/", title: "고향사랑기부금, 10만원까지 100/110", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/religious-donation-credit/", title: "종교 기부금, 한도 소득금액 10%", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/donation-credit-carryover/", title: "기부금 이월, 10년", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/donation-credit-standard/", title: "기부금 공제 신청하면 13만원은 못 받는다", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/donation-credit-business/", title: "사업자 기부금, 필요경비로", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/earned-income-tax-rate/", title: "근로소득세율, 연봉별 실효세율", kind: "guide", icon: "percent", year: 2026 },
      { href: "/guide/earned-income-tax/", title: "근로소득세, 간이세액표와 연말정산", kind: "guide", icon: "percent", year: 2026 },
      { href: "/guide/tax-base/", title: "과세표준, 세율을 곱하는 금액", kind: "guide", icon: "percent", year: 2026 },
      { href: "/guide/comprehensive-tax-base/", title: "종합소득세 과세표준, 합산 뒤 공제", kind: "guide", icon: "percent", year: 2026 },
      { href: "/guide/other-income-tax-rate/", title: "기타소득세율, 강연료는 8.8%", kind: "guide", icon: "percent", year: 2026 },
      { href: "/guide/business-income-tax/", title: "사업소득세, 3.3%는 미리 떼는 돈", kind: "guide", icon: "percent", year: 2026 },
      { href: "/guide/withholding-tax/", title: "원천세, 다음 달 10일까지", kind: "guide", icon: "receipt", year: 2026 },
      { href: "/guide/withholding-status-report/", title: "원천징수이행상황신고서, 0원도 신고", kind: "guide", icon: "receipt", year: 2026 },
      { href: "/guide/daily-worker-tax/", title: "일용직 세금, 15만원 초과분의 2.7%", kind: "guide", icon: "receipt", year: 2026 },
      { href: "/guide/daily-worker-income-report/", title: "일용직 소득신고, 다음 달 말일", kind: "guide", icon: "receipt", year: 2026 },
      { href: "/guide/simplified-payment-statement/", title: "간이지급명세서, 매달 다음 달 말일", kind: "guide", icon: "receipt", year: 2026 },
      { href: "/guide/payment-statement/", title: "지급명세서, 2월 말·3월 10일", kind: "guide", icon: "receipt", year: 2026 },
      { href: "/guide/tax-refund-lookup/", title: "세금 환급금 조회, 5년 지나면 소멸", kind: "guide", icon: "coins", year: 2026 },
      { href: "/guide/national-tax-refund/", title: "국세환급금, 충당 뒤 30일 안에", kind: "guide", icon: "coins", year: 2026 },
      { href: "/guide/income-tax-refund-guide/", title: "종합소득세 환급, 5월 신고로", kind: "guide", icon: "coins", year: 2026 },
      { href: "/guide/income-tax-refund-date/", title: "종합소득세 환급일, 7월 1일부터 이자", kind: "guide", icon: "coins", year: 2026 },
      { href: "/guide/lotto-tax/", title: "로또세금 — 200만원 넘으면 22%, 3억원을 넘는 부분은 33%를 떼고 받습니다", kind: "guide", icon: "coins", year: 2026 },
      { href: "/guide/lotto-net-amount/", title: "로또 실수령액 — 1억원이면 7,800만원, 10억원이면 7억300만원을 받습니다", kind: "guide", icon: "coins", year: 2026 },
      { href: "/guide/lotto-tax-calculator/", title: "로또 세금 계산기 — 당첨금을 넣으면 소득세·지방소득세와 실수령액이 나옵니다", kind: "guide", icon: "coins", year: 2026 },
      { href: "/guide/diligent-filer/", title: "성실신고대상자 — 그해 수입금액이 업종별 15억·7억5천만·5억원 이상이면 6월 30일까지 신고합니다", kind: "guide", icon: "checklist", year: 2026 },
      { href: "/guide/diligent-business/", title: "성실사업자 기준 — 카드·현금영수증 가맹, 장부 신고, 사업용계좌 3분의 2 사용 세 가지", kind: "guide", icon: "checklist", year: 2026 },
      { href: "/guide/financial-income-tax/", title: "금융소득종합과세 — 이자·배당이 한 해 2천만원을 넘으면 다른 소득과 합쳐 5월에 신고합니다", kind: "guide", icon: "percent", year: 2026 },
      { href: "/guide/interest-income-tax/", title: "이자소득세 — 예금 이자는 15.4%를 떼고 받고, 개인에게 빌려준 돈의 이자는 27.5%입니다", kind: "guide", icon: "percent", year: 2026 },
      { href: "/guide/dividend-income-tax/", title: "배당소득세 — 배당금은 15.4%를 떼고, 2026년부터 고배당기업 배당은 따로 계산할 수 있습니다", kind: "guide", icon: "percent", year: 2026 },
      { href: "/guide/crypto-tax/", title: "코인 과세 — 2027년 1월 1일 이후 파는 코인부터 1년 이익에서 250만원을 빼고 22%를 냅니다", kind: "guide", icon: "coins", year: 2026 },
      { href: "/guide/crypto-tax-delay/", title: "가상자산 과세 유예 — 지금 법은 2027년 1월 1일 시행이고, 적용 시기는 세 번 미뤄졌습니다", kind: "guide", icon: "coins", year: 2026 },
      { href: "/guide/crypto-tax-calculator/", title: "코인 세금 계산기", kind: "calc", icon: "calculator", blurb: "양도가액·취득가액·2026년 말 시가 → 2027년부터의 코인 세금" },
    ],
  },
  {
    id: "vat",
    title: "부가가치세·사업자·법인세",
    links: [
      { href: "/vat/", title: "부가세 계산기", kind: "calc", icon: "calculator", blurb: "공급가액↔합계 양방향 + 간이과세 업종별 납부세액" },
      { href: "/guide/vat-freelancer/", title: "프리랜서도 부가세를 내야 하나요?", kind: "guide", icon: "receipt" },
      { href: "/guide/simplified-vat/", title: "간이과세 vs 일반과세, 뭐가 유리한가", kind: "guide", icon: "scale", year: 2026 },
      { href: "/guide/vat-filing/", title: "부가세 신고, 언제 어떻게 하나", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/vat-penalty/", title: "부가세 가산세, 신고를 제때 해도 붙는다", kind: "guide", icon: "receipt", year: 2026 },
      { href: "/guide/vat-prepayment/", title: "부가세 예정고지, 누구에게 얼마가 나오나", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/tax-invoice-date/", title: "세금계산서 발행일자, 다음 달 10일의 조건", kind: "guide", icon: "receipt", year: 2026 },
      { href: "/guide/simplified-tax-invoice/", title: "간이과세자 세금계산서 발행, 4,800만원이 두 번", kind: "guide", icon: "receipt", year: 2026 },
      { href: "/guide/tax-invoice-cancel/", title: "세금계산서 발행 취소, 지우는 게 아니다", kind: "guide", icon: "receipt" },
      { href: "/guide/tax-invoice-vs-statement/", title: "세금계산서와 계산서의 차이, 법이 다르다", kind: "guide", icon: "scale", year: 2026 },
      { href: "/guide/tax-invoice-early-issue/", title: "세금계산서 발행 후 대금 지급 기한, 먼저 끊었다면 7일", kind: "guide", icon: "calendar" },
      { href: "/guide/vat-final-return/", title: "부가세 확정신고, 1월 25일과 7월 25일", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/vat-final-return-period/", title: "부가세 확정신고 기간, 2기는 1월 25일까지", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/vat-final-return-first-half/", title: "1기 부가세 확정신고, 7월 25일까지", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/vat-final-return-second-half/", title: "2기 부가세 확정신고, 1월 25일까지", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/simplified-vat-final-return/", title: "간이과세자 부가세 확정신고, 1년에 한 번", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/individual-vat-final-return/", title: "개인사업자 부가세 확정신고, 6개월치를 한 번에", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/corporate-vat-final-return/", title: "법인 부가세 확정신고, 남은 3개월", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/vat-final-return-how/", title: "부가세 확정신고 방법", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/vat-final-return-payment/", title: "부가세 확정신고 납부, 늦으면 하루 0.022%", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/vat-final-return-refund/", title: "부가세 확정신고 환급, 30일 안에", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/vat-e-filing-credit/", title: "부가세 전자신고세액공제, 5천원", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/closing-vat-final-return/", title: "폐업 부가세 확정신고, 다음 달 25일", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/tax-invoice-how/", title: "세금계산서 발행방법, 기재사항 네 가지", kind: "guide", icon: "receipt", year: 2026 },
      { href: "/guide/e-tax-invoice/", title: "전자세금계산서 발행, 8천만원 이상 의무", kind: "guide", icon: "receipt", year: 2026 },
      { href: "/guide/simplified-taxpayer-criteria/", title: "간이과세자 기준, 1억400만원 미만", kind: "guide", icon: "receipt", year: 2026 },
      { href: "/guide/business-closure/", title: "개인사업자 폐업신고, 지체 없이", kind: "guide", icon: "receipt", year: 2026 },
      { href: "/guide/cash-receipt/", title: "현금영수증 발급방법, 5일 안에 자진발급", kind: "guide", icon: "receipt", year: 2026 },
      { href: "/guide/business-registration/", title: "사업자등록, 개업일부터 20일 안에", kind: "guide", icon: "briefcase", year: 2026 },
      { href: "/guide/business-registration-certificate/", title: "사업자등록증 발급, 신청일부터 2일", kind: "guide", icon: "briefcase", year: 2026 },
      { href: "/guide/business-registration-change/", title: "사업자등록증 주소변경, 2일 안에 재발급", kind: "guide", icon: "briefcase", year: 2026 },
      { href: "/guide/individual-business-registration/", title: "개인사업자 등록, 간이는 함께 신고", kind: "guide", icon: "briefcase", year: 2026 },
      { href: "/guide/corporate-business-registration/", title: "법인사업자등록, 설립신고와 한 번에", kind: "guide", icon: "briefcase", year: 2026 },
      { href: "/guide/corporate-tax/", title: "법인세, 2026년부터 1%p 인상", kind: "guide", icon: "percent", year: 2026 },
      { href: "/guide/corporate-tax-rate/", title: "법인세율, 10·20·22·25%", kind: "guide", icon: "percent", year: 2026 },
      { href: "/guide/corporate-tax-deadline/", title: "법인세 신고기간, 결산 후 3개월", kind: "guide", icon: "percent", year: 2026 },
      { href: "/guide/corporate-tax-prepayment/", title: "법인세 중간예납, 12월 결산 8월 31일", kind: "guide", icon: "percent", year: 2026 },
      { href: "/guide/corporate-tax-base/", title: "법인세 과세표준, 이월결손금 80%", kind: "guide", icon: "percent", year: 2026 },
      { href: "/guide/duty-free-limit/", title: "면세한도 — 해외에서 사 온 물건은 1명당 800달러까지, 술 2리터·담배 200개비·향수 100mL는 따로", kind: "guide", icon: "receipt", year: 2026 },
      { href: "/guide/liquor-duty-free-limit/", title: "주류 면세한도 — 술은 2리터 이하이면서 400달러 이하, 담배 200개비·향수 100mL도 800달러와 따로", kind: "guide", icon: "receipt", year: 2026 },
      { href: "/guide/japan-duty-free-limit/", title: "일본 면세한도 — 일본에서 돌아올 때도 한국 기준 1명당 800달러, 술은 2리터·400달러입니다", kind: "guide", icon: "receipt", year: 2026 },
      { href: "/guide/direct-purchase-customs/", title: "해외직구 관세 기준 — 자가사용 물품은 물품가격 150달러 이하면 관세가 없습니다", kind: "guide", icon: "receipt", year: 2026 },
    ],
  },
  {
    id: "retirement",
    title: "노후·연금·4대보험",
    links: [
      { href: "/national-pension-premium/", title: "국민연금 보험료 계산기 (지역가입)", kind: "calc", icon: "calculator", blurb: "월소득으로 2026년 요율(9.5%) 월·연 보험료" },
      { href: "/guide/pension-premium-2026/", title: "국민연금 보험료, 지역가입자는 얼마 내나", kind: "guide", icon: "percent", year: 2026 },
      { href: "/guide/retirement-planning/", title: "노후대비, 순서대로 정리", kind: "guide", icon: "umbrella" },
      { href: "/guide/national-pension-estimate/", title: "국민연금 예상수령액 조회 후 시점 정하기", kind: "guide", icon: "calendar" },
      { href: "/guide/pension-savings-tax-credit/", title: "연금저축·IRP 세액공제 한도", kind: "guide", icon: "coins", year: 2026 },
      { href: "/guide/irp-tax-credit/", title: "IRP 세액공제 조건과 한도, 12월 31일까지", kind: "guide", icon: "percent", year: 2026 },
      { href: "/guide/irp-tax-credit-eligibility/", title: "IRP 세액공제 조건", kind: "guide", icon: "percent" },
      { href: "/guide/irp-tax-credit-limit/", title: "IRP 세액공제 한도", kind: "guide", icon: "percent" },
      { href: "/guide/irp-tax-credit-9-million/", title: "IRP 세액공제 900만원", kind: "guide", icon: "percent" },
      { href: "/guide/irp-tax-credit-3-million/", title: "IRP 세액공제 300만원", kind: "guide", icon: "percent" },
      { href: "/guide/irp-tax-credit-rate/", title: "IRP 세액공제율 12%·15%", kind: "guide", icon: "percent" },
      { href: "/guide/irp-tax-credit-calculator/", title: "IRP 세액공제 계산기", kind: "guide", icon: "percent" },
      { href: "/guide/irp-tax-credit-deadline/", title: "IRP 세액공제 언제까지", kind: "guide", icon: "percent" },
      { href: "/guide/irp-tax-credit-deposit/", title: "IRP 세액공제 입금", kind: "guide", icon: "percent" },
      { href: "/guide/irp-tax-credit-how-to-claim/", title: "IRP 세액공제 받는 법", kind: "guide", icon: "percent" },
      { href: "/guide/irp-tax-credit-refund/", title: "IRP 세액공제 환급", kind: "guide", icon: "percent" },
      { href: "/guide/irp-tax-credit-carryover/", title: "IRP 세액공제 이월", kind: "guide", icon: "percent" },
      { href: "/guide/irp-cancellation-tax/", title: "IRP 세액공제 해지", kind: "guide", icon: "percent" },
      { href: "/guide/irp-tax-credit-downsides/", title: "IRP 세액공제 단점", kind: "guide", icon: "percent" },
      { href: "/guide/personal-irp-tax-credit/", title: "개인형 IRP 세액공제", kind: "guide", icon: "percent" },
      { href: "/guide/irp-tax-credit-vs-deduction/", title: "IRP 세액공제와 소득공제", kind: "guide", icon: "percent" },
      { href: "/guide/irp-account/", title: "IRP란? 소득 있으면 누구나 여는 계좌", kind: "guide", icon: "wallet" },
      { href: "/guide/retirement-fund/", title: "노후자금 얼마 있어야 하나", kind: "guide", icon: "chart" },
      { href: "/guide/severance-to-freelance/", title: "퇴사하고 프리랜서 시작할 때", kind: "guide", icon: "briefcase" },
      { href: "/guide/retirement-pension-loan/", title: "퇴직연금 담보대출, 중도인출과 뭐가 다른가", kind: "guide", icon: "wallet" },
      { href: "/guide/four-insurance/", title: "4대보험, 직장인 몫은 월급의 약 9.72%", kind: "guide", icon: "percent", year: 2026 },
      { href: "/guide/four-insurance-calculator/", title: "4대보험 계산기, 월급에서 떼는 네 가지", kind: "guide", icon: "percent", year: 2026 },
      { href: "/guide/four-insurance-rate/", title: "4대보험 요율, 2026년·2027년", kind: "guide", icon: "percent", year: 2026 },
      { href: "/guide/health-insurance-premium/", title: "건강보험료 계산, 보수월액 × 7.19%", kind: "guide", icon: "percent", year: 2026 },
      { href: "/guide/regional-health-insurance/", title: "지역건강보험료, 소득 + 재산 점수", kind: "guide", icon: "percent", year: 2026 },
      { href: "/guide/long-term-care-premium/", title: "장기요양보험료, 11월 27일부터 반올림", kind: "guide", icon: "percent", year: 2026 },
      { href: "/guide/employment-insurance-premium/", title: "고용보험료, 근로자 0.9%", kind: "guide", icon: "percent", year: 2026 },
      { href: "/guide/four-insurance-eligibility/", title: "4대보험 가입조건, 월 60시간", kind: "guide", icon: "percent", year: 2026 },
      { href: "/guide/daily-worker-insurance/", title: "일용직 4대보험, 월 8일 기준", kind: "guide", icon: "percent", year: 2026 },
      { href: "/guide/health-insurance-refund/", title: "건강보험 환급금, 3년 안에", kind: "guide", icon: "percent", year: 2026 },
      { href: "/guide/severance-tax/", title: "퇴직금 세금, 근속연수로 나눠 계산", kind: "guide", icon: "umbrella", year: 2026 },
      { href: "/guide/severance-tax-calculator/", title: "퇴직금 세금 계산기", kind: "guide", icon: "umbrella", year: 2026 },
      { href: "/guide/severance-pay-deadline/", title: "퇴직금 지급기한, 14일", kind: "guide", icon: "umbrella", year: 2026 },
      { href: "/guide/severance-interim-settlement/", title: "퇴직금 중간정산, 법정 사유만", kind: "guide", icon: "umbrella", year: 2026 },
      { href: "/guide/severance-irp/", title: "퇴직금 IRP, 원칙은 IRP 이전", kind: "guide", icon: "umbrella", year: 2026 },
      { href: "/guide/pension-receipt-method/", title: "퇴직연금 수령방법, 연금이면 30~50% 감면", kind: "guide", icon: "umbrella", year: 2026 },
      { href: "/guide/pension-income-tax/", title: "연금소득세, 5%·4%·3%", kind: "guide", icon: "umbrella", year: 2026 },
      { href: "/guide/dc-pension/", title: "퇴직연금 DC형, 12분의 1 이상", kind: "guide", icon: "umbrella", year: 2026 },
      { href: "/guide/pension-mid-withdrawal/", title: "퇴직연금 중도인출, 법정 사유", kind: "guide", icon: "umbrella", year: 2026 },
      { href: "/guide/pension-termination/", title: "퇴직연금 해지, 미뤄 둔 세금", kind: "guide", icon: "umbrella", year: 2026 },
      { href: "/guide/basic-pension/", title: "기초연금 — 65세 이상, 소득인정액 월 247만원 이하면 2026년 최대 월 349,700원을 받습니다", kind: "guide", icon: "umbrella", year: 2026 },
      { href: "/guide/basic-pension-amount/", title: "기초연금 금액 — 2026년 월 349,700원, 부부는 각각 279,760원이고 국민연금이 많으면 줄어듭니다", kind: "guide", icon: "umbrella", year: 2026 },
      { href: "/guide/basic-pension-criteria/", title: "기초연금 기준 — 소득인정액이 혼자 월 247만원, 부부 월 395만2천원 이하여야 합니다", kind: "guide", icon: "umbrella", year: 2026 },
      { href: "/guide/basic-pension-calculator/", title: "기초연금 모의계산", kind: "calc", icon: "calculator", blurb: "소득·재산 → 소득인정액과 2026년 기초연금 어림" },
      { href: "/guide/basic-pension-apply/", title: "기초연금 신청 — 시장·군수·구청장에게 신청한 달부터 받으니 65세가 되면 바로 하세요", kind: "guide", icon: "umbrella", year: 2026 },
      { href: "/guide/health-dependent/", title: "건강보험 피부양자 — 직장가입자의 가족은 소득 2천만원·재산 5억4천만원 이하여야 보험료 없이 됩니다", kind: "guide", icon: "umbrella", year: 2026 },
      { href: "/guide/health-dependent-criteria/", title: "건강보험 피부양자 조건 — 소득 연 2천만원 이하, 사업소득 없음, 재산 과세표준 5억4천만원 이하", kind: "guide", icon: "umbrella", year: 2026 },
      { href: "/guide/health-dependent-registration/", title: "건강보험 피부양자 등록 — 직장가입자가 신고서를 내고, 90일 안에 하면 입사일로 소급됩니다", kind: "guide", icon: "umbrella", year: 2026 },
      { href: "/guide/old-age-pension/", title: "노령연금 — 국민연금을 10년 이상 내면 받고, 1969년생부터는 65세이며 재산 기준은 없습니다", kind: "guide", icon: "umbrella", year: 2026 },
      { href: "/guide/old-age-pension-age/", title: "노령연금 나이 계산기", kind: "calc", icon: "calculator", blurb: "출생연도·시작 나이 → 수급 나이와 조기·연기 지급률" },
      { href: "/guide/old-age-pension-vs-basic/", title: "노령연금 기초연금 차이 — 노령연금은 10년 이상 낸 국민연금, 재산 기준은 기초연금에만 있습니다", kind: "guide", icon: "umbrella", year: 2026 },
      { href: "/guide/daily-worker-insurance-calculator/", title: "일용직 4대보험 계산기", kind: "calc", icon: "calculator", blurb: "일당·근로일수 → 국민연금·건강·고용보험 가입 여부와 공제액" },
      { href: "/guide/daily-worker-insurance-deduction/", title: "일용직 4대보험 공제, 고용보험 0.9%부터", kind: "guide", icon: "percent", year: 2026 },
    ],
  },
  /*
   * 지방세 — 2026-09-29 신설. 여태 국세만 다뤘는데 34번(한 해 세금 허브)이
   * 빈칸을 드러냈다. 집과 차는 국세청이 아니라 시·군·구가 매긴다.
   */
  {
    id: "labor",
    title: "급여·근로",
    links: [
      { href: "/guide/payslip/", title: "급여명세서 — 월급날마다 6가지 항목을 적어 줘야 하고, 5명 미만 사업장도 같습니다", kind: "guide", icon: "document", year: 2026 },
      { href: "/guide/payslip-issue/", title: "급여명세서 발급 — 월급을 주는 날 함께, 종이나 전자문서로 줘야 합니다", kind: "guide", icon: "document", year: 2026 },
      { href: "/guide/wage-ledger/", title: "임금대장 — 근로자마다 10가지를 임금 줄 때마다 적고 3년간 보존합니다", kind: "guide", icon: "document", year: 2026 },
      { href: "/guide/weekly-holiday-pay/", title: "주휴수당 — 주 15시간 이상 일하고 그 주를 개근하면 하루치 임금을 더 받습니다", kind: "guide", icon: "wallet", year: 2026 },
      { href: "/guide/weekly-holiday-pay-calculator/", title: "주휴수당 계산기", kind: "calc", icon: "calculator", blurb: "시급·1주 근무시간 → 주휴수당·주휴 포함 시급·월 평균" },
      { href: "/guide/weekly-holiday-pay-criteria/", title: "주휴수당 조건 — 4주 평균 주 15시간 이상, 그 주 개근 두 가지면 됩니다", kind: "guide", icon: "wallet", year: 2026 },
      { href: "/guide/annual-leave-pay/", title: "연차수당 — 쓰지 못하고 넘어간 연차 하루마다 1일 통상임금을 받습니다", kind: "guide", icon: "wallet", year: 2026 },
      { href: "/guide/annual-leave-days/", title: "연차 발생기준 — 입사 첫해는 한 달 개근마다 1일, 1년 80% 출근하면 15일, 2년마다 1일씩 늘어 25일까지", kind: "guide", icon: "wallet", year: 2026 },
      { href: "/guide/annual-leave-calculator/", title: "연차 계산기", kind: "calc", icon: "calculator", blurb: "입사일·기준일 → 생긴 연차, 월급·남은 일수 → 연차수당" },
      { href: "/guide/unemployment-benefit/", title: "실업급여 — 18개월 중 180일 이상 일하고 원치 않게 그만두면 주 40시간 기준 하루 66,048~68,100원을 120~270일 받습니다", kind: "guide", icon: "wallet", year: 2026 },
      { href: "/guide/unemployment-benefit-criteria/", title: "실업급여 조건 — 18개월 중 180일 가입, 비자발적 이직, 재취업 노력이면 자진 퇴사도 받을 수 있습니다", kind: "guide", icon: "wallet", year: 2026 },
      { href: "/guide/unemployment-benefit-calculator/", title: "실업급여 계산기", kind: "calc", icon: "calculator", blurb: "월급·근무시간·나이·가입기간 → 하루 구직급여·받는 날수·총액" },
      { href: "/guide/unemployment-benefit-apply/", title: "실업급여 신청방법 — 이직 후 바로 실업 신고, 수급자격 인정, 1~4주마다 실업인정 세 단계입니다", kind: "guide", icon: "wallet", year: 2026 },
      { href: "/guide/unemployment-benefit-period/", title: "실업급여 수급기간 — 이직 다음 날부터 12개월 안에, 나이와 가입기간에 따라 120~270일 받습니다", kind: "guide", icon: "wallet", year: 2026 },
      { href: "/guide/parental-leave-pay/", title: "육아휴직급여 — 첫 3개월 월 최대 250만원, 4~6개월 200만원, 7개월째부터 160만원을 받습니다", kind: "guide", icon: "wallet", year: 2026 },
      { href: "/guide/parental-leave-pay-calculator/", title: "육아휴직 급여 계산기", kind: "calc", icon: "calculator", blurb: "월 통상임금·휴직 개월·6+6·한부모 → 달마다 받는 금액과 총액" },
      { href: "/guide/parental-leave-pay-apply/", title: "육아휴직급여 신청 — 휴직 시작 1개월 뒤부터 끝난 뒤 12개월 안에 해야 합니다", kind: "guide", icon: "wallet", year: 2026 },
      { href: "/guide/parental-leave-period/", title: "육아휴직 기간 — 1년, 부모가 각각 3개월 이상 쓰면 6개월 더해 1년 6개월입니다", kind: "guide", icon: "wallet", year: 2026 },
      { href: "/guide/maternity-leave-pay/", title: "출산휴가급여 — 90일 통상임금을 받되 고용보험은 상한 660만원, 우선지원 대상기업이 아니면 마지막 30일분만 줍니다", kind: "guide", icon: "wallet", year: 2026 },
      { href: "/guide/minimum-wage/", title: "최저임금 — 2026년 시급 10,320원, 주 40시간 월급 2,156,880원이고 5명 미만 사업장도 같습니다", kind: "guide", icon: "wallet", year: 2026 },
      { href: "/guide/minimum-wage-2027/", title: "최저임금 2027 — 시급 10,700원으로 380원(3.7%) 오르고, 주 40시간 월급은 2,236,300원입니다", kind: "guide", icon: "wallet", year: 2026 },
      { href: "/guide/minimum-wage-calculator/", title: "최저임금 계산기", kind: "calc", icon: "calculator", blurb: "월급·주 근무시간 → 환산 시급과 최저임금 위반 여부" },
      { href: "/guide/salary-take-home/", title: "연봉 실수령액 2026 — 연봉 4천만원이면 한 달 약 294만원, 5천만원이면 약 357만원입니다", kind: "guide", icon: "wallet", year: 2026 },
      { href: "/guide/monthly-take-home/", title: "월급 실수령액 — 월급 300만원이면 약 267만원, 빠지는 것은 4대보험·소득세·지방소득세입니다", kind: "guide", icon: "wallet", year: 2026 },
      { href: "/guide/take-home-calculator/", title: "연봉 실수령액 계산기", kind: "calc", icon: "calculator", blurb: "연봉·월급·가족 수 → 4대보험·소득세를 뺀 한 달 실수령액" },
      { href: "/guide/industrial-accident/", title: "산재 처리방법 — 근로자가 근로복지공단에 직접 신청하고, 일 못 한 날은 평균임금 70%를 받습니다", kind: "guide", icon: "briefcase", year: 2026 },
      { href: "/guide/industrial-accident-leave-pay/", title: "산재 휴업급여 — 평균임금의 70%, 3일 이내면 없고 평균임금이 낮으면 하루 82,560원을 보장합니다", kind: "guide", icon: "briefcase", year: 2026 },
      { href: "/guide/industrial-accident-disability/", title: "산재 장해등급 보상금 — 1급 1,474일분부터 14급 55일분까지, 평균임금에 등급별 일수를 곱합니다", kind: "guide", icon: "briefcase", year: 2026 },
      { href: "/guide/severance-pay/", title: "퇴직금 — 1일 평균임금 × 30일 × 재직일수 ÷ 365, 계속근로 1년·주 15시간 이상이면 받습니다", kind: "guide", icon: "briefcase" },
      { href: "/guide/severance-pay-criteria/", title: "퇴직금 조건 — 계속근로 1년 이상, 4주 평균 주 15시간 이상이면 5명 미만 사업장도 받습니다", kind: "guide", icon: "briefcase" },
      { href: "/guide/severance-pay-calculator/", title: "퇴직금 계산기", kind: "calc", icon: "calculator", blurb: "입사일·마지막 근무일·3개월 임금 → 퇴직금" },
      { href: "/guide/hourly-wage/", title: "시급 계산 — 일급은 시급 × 하루 시간, 주급은 주휴수당까지, 월급은 주 40시간이면 209시간을 곱합니다", kind: "guide", icon: "wallet", year: 2026 },
      { href: "/guide/hourly-wage-monthly/", title: "시급 월급 환산 — 주 40시간이면 시급 × 209시간, 그보다 적게 일하면 주휴를 넣은 주 시간 × 365 ÷ 7 ÷ 12", kind: "guide", icon: "wallet", year: 2026 },
      { href: "/guide/hourly-wage-calculator/", title: "시급 계산기", kind: "calc", icon: "calculator", blurb: "시급·하루 시간·주 일수 → 일급·주급·월급·연봉, 주휴 포함" },
      { href: "/guide/overtime-pay/", title: "야근수당 — 연장근로는 통상시급의 1.5배, 밤 10시~오전 6시는 50%를 더, 휴일 8시간을 넘기면 2배입니다", kind: "guide", icon: "wallet", year: 2026 },
      { href: "/guide/night-shift-pay/", title: "야간수당 — 밤 10시부터 오전 6시 사이에 일한 시간에 통상시급의 50%를 더 받습니다", kind: "guide", icon: "wallet", year: 2026 },
      { href: "/guide/overtime-pay-calculator/", title: "야근수당 계산기", kind: "calc", icon: "calculator", blurb: "시급·월급과 연장·야간·휴일 시간 → 가산수당과 받을 돈" },
      { href: "/guide/ordinary-wage/", title: "통상임금 — 정기적·일률적으로 주기로 정한 임금을 시간급으로 바꾼 금액이고, 주 40시간 월급은 209시간으로 나눕니다", kind: "guide", icon: "wallet", year: 2026 },
      { href: "/guide/ordinary-hourly-wage/", title: "통상시급 — 월 통상임금 ÷ 월 기준시간이고, 주 40시간이면 주휴를 넣은 209시간으로 나눕니다", kind: "guide", icon: "wallet", year: 2026 },
      { href: "/guide/ordinary-wage-calculator/", title: "통상임금 계산기", kind: "calc", icon: "calculator", blurb: "기본급·수당·상여금과 지급 주기 → 통상시급·1일 통상임금" },
    ],
  },
  {
    id: "localtax",
    title: "지방세 — 집·차",
    links: [
      { href: "/property-tax/", title: "재산세 계산기", kind: "calc", icon: "calculator", blurb: "시가표준액 → 본세·도시지역분·지방교육세를 갈라서" },
      { href: "/vehicle-tax/", title: "자동차세 계산기", kind: "calc", icon: "calculator", blurb: "배기량·차령 → 자동차세와 지방교육세" },
      { href: "/guide/property-tax/", title: "재산세 부과기준과 납부기간", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/acquisition-tax/", title: "취득세 계산기", kind: "calc", icon: "calculator", blurb: "취득가액·원인 → 취득세와 지방교육세, 신고기한까지" },
      { href: "/guide/vehicle-tax/", title: "자동차세 납부기간과 계산", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/acquisition-tax/", title: "취득세 세율과 신고기한", kind: "guide", icon: "receipt", year: 2026 },
      { href: "/guide/local-income-tax/", title: "지방소득세, 5월에 따로 냅니다", kind: "guide", icon: "coins", year: 2026 },
      { href: "/guide/comprehensive-property-tax/", title: "종합부동산세, 12월에 옵니다", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/tax-year/", title: "한 해 동안 내는 세금 정리", kind: "guide", icon: "calendar" },
      { href: "/guide/vehicle-tax-prepay/", title: "자동차세 연납, 1월에 약 4.6%", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/vehicle-tax-prepay-period/", title: "자동차세 연납 기간, 2027년은 2월 1일까지", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/vehicle-tax-prepay-discount/", title: "자동차세 연납 할인율, 5%가 아니다", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/vehicle-tax-prepay-amount/", title: "자동차세 연납 금액, 배기량별", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/vehicle-tax-prepay-how/", title: "자동차세 연납 신청 방법", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/vehicle-tax-prepay-refund/", title: "자동차세 연납 환급, 차를 팔면", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/jongbu-criteria/", title: "종부세 기준, 12억·9억원", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/jongbu-calculator/", title: "종부세 계산기, 공제·농특세까지", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/jongbu-rate/", title: "종부세 세율, 0.5%~2.7%·최고 5%", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/jongbu-payment/", title: "종부세 납부기간, 12월 1~15일", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/jongbu-joint/", title: "종부세 공동명의, 각자 9억 vs 1주택자", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/jongbu-multi-home/", title: "다주택자 종부세, 공제 9억원", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/jongbu-reform/", title: "종부세 개편, 일시적 2주택 3년→2년", kind: "guide", icon: "calendar", year: 2026 },
      { href: "/guide/apartment-acquisition-tax/", title: "아파트 취득세, 6억원 이하 1%", kind: "guide", icon: "receipt", year: 2026 },
      { href: "/guide/real-estate-acquisition-tax/", title: "부동산 취득세, 토지·상가 4.6%", kind: "guide", icon: "receipt", year: 2026 },
      { href: "/guide/officetel-acquisition-tax/", title: "오피스텔 취득세, 주거용도 4.6%", kind: "guide", icon: "receipt", year: 2026 },
      { href: "/guide/resident-tax/", title: "주민세, 개인분·사업소분·종업원분", kind: "guide", icon: "receipt", year: 2026 },
      { href: "/guide/property-tax-calc/", title: "재산세 계산, 공시가격 × 비율 × 세율", kind: "guide", icon: "home", year: 2026 },
      { href: "/guide/property-tax-payment/", title: "재산세 납부방법, 250만원 넘으면 분할", kind: "guide", icon: "home", year: 2026 },
      { href: "/guide/property-tax-basis-date/", title: "재산세 과세기준일, 6월 1일", kind: "guide", icon: "home", year: 2026 },
      { href: "/guide/electric-car-tax/", title: "전기차 세금 — 자동차세는 1년 13만원이고, 취득세 140만원·개소세 300만원 감면은 2026년 말까지입니다", kind: "guide", icon: "percent", year: 2026 },
      { href: "/guide/electric-car-tax-exemption/", title: "전기차 세금 감면 — 취득세 140만원·개별소비세 300만원, 법에 적힌 기한은 2026년 12월 31일입니다", kind: "guide", icon: "percent", year: 2026 },
      { href: "/guide/electric-car-tax-calculator/", title: "전기차 세금 계산기", kind: "calc", icon: "calculator", blurb: "차값 → 전기차 취득세 감면액과 1년 자동차세" },
      { href: "/guide/brokerage-fee/", title: "중개보수 요율표 — 주택 매매 0.4~0.7%, 전세·월세 0.3~0.6%, 2억원 미만 매매는 한도액", kind: "guide", icon: "home", year: 2026 },
      { href: "/guide/monthly-rent-brokerage-fee/", title: "월세 복비 — 보증금 + 월세 × 100, 5천만원 미만이면 70배", kind: "guide", icon: "home", year: 2026 },
      { href: "/guide/brokerage-fee-calculator/", title: "중개보수 계산기", kind: "calc", icon: "calculator", blurb: "거래금액·매매·전세·월세 → 법정 상한 복비와 부가세" },
    ],
  },
  {
    id: "inheritance",
    title: "상속·증여·양도",
    links: [
      { href: "/inheritance/", title: "상속세 계산기", kind: "calc", icon: "scale", blurb: "재산과 가족 구성을 넣으면 면제한도·과세표준·세액까지" },
      { href: "/guide/inheritance-tax/", title: "상속세 면제한도, 얼마부터 내나", kind: "guide", icon: "coins", year: 2026 },
      { href: "/guide/gift-tax/", title: "증여세 면제한도, 10년마다 다시 생깁니다", kind: "guide", icon: "refresh", year: 2026 },
      { href: "/guide/gift-property-value/", title: "부동산 증여, 공시가격으로 신고해도 되나", kind: "guide", icon: "scale", year: 2026 },
      { href: "/guide/unlisted-stock-value/", title: "비상장주식, 상속·증여할 때 1주당 얼마로 평가하나", kind: "guide", icon: "chart" },
      { href: "/guide/gift-tax-guide/", title: "증여세, 받은 사람이 3개월 안에 신고", kind: "guide", icon: "scale", year: 2026 },
      { href: "/guide/gift-tax-rate/", title: "증여세 세율, 10%~50% 상속세와 같다", kind: "guide", icon: "scale", year: 2026 },
      { href: "/guide/gift-tax-calculator/", title: "증여세 계산기, 공제·세율·3%", kind: "guide", icon: "scale", year: 2026 },
      { href: "/guide/gift-tax-filing/", title: "증여세 신고, 받은 사람이 관할 세무서에", kind: "guide", icon: "scale", year: 2026 },
      { href: "/guide/gift-tax-deadline/", title: "증여세 신고기한, 달의 말일부터 3개월", kind: "guide", icon: "scale", year: 2026 },
      { href: "/guide/gift-tax-criteria/", title: "증여세 기준, 10년 합산", kind: "guide", icon: "scale", year: 2026 },
      { href: "/guide/inheritance-tax-guide/", title: "상속세, 배우자·자녀 있으면 10억원까지 0원", kind: "guide", icon: "scale", year: 2026 },
      { href: "/guide/inheritance-tax-rate/", title: "상속세 세율, 30억원 넘으면 50%", kind: "guide", icon: "scale", year: 2026 },
      { href: "/guide/inheritance-tax-reform/", title: "상속세 개편, 아직 법이 아니다", kind: "guide", icon: "scale", year: 2026 },
      { href: "/guide/inheritance-tax-filing/", title: "상속세 신고, 6개월·3% 공제", kind: "guide", icon: "scale", year: 2026 },
      { href: "/guide/inheritance-child-deduction/", title: "상속세 자녀공제, 일괄공제 5억에 묻힌다", kind: "guide", icon: "scale", year: 2026 },
      { href: "/guide/inheritance-deduction-limit/", title: "상속세 공제한도, 사전증여만큼 준다", kind: "guide", icon: "scale", year: 2026 },
      { href: "/guide/capital-gains-tax/", title: "양도소득세, 차익에서 공제 빼고 세율", kind: "guide", icon: "scale", year: 2026 },
      { href: "/guide/capital-gains-calculator/", title: "양도세 계산기, 비과세·장특공·중과", kind: "guide", icon: "scale", year: 2026 },
      { href: "/guide/capital-gains-rate/", title: "양도소득세 세율, 2년 이상이면 6~45%", kind: "guide", icon: "scale", year: 2026 },
      { href: "/guide/capital-gains-exemption/", title: "양도세 비과세 조건, 2년 보유·12억원", kind: "guide", icon: "scale", year: 2026 },
      { href: "/guide/long-term-holding-deduction/", title: "장기보유특별공제, 최대 30%·80%", kind: "guide", icon: "scale", year: 2026 },
      { href: "/guide/two-homes-capital-gains/", title: "1가구2주택 양도세, 일시적 2주택 2년·3년", kind: "guide", icon: "scale", year: 2026 },
      { href: "/guide/multi-home-surcharge/", title: "다주택자 중과, 5월 9일로 유예 종료", kind: "guide", icon: "scale", year: 2026 },
      { href: "/guide/capital-gains-filing/", title: "양도소득세 신고, 예정신고와 확정신고", kind: "guide", icon: "scale", year: 2026 },
      { href: "/guide/capital-gains-deadline/", title: "양도세 신고기간, 달 말일부터 2개월", kind: "guide", icon: "scale", year: 2026 },
      { href: "/guide/overseas-stock-tax/", title: "해외주식 양도세, 250만원 빼고 22%", kind: "guide", icon: "scale", year: 2026 },
      { href: "/guide/stock-capital-gains/", title: "주식 양도소득세, 대주주 기준과 세율", kind: "guide", icon: "scale", year: 2026 },
      { href: "/guide/land-capital-gains-rate/", title: "토지 양도세율, 비사업용은 16~55%", kind: "guide", icon: "scale", year: 2026 },
      { href: "/guide/farmland-capital-gains/", title: "농지 양도세, 8년 자경 100% 감면", kind: "guide", icon: "scale", year: 2026 },
      { href: "/guide/child-gift-limit/", title: "자녀 증여 한도 — 성인 자녀 10년간 5천만원, 미성년 자녀 2천만원까지 세금이 없습니다", kind: "guide", icon: "scale", year: 2026 },
      { href: "/guide/child-wedding-gift/", title: "자녀 결혼자금 증여 — 혼인신고 전후 2년 안이면 1억원을 더해 1억5천만원까지 세금이 없습니다", kind: "guide", icon: "scale", year: 2026 },
      { href: "/guide/divorce-property-tax/", title: "이혼 재산분할 세금 — 양도세·증여세는 원칙적으로 없고 취득세는 1.5%, 위자료로 넘기면 양도세 대상입니다", kind: "guide", icon: "scale", year: 2026 },
      { href: "/guide/divorce-acquisition-tax/", title: "재산분할 취득세 — 무상취득 3.5%에서 2%를 뺀 1.5%, 5억원 집이면 지방교육세 포함 900만원입니다", kind: "guide", icon: "scale", year: 2026 },
      { href: "/guide/divorce-alimony-tax/", title: "위자료 세금 — 위자료로 집을 넘기면 양도세 과세대상이 되고, 재산분할로 넘기면 양도가 아닙니다", kind: "guide", icon: "scale", year: 2026 },
      { href: "/guide/family-loan/", title: "가족간 차용증 — 적정이자율 4.6%, 무이자로 빌려도 약 2억1,739만원까지는 이자 차이가 증여가 되지 않습니다", kind: "guide", icon: "scale", year: 2026 },
      { href: "/guide/family-loan-interest/", title: "가족간 차용증 이자율 — 4.6%보다 덜 낸 이자가 1년 1천만원을 넘으면 그 금액이 증여입니다", kind: "guide", icon: "scale", year: 2026 },
      { href: "/guide/family-loan-howto/", title: "차용증 쓰는법 — 법이 정한 양식은 없고, 세금 때문에 적어 둘 칸은 금액·이자율·기간입니다", kind: "guide", icon: "scale", year: 2026 },
    ],
  },
  {
    id: "money",
    title: "돈·금융",
    links: [
      { href: "/guide/loan-interest/", title: "대출이자 계산 — 남은 원금에 연 이자율의 12분의 1을 곱하고, 상환 방식에 따라 총 이자가 달라집니다", kind: "guide", icon: "chart" },
      { href: "/guide/loan-repayment-methods/", title: "원리금균등 원금균등 차이 — 매달 같은 돈과 매달 같은 원금, 총 이자는 원금균등이 적습니다", kind: "guide", icon: "chart" },
      { href: "/guide/loan-calculator/", title: "대출 이자 계산기", kind: "calc", icon: "calculator", blurb: "원금·기간·금리 → 원리금균등·원금균등·만기일시 상환표" },
      { href: "/guide/minus-account-interest/", title: "마이너스통장 이자 계산 — 쓴 금액에만, 하루 단위로 붙고 결제일에 모아서 나갑니다", kind: "guide", icon: "chart" },
      { href: "/guide/minus-account-interest-payment/", title: "마이너스통장 이자 납부일 — 지난 결제일부터 이번 결제일 전날까지의 이자가 결제일에 나갑니다", kind: "guide", icon: "chart" },
      { href: "/guide/minus-account-calculator/", title: "마이너스통장 이자 계산기", kind: "calc", icon: "calculator", blurb: "쓴 금액·금리·날수 → 결제일별 일할 이자" },
      { href: "/guide/deposit-interest/", title: "예금 이자 계산 — 원금 × 연 이자율 × 맡긴 개월 ÷ 12, 받을 때 15.4%를 뗍니다", kind: "guide", icon: "chart" },
      { href: "/guide/deposit-simple-compound/", title: "예금 단리 복리 차이 — 단리는 원금에만, 월복리는 매달 붙은 이자에도 이자가 붙습니다", kind: "guide", icon: "chart" },
      { href: "/guide/deposit-interest-calculator/", title: "예금 이자 계산기", kind: "calc", icon: "calculator", blurb: "원금·이율·개월 → 세후 이자·만기 금액" },
      { href: "/guide/dsr/", title: "DSR 계산 — 모든 대출의 한 해 원리금을 연소득으로 나눈 비율, 마이너스통장은 한도 ÷ 5년으로 셉니다", kind: "guide", icon: "coins", year: 2026 },
      { href: "/guide/dsr-limit/", title: "DSR 한도 — 총대출이 1억원을 넘으면 은행은 DSR 40% 안에서만 빌려줍니다", kind: "guide", icon: "coins", year: 2026 },
      { href: "/guide/dsr-calculator/", title: "DSR 계산기", kind: "calc", icon: "calculator", blurb: "연소득·새 대출·기존 대출 → DSR·40% 안 최대 금액" },
      { href: "/guide/installment-savings-interest/", title: "적금 이자 계산 — 매달 넣은 돈마다 남은 개월만큼만 이자가 붙고, 받을 때 15.4%를 뗍니다", kind: "guide", icon: "chart" },
      { href: "/guide/installment-savings-simple-compound/", title: "적금 단리 복리 — 단리는 회차마다 남은 개월만큼, 월복리는 붙은 이자에도 이자가 붙습니다", kind: "guide", icon: "chart" },
      { href: "/guide/installment-savings-calculator/", title: "적금 이자 계산기", kind: "calc", icon: "calculator", blurb: "월 납입액·이율·개월 → 세후 이자·만기 수령액" },
    ],
  },
  /*
   * 단위·변환 — 첫 범용 도구 묶음(설계 2절·197행). 세금·급여처럼 3편 글 시리즈가 없고
   * /tools/<slug>/ 한 페이지씩이라 글(guide)이 없을 수 있다 — 홈 글 묶음은 글 0개면 건너뛴다.
   */
  {
    id: "unit",
    title: "단위·변환",
    links: [
      { href: "/tools/percent/", title: "퍼센트 계산기", kind: "calc", icon: "percent", blurb: "몇 %인지 · % 올리고 내리기 · 변화율" },
    ],
  },
  /*
   * 날짜·시간 — 두 번째 범용 묶음. 업무일은 관공서 공휴일 목록(rates/kr-holidays-2026.json)을 쓰지만
   * 계산 자체는 달력 산술이라 /tools/ 에 둔다. 글이 없으니 홈 글 묶음에서는 건너뛴다.
   */
  {
    id: "date",
    title: "날짜·시간",
    links: [
      { href: "/tools/date-diff/", title: "날짜 계산기", kind: "calc", icon: "calendar", blurb: "두 날짜 사이 며칠 · 며칠 뒤 · 업무일" },
    ],
  },
];

/**
 * 최신 글 순서(newest first) — 홈 사이드바 "새로 올라온 글"에 쓴다.
 * 글을 추가하면 맨 앞에 href를 넣는다.
 */
export const recent: string[] = [
  "/guide/installment-savings-calculator/",
  "/guide/installment-savings-simple-compound/",
  "/guide/installment-savings-interest/",
  "/guide/daily-worker-insurance-deduction/",
  "/guide/daily-worker-insurance-calculator/",
  "/guide/ordinary-wage-calculator/",
  "/guide/ordinary-hourly-wage/",
  "/guide/ordinary-wage/",
  "/guide/overtime-pay-calculator/",
  "/guide/night-shift-pay/",
  "/guide/overtime-pay/",
  "/guide/brokerage-fee-calculator/",
  "/guide/monthly-rent-brokerage-fee/",
  "/guide/brokerage-fee/",
  "/guide/dsr-calculator/",
  "/guide/dsr-limit/",
  "/guide/dsr/",
  "/guide/hourly-wage-calculator/",
  "/guide/hourly-wage-monthly/",
  "/guide/hourly-wage/",
  "/guide/deposit-interest-calculator/",
  "/guide/deposit-simple-compound/",
  "/guide/deposit-interest/",
  "/guide/minus-account-calculator/",
  "/guide/minus-account-interest-payment/",
  "/guide/minus-account-interest/",
  "/guide/loan-calculator/",
  "/guide/loan-repayment-methods/",
  "/guide/loan-interest/",
  "/guide/severance-pay-calculator/",
  "/guide/severance-pay-criteria/",
  "/guide/severance-pay/",
  "/guide/industrial-accident-disability/",
  "/guide/industrial-accident-leave-pay/",
  "/guide/industrial-accident/",
  "/guide/family-loan-howto/",
  "/guide/family-loan-interest/",
  "/guide/family-loan/",
  "/guide/old-age-pension-vs-basic/",
  "/guide/old-age-pension-age/",
  "/guide/old-age-pension/",
  "/guide/divorce-alimony-tax/",
  "/guide/divorce-acquisition-tax/",
  "/guide/divorce-property-tax/",
  "/guide/take-home-calculator/",
  "/guide/monthly-take-home/",
  "/guide/salary-take-home/",
  "/guide/electric-car-tax-calculator/",
  "/guide/electric-car-tax-exemption/",
  "/guide/electric-car-tax/",
  "/guide/minimum-wage-calculator/",
  "/guide/minimum-wage-2027/",
  "/guide/minimum-wage/",
  "/guide/direct-purchase-customs/",
  "/guide/japan-duty-free-limit/",
  "/guide/liquor-duty-free-limit/",
  "/guide/duty-free-limit/",
  "/guide/crypto-tax-calculator/",
  "/guide/crypto-tax-delay/",
  "/guide/crypto-tax/",
  "/guide/health-dependent-registration/",
  "/guide/health-dependent-criteria/",
  "/guide/health-dependent/",
  "/guide/maternity-leave-pay/",
  "/guide/parental-leave-period/",
  "/guide/parental-leave-pay-apply/",
  "/guide/parental-leave-pay-calculator/",
  "/guide/parental-leave-pay/",
  "/guide/child-wedding-gift/",
  "/guide/child-gift-limit/",
  "/guide/basic-pension-apply/",
  "/guide/basic-pension-calculator/",
  "/guide/basic-pension-criteria/",
  "/guide/basic-pension-amount/",
  "/guide/basic-pension/",
  "/guide/unemployment-benefit-period/",
  "/guide/unemployment-benefit-apply/",
  "/guide/unemployment-benefit-calculator/",
  "/guide/unemployment-benefit-criteria/",
  "/guide/unemployment-benefit/",
  "/guide/annual-leave-calculator/",
  "/guide/annual-leave-days/",
  "/guide/annual-leave-pay/",
  "/guide/weekly-holiday-pay-criteria/",
  "/guide/weekly-holiday-pay-calculator/",
  "/guide/weekly-holiday-pay/",
  "/guide/dividend-income-tax/",
  "/guide/interest-income-tax/",
  "/guide/financial-income-tax/",
  "/guide/diligent-business/",
  "/guide/diligent-filer/",
  "/guide/wage-ledger/",
  "/guide/payslip-issue/",
  "/guide/payslip/",
  "/guide/lotto-tax-calculator/",
  "/guide/lotto-net-amount/",
  "/guide/lotto-tax/",
  "/guide/property-tax-basis-date/",
  "/guide/property-tax-payment/",
  "/guide/property-tax-calc/",
  "/guide/corporate-tax-base/",
  "/guide/corporate-tax-prepayment/",
  "/guide/corporate-tax-deadline/",
  "/guide/corporate-tax-rate/",
  "/guide/corporate-tax/",
  "/guide/corporate-business-registration/",
  "/guide/individual-business-registration/",
  "/guide/business-registration-change/",
  "/guide/business-registration-certificate/",
  "/guide/business-registration/",
  "/guide/resident-tax/",
  "/guide/officetel-acquisition-tax/",
  "/guide/real-estate-acquisition-tax/",
  "/guide/apartment-acquisition-tax/",
  "/guide/income-tax-refund-date/",
  "/guide/income-tax-refund-guide/",
  "/guide/national-tax-refund/",
  "/guide/tax-refund-lookup/",
  "/guide/payment-statement/",
  "/guide/simplified-payment-statement/",
  "/guide/daily-worker-income-report/",
  "/guide/daily-worker-tax/",
  "/guide/withholding-status-report/",
  "/guide/withholding-tax/",
  "/guide/cash-receipt/",
  "/guide/business-closure/",
  "/guide/simplified-taxpayer-criteria/",
  "/guide/e-tax-invoice/",
  "/guide/tax-invoice-how/",
  "/guide/business-income-tax/",
  "/guide/other-income-tax-rate/",
  "/guide/comprehensive-tax-base/",
  "/guide/tax-base/",
  "/guide/earned-income-tax/",
  "/guide/earned-income-tax-rate/",
  "/guide/income-tax-brackets/",
  "/guide/pension-termination/",
  "/guide/pension-mid-withdrawal/",
  "/guide/dc-pension/",
  "/guide/pension-income-tax/",
  "/guide/pension-receipt-method/",
  "/guide/severance-irp/",
  "/guide/severance-interim-settlement/",
  "/guide/severance-pay-deadline/",
  "/guide/severance-tax-calculator/",
  "/guide/severance-tax/",
  "/guide/health-insurance-refund/",
  "/guide/daily-worker-insurance/",
  "/guide/four-insurance-eligibility/",
  "/guide/employment-insurance-premium/",
  "/guide/long-term-care-premium/",
  "/guide/regional-health-insurance/",
  "/guide/health-insurance-premium/",
  "/guide/four-insurance-rate/",
  "/guide/four-insurance-calculator/",
  "/guide/four-insurance/",
  "/guide/farmland-capital-gains/",
  "/guide/land-capital-gains-rate/",
  "/guide/stock-capital-gains/",
  "/guide/overseas-stock-tax/",
  "/guide/capital-gains-deadline/",
  "/guide/capital-gains-filing/",
  "/guide/multi-home-surcharge/",
  "/guide/two-homes-capital-gains/",
  "/guide/long-term-holding-deduction/",
  "/guide/capital-gains-exemption/",
  "/guide/capital-gains-rate/",
  "/guide/capital-gains-calculator/",
  "/guide/capital-gains-tax/",
  "/guide/inheritance-deduction-limit/",
  "/guide/inheritance-child-deduction/",
  "/guide/inheritance-tax-filing/",
  "/guide/inheritance-tax-reform/",
  "/guide/inheritance-tax-rate/",
  "/guide/inheritance-tax-guide/",
  "/guide/gift-tax-criteria/",
  "/guide/gift-tax-deadline/",
  "/guide/gift-tax-filing/",
  "/guide/gift-tax-calculator/",
  "/guide/gift-tax-rate/",
  "/guide/gift-tax-guide/",
  "/guide/donation-credit-business/",
  "/guide/donation-credit-standard/",
  "/guide/donation-credit-carryover/",
  "/guide/religious-donation-credit/",
  "/guide/hometown-donation-credit/",
  "/guide/donation-credit-rate/",
  "/guide/donation-credit-limit/",
  "/guide/donation-credit/",
  "/guide/education-credit-student-loan/",
  "/guide/education-credit-academy/",
  "/guide/education-credit-income/",
  "/guide/education-credit-limit/",
  "/guide/education-credit/",
  "/guide/medical-credit-glasses/",
  "/guide/medical-credit-insurance/",
  "/guide/medical-credit-pooling/",
  "/guide/medical-credit-eligibility/",
  "/guide/medical-credit-limit/",
  "/guide/medical-credit/",
  "/guide/jongbu-reform/",
  "/guide/jongbu-multi-home/",
  "/guide/jongbu-joint/",
  "/guide/jongbu-payment/",
  "/guide/jongbu-rate/",
  "/guide/jongbu-calculator/",
  "/guide/jongbu-criteria/",
  "/guide/earned-incentive-pay-date/",
  "/guide/earned-incentive-half-year/",
  "/guide/earned-incentive-apply/",
  "/guide/earned-incentive-amount/",
  "/guide/earned-incentive-eligibility/",
  "/guide/earned-incentive/",
  "/guide/child-incentive-pay-date/",
  "/guide/child-incentive-apply/",
  "/guide/child-incentive-eligibility/",
  "/guide/child-incentive-amount/",
  "/guide/child-incentive/",
  "/guide/year-end-child-tax-credit/",
  "/guide/year-end-correction/",
  "/guide/year-end-extra-tax/",
  "/guide/year-end-refund-unpaid/",
  "/guide/year-end-refund-amount/",
  "/guide/year-end-refund-how/",
  "/guide/year-end-refund-date/",
  "/guide/year-end-rent-credit/",
  "/guide/year-end-card-deduction/",
  "/guide/year-end-personal-deduction/",
  "/guide/year-end-income-deduction/",
  "/guide/year-end-calculator/",
  "/guide/year-end-simplified/",
  "/guide/year-end-tax/",
  "/guide/withholding-receipt-vs-income-certificate/",
  "/guide/withholding-receipt-read/",
  "/guide/withholding-receipt-issue/",
  "/guide/severance-withholding-receipt/",
  "/guide/business-income-withholding-receipt/",
  "/guide/earned-income-withholding-receipt/",
  "/guide/withholding-receipt/",
  "/guide/vehicle-tax-prepay-refund/",
  "/guide/vehicle-tax-prepay-how/",
  "/guide/vehicle-tax-prepay-amount/",
  "/guide/vehicle-tax-prepay-discount/",
  "/guide/vehicle-tax-prepay-period/",
  "/guide/vehicle-tax-prepay/",
  "/guide/closing-vat-final-return/",
  "/guide/vat-e-filing-credit/",
  "/guide/vat-final-return-refund/",
  "/guide/vat-final-return-payment/",
  "/guide/vat-final-return-how/",
  "/guide/corporate-vat-final-return/",
  "/guide/individual-vat-final-return/",
  "/guide/simplified-vat-final-return/",
  "/guide/vat-final-return-second-half/",
  "/guide/vat-final-return-first-half/",
  "/guide/vat-final-return-period/",
  "/guide/vat-final-return/",
  "/guide/irp-tax-credit-vs-deduction/",
  "/guide/personal-irp-tax-credit/",
  "/guide/irp-tax-credit-downsides/",
  "/guide/irp-cancellation-tax/",
  "/guide/irp-tax-credit-carryover/",
  "/guide/irp-tax-credit-refund/",
  "/guide/irp-tax-credit-how-to-claim/",
  "/guide/irp-tax-credit-deposit/",
  "/guide/irp-tax-credit-deadline/",
  "/guide/irp-tax-credit-calculator/",
  "/guide/irp-tax-credit-rate/",
  "/guide/irp-tax-credit-3-million/",
  "/guide/irp-tax-credit-9-million/",
  "/guide/irp-tax-credit-limit/",
  "/guide/irp-tax-credit-eligibility/",
  "/guide/irp-tax-credit/",
  "/guide/tax-invoice-early-issue/",
  "/guide/tax-invoice-vs-statement/",
  "/guide/tax-invoice-cancel/",
  "/guide/simplified-tax-invoice/",
  "/guide/tax-invoice-date/",
  "/guide/comprehensive-property-tax/",
  "/guide/local-income-tax/",
  "/guide/year-end-settlement/",
  "/acquisition-tax/",
  "/guide/acquisition-tax/",
  "/vehicle-tax/",
  "/guide/vehicle-tax/",
  "/property-tax/",
  "/guide/property-tax/",
  "/guide/tax-year/",
  "/guide/income-prepayment/",
  "/guide/vat-prepayment/",
  "/guide/unlisted-stock-value/",
  "/guide/retirement-pension-loan/",
  "/guide/gift-property-value/",
  "/guide/late-filing-refund/",
  "/guide/gift-tax/",
  "/guide/inheritance-tax/",
  "/guide/vat-penalty/",
  "/guide/family-deduction/",
  "/guide/multiple-payers/",
  "/guide/late-filing-penalty/",
  "/guide/pension-premium-2026/",
  "/guide/vat-filing/",
  "/national-pension-premium/",
  "/guide/simplified-vat/",
  "/guide/vat-freelancer/",
  "/guide/who-must-file/",
  "/guide/retirement-fund/",
];

/** 경로 정규화 — 뒤 슬래시 유무를 흡수한다. */
function norm(path: string): string {
  const p = path.split("?")[0].split("#")[0];
  return p.endsWith("/") ? p : p + "/";
}

/** href로 링크와 그 클러스터 색·id를 찾는다(홈 카드·최신글용). */
export function linkByHref(href: string):
  | { link: ClusterLink; clusterId: string; color: { bg: string; wm: string; ink: string; mark: string } }
  | null {
  const here = norm(href);
  for (const c of clusters) {
    const link = c.links.find((l) => norm(l.href) === here);
    if (link) return { link, clusterId: c.id, color: clusterColor[c.id] };
  }
  return null;
}

/**
 * 주어진 경로가 속한 클러스터에서, 현재 글을 뺀 나머지 링크를 돌려준다.
 * 어느 클러스터에도 없으면 null.
 */
export function relatedFor(
  path: string,
): { title: string; links: ClusterLink[] } | null {
  const here = norm(path);
  const cluster = clusters.find((c) =>
    c.links.some((l) => norm(l.href) === here),
  );
  if (!cluster) return null;
  const links = cluster.links.filter((l) => norm(l.href) !== here);
  if (links.length === 0) return null;
  return { title: cluster.title, links };
}

/**
 * 주어진 경로의 썸네일 정보(클러스터 라벨·색·아이콘). 클러스터에 없으면 null.
 */
export function thumbFor(path: string): {
  clusterTitle: string;
  icon: string;
  color: { bg: string; wm: string; ink: string; mark: string };
} | null {
  const here = norm(path);
  const cluster = clusters.find((c) =>
    c.links.some((l) => norm(l.href) === here),
  );
  if (!cluster) return null;
  const link = cluster.links.find((l) => norm(l.href) === here)!;
  return {
    clusterTitle: cluster.title,
    icon: link.icon,
    color: clusterColor[cluster.id],
  };
}

export interface NextRead {
  link: ClusterLink;
  clusterId: string;
  clusterTitle: string;
  /** 지금 글과 다른 주제인가 — 화면에서 "다른 주제" 배지로 구분한다. */
  crossCluster: boolean;
}

/**
 * 본문을 다 읽은 사람에게 다음에 볼 것을 고른다.
 *
 * 사이드바(relatedFor)는 같은 클러스터를 전부 나열하지만, 글 끝에서 필요한
 * 건 "다음 한 걸음"이다. 그래서 세 자리를 정해두고 채운다.
 *
 *   1. 같은 주제의 다음 글  — 순환하므로 마지막 글에서도 비지 않는다
 *   2. 같은 주제의 계산기    — 읽고 나면 자기 숫자를 넣어보게 된다
 *   3. 다른 주제의 글        — 이게 없으면 독자가 한 클러스터에 갇힌다
 *
 * 무작위를 쓰지 않는다. 글마다 다른 곳을 가리키되 같은 글은 늘 같은 곳을
 * 가리켜야 테스트할 수 있고, 정적 빌드에서도 결과가 흔들리지 않는다.
 */
export function nextReads(path: string, limit = 3): NextRead[] {
  const here = norm(path);
  const ci = clusters.findIndex((c) =>
    c.links.some((l) => norm(l.href) === here),
  );
  if (ci < 0) return [];

  const cluster = clusters[ci];
  const idx = cluster.links.findIndex((l) => norm(l.href) === here);

  const out: NextRead[] = [];
  const seen = new Set<string>([here]);
  const push = (link: ClusterLink, c: Cluster) => {
    const key = norm(link.href);
    if (seen.has(key) || out.length >= limit) return;
    seen.add(key);
    out.push({
      link,
      clusterId: c.id,
      clusterTitle: c.title,
      crossCluster: c.id !== cluster.id,
    });
  };

  // 1) 같은 주제의 다음 글 (순환)
  //
  // links 배열 순서 그대로 앞으로 돈다. clusters 는 계산기 바로 뒤에 그
  // 계산기를 설명하는 글을 두는 식으로 짜여 있어서(penalty → 
  // late-filing-penalty), 앞에서부터 도는 것만으로 가장 가까운 글이 잡힌다.
  //
  // 예전에는 guide 만 걸러낸 배열에서 위치를 찾았다. 계산기는 그 배열에
  // 없으니 findIndex 가 -1 이 되고, (-1+1)%n = 0 이라 언제나 클러스터의
  // 첫 글이 나왔다 — 가산세 계산기가 3.3% 글을 권하고 있었다.
  const n = cluster.links.length;
  for (let k = 1; k <= n && out.length < 1; k++) {
    const l = cluster.links[(idx + k) % n];
    if (l.kind === "guide") push(l, cluster);
  }

  // 2) 같은 주제의 계산기
  const calc = cluster.links.find((l) => l.kind === "calc");
  if (calc) push(calc, cluster);

  // 3) 다른 주제의 글 — 시작점을 현재 위치로 돌려 글마다 달라지게 한다
  for (let k = 1; k < clusters.length && out.length < limit; k++) {
    const other = clusters[(ci + k) % clusters.length];
    const pick = other.links.filter((l) => l.kind === "guide");
    if (pick.length > 0) {
      push(pick[(Math.max(idx, 0) + k) % pick.length], other);
    }
  }

  // 4) 그래도 모자라면 같은 주제에서 채운다
  for (const l of cluster.links) {
    if (out.length >= limit) break;
    push(l, cluster);
  }

  return out;
}
