/**
 * 계산기 '자주 넣는 금액' 버튼 — 금액은 그 계산기의 자동완성에 붙어 나오는 금액만(설계 3-6, 지어내지 않음).
 * source 의 키워드 중 term 이 들어간 줄에 그 금액(만원 단위 숫자 또는 N억)이 있어야 한다(calc-ui.test.ts).
 * 키: 페이지 주소 → 세트 이름(선택 값). 세트가 하나뿐이면 "default".
 */
export interface PresetSet {
  amounts: number[];
  source: string;
  term: string;
}

export const calcPresets: Record<string, Record<string, PresetSet>> = {
  "/guide/take-home-calculator/": {
    annual: { amounts: [36_000_000, 40_000_000, 50_000_000, 100_000_000], source: "keywords/ac-pool-2026-10-14-all.csv", term: "연봉 실수령액" },
    monthly: { amounts: [3_000_000, 4_000_000, 5_000_000], source: "keywords/ac-pool-2026-10-14-all.csv", term: "월급 실수령액" },
  },
  "/freelancer-33/": {
    default: { amounts: [1_000_000, 2_000_000, 3_000_000], source: "keywords/ac-33-2026-10-17.csv", term: "3.3" },
  },
  "/acquisition-tax/": {
    // 네이버 자동완성 '3억 아파트 취득세'·'4억 아파트 취득세'·'6억 아파트 취득세'·'취득세 7억 세율 구하는 법'(2026-10-18). '취득세 9억미만'은 기준선을 묻는 말이라 뺌
    default: { amounts: [300_000_000, 400_000_000, 600_000_000, 700_000_000], source: "keywords/ac-acquisition-2026-10-18.csv", term: "취득세" },
  },
  "/guide/lotto-tax-calculator/": {
    // 네이버 자동완성 '로또 실수령액 20억'·'30억 로또 실수령액'(2026-10-18). '로또 1억 세금' 은 시드 줄뿐(확장 아님)이라 뺌
    default: { amounts: [2_000_000_000, 3_000_000_000], source: "keywords/ac-lotto-2026-10-18.csv", term: "로또 실수령액" },
  },
  "/property-tax/": {
    // 네이버 자동완성 '3억 아파트 재산세'·'5억 아파트 재산세'·'15억 아파트 재산세'·'20억 아파트 재산세'·'30억 아파트 재산세'(2026-10-18)
    default: { amounts: [300_000_000, 500_000_000, 1_500_000_000, 2_000_000_000, 3_000_000_000], source: "keywords/ac-property-tax-2026-10-18.csv", term: "재산세" },
  },
  "/withholding/": {
    // 사업소득은 3.3% 계산기와 같은 자동완성. 기타소득 8.8% 는 자동완성에 금액이 붙어 나오지 않아(2026-10-17 네이버 '8.8'·'100만원 8.8' 등) 버튼 없음
    business: { amounts: [1_000_000, 2_000_000, 3_000_000], source: "keywords/ac-33-2026-10-17.csv", term: "3.3" },
  },
  "/vat/": {
    // 네이버 자동완성 '50만원 부가세 포함 계산'·'100만원 부가세포함 금액'·'200만원 부가세 포함'(2026-10-17). 간이과세(연 매출)는 금액이 안 붙어 버튼 없음
    supply: { amounts: [500_000, 1_000_000, 2_000_000], source: "keywords/ac-vat-2026-10-17.csv", term: "부가세" },
    total: { amounts: [500_000, 1_000_000, 2_000_000], source: "keywords/ac-vat-2026-10-17.csv", term: "부가세" },
  },
  "/income-tax-refund/": {
    // 네이버 자동완성 '종합소득세 1000만원'·'2000만원'·'3000만원'·'5000만원'(2026-10-17)
    default: { amounts: [10_000_000, 20_000_000, 30_000_000, 50_000_000], source: "keywords/ac-income-tax-2026-10-17.csv", term: "종합소득세" },
  },
  "/guide/four-insurance-calculator/": {
    // 네이버 자동완성 '200만원 4대보험 계산'·'300만원 4대보험 세금'·'4대보험 300만원 세금'(2026-10-17). 250·350·400만은 결과 없음
    default: { amounts: [2_000_000, 3_000_000], source: "keywords/ac-four-insurance-2026-10-17.csv", term: "4대보험" },
  },
  "/guide/irp-tax-credit-calculator/": {
    // 네이버 자동완성 '연금저축 300만원 세액공제'·'연금저축 600만원 세액공제'·'irp 300만원'·'irp 900만원 세액공제'(2026-10-17)
    savings: { amounts: [3_000_000, 6_000_000], source: "keywords/ac-irp-credit-2026-10-17.csv", term: "연금저축" },
    irp: { amounts: [3_000_000, 9_000_000], source: "keywords/ac-irp-credit-2026-10-17.csv", term: "irp" },
  },
  "/guide/basic-pension-calculator/": {
    // 네이버 자동완성 '기초연금 예금 1억'·'기초연금 예금 2억'(2026-10-17). '기초연금 재산 3억'·'기초연금 집 3억'·'기초연금 월 100만원' 은 줄기 없음
    financial: { amounts: [100_000_000, 200_000_000], source: "keywords/ac-basic-pension-2026-10-17.csv", term: "기초연금 예금" },
  },
  "/guide/year-end-calculator/": {
    // 네이버 자동완성 '연봉 3000 연말정산 환급'·'연봉 4000 연말정산 환급'(2026-10-17). '연봉 5000·6000 연말정산'·'총급여 5000 연말정산' 은 줄기 없음, '연말정산 1억 환급' 은 금액 뜻이 갈려 뺌
    default: { amounts: [30_000_000, 40_000_000], source: "keywords/ac-year-end-2026-10-17.csv", term: "연말정산 환급" },
  },
  "/guide/family-loan-interest/": {
    // 네이버 자동완성 '차용증 5억'·'가족간 차용증 1억 원금상환방법'(2026-10-18). '차용증 1억·2억·3억'·'가족간 차용증 2억·3억·5억'·'차용증 이자 1억·2억' 시드는 결과 없음
    default: { amounts: [100_000_000, 500_000_000], source: "keywords/ac-family-loan-2026-10-18.csv", term: "차용증" },
  },
  "/guide/gift-tax-calculator/": {
    // 네이버 자동완성 '증여세 계산기 1억·2억·3억·4억·10억'(2026-09-16)
    default: { amounts: [100_000_000, 200_000_000, 300_000_000, 400_000_000, 1_000_000_000], source: "keywords/gift-autocomplete-2026-09-16.csv", term: "증여세 계산기" },
  },
  "/inheritance/": {
    // 네이버 자동완성 '상속세 계산기 1억·2억·5억·10억·20억'(2026-09-16)
    default: { amounts: [100_000_000, 200_000_000, 500_000_000, 1_000_000_000, 2_000_000_000], source: "keywords/inheritance-autocomplete-2026-09-16.csv", term: "상속세 계산기" },
  },
  "/guide/parental-leave-pay-calculator/": {
    // 네이버 자동완성 '육아휴직 급여 150만원'·'육아휴직 급여 250만원'(2026-10-17). '육아휴직 200·300'·'월급 300 육아휴직' 은 줄기 없음
    default: { amounts: [1_500_000, 2_500_000], source: "keywords/ac-parental-leave-2026-10-17.csv", term: "육아휴직 급여" },
  },
};
