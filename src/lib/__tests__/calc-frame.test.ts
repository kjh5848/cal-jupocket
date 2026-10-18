/**
 * 리브랜딩 Task 8 — 계산기마다 새 틀(두 칸·비율 막대·소계·자동완성 프리셋)로 옮겼는지.
 * 루틴 한 회차에 한 줄씩 늘린다. 옮긴 계산기는 docs/calc-benchmark.md 에도 한 행이 있어야 한다.
 */
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { calcPresets } from "../../data/calc-presets";

const MOVED: { path: string; attrs: string[] }[] = [
  { path: "/guide/dsr-calculator/", attrs: ["data-two", "data-won", "data-seg", "data-step", "data-receipt", "data-group", "data-bar", "data-dock"] },
  { path: "/guide/brokerage-fee-calculator/", attrs: ["data-two", "data-won", "data-seg", "data-step", "data-receipt", "data-group", "data-bar", "data-dock"] },
  { path: "/guide/minus-account-calculator/", attrs: ["data-two", "data-won", "data-presets", "data-step", "data-receipt", "data-group", "data-bar", "data-dock"] },
  { path: "/guide/hourly-wage-calculator/", attrs: ["data-two", "data-won", "data-seg", "data-step", "data-receipt", "data-group", "data-bar", "data-dock"] },
  { path: "/guide/deposit-interest-calculator/", attrs: ["data-two", "data-won", "data-presets", "data-seg", "data-step", "data-receipt", "data-group", "data-bar", "data-dock"] },
  { path: "/guide/loan-calculator/", attrs: ["data-two", "data-won", "data-presets", "data-seg", "data-step", "data-receipt", "data-group", "data-bar", "data-dock"] },
  { path: "/guide/severance-pay-calculator/", attrs: ["data-two", "data-won", "data-seg", "data-receipt", "data-group", "data-dock"] },
  { path: "/guide/lotto-tax-calculator/", attrs: ["data-two", "data-won", "data-presets", "data-receipt", "data-group", "data-bar", "data-dock"] },
  { path: "/guide/crypto-tax-calculator/", attrs: ["data-two", "data-won", "data-receipt", "data-group", "data-bar", "data-dock"] },
  { path: "/guide/electric-car-tax-calculator/", attrs: ["data-two", "data-won", "data-seg", "data-receipt", "data-group", "data-bar", "data-dock"] },
  { path: "/vehicle-tax/", attrs: ["data-two", "data-step", "data-seg", "data-receipt", "data-group", "data-bar", "data-dock"] },
  { path: "/guide/jongbu-calculator/", attrs: ["data-two", "data-won", "data-step", "data-seg", "data-receipt", "data-group", "data-bar", "data-dock"] },
  { path: "/acquisition-tax/", attrs: ["data-two", "data-won", "data-presets", "data-step", "data-receipt", "data-group", "data-bar", "data-dock"] },
  { path: "/guide/capital-gains-calculator/", attrs: ["data-two", "data-won", "data-step", "data-seg", "data-receipt", "data-group", "data-bar", "data-dock"] },
  { path: "/guide/divorce-acquisition-tax/", attrs: ["data-two", "data-won", "data-receipt", "data-group", "data-bar", "data-dock"] },
  { path: "/guide/family-loan-interest/", attrs: ["data-two", "data-won", "data-presets", "data-seg", "data-receipt", "data-group", "data-bar", "data-dock"] },
  { path: "/guide/gift-tax-calculator/", attrs: ["data-two", "data-won", "data-presets", "data-receipt", "data-group", "data-bar", "data-dock"] },
  { path: "/property-tax/", attrs: ["data-two", "data-won", "data-presets", "data-receipt", "data-group", "data-bar", "data-dock"] },
  { path: "/inheritance/", attrs: ["data-two", "data-won", "data-presets", "data-step", "data-seg", "data-receipt", "data-group", "data-bar", "data-dock"] },
  { path: "/freelancer-33/", attrs: ["data-two", "data-seg", "data-won", "data-presets", "data-receipt", "data-group", "data-bar", "data-dock"] },
  { path: "/withholding/", attrs: ["data-two", "data-seg", "data-won", "data-presets", "data-receipt", "data-group", "data-bar", "data-dock"] },
  { path: "/vat/", attrs: ["data-two", "data-seg", "data-won", "data-presets", "data-receipt", "data-bar", "data-dock"] },
  { path: "/income-tax-refund/", attrs: ["data-two", "data-won", "data-presets", "data-step", "data-receipt", "data-group", "data-bar", "data-dock"] },
  { path: "/penalty/", attrs: ["data-two", "data-won", "data-receipt", "data-group", "data-bar", "data-dock"] },
  { path: "/national-pension-premium/", attrs: ["data-two", "data-won", "data-receipt", "data-group", "data-bar", "data-dock"] },
  { path: "/guide/four-insurance-calculator/", attrs: ["data-two", "data-won", "data-presets", "data-receipt", "data-group", "data-bar", "data-dock"] },
  { path: "/guide/weekly-holiday-pay-calculator/", attrs: ["data-two", "data-won", "data-step", "data-receipt", "data-group", "data-bar", "data-dock"] },
  { path: "/guide/minimum-wage-calculator/", attrs: ["data-two", "data-won", "data-step", "data-seg", "data-receipt", "data-group", "data-bar", "data-dock"] },
  { path: "/guide/annual-leave-calculator/", attrs: ["data-two", "data-won", "data-step", "data-seg", "data-receipt", "data-dock"] },
  { path: "/guide/unemployment-benefit-calculator/", attrs: ["data-two", "data-won", "data-step", "data-seg", "data-receipt", "data-group", "data-bar", "data-dock"] },
  { path: "/guide/parental-leave-pay-calculator/", attrs: ["data-two", "data-won", "data-presets", "data-step", "data-seg", "data-receipt", "data-group", "data-bar", "data-dock"] },
  { path: "/guide/severance-tax-calculator/", attrs: ["data-two", "data-won", "data-step", "data-receipt", "data-group", "data-bar", "data-dock"] },
  { path: "/guide/year-end-calculator/", attrs: ["data-two", "data-won", "data-presets", "data-step", "data-receipt", "data-group", "data-bar", "data-dock"] },
  { path: "/guide/industrial-accident-disability/", attrs: ["data-two", "data-won", "data-receipt", "data-group", "data-bar", "data-dock"] },
  { path: "/guide/industrial-accident-leave-pay/", attrs: ["data-two", "data-won", "data-step", "data-receipt", "data-group", "data-bar", "data-dock"] },
  { path: "/guide/old-age-pension-age/", attrs: ["data-two", "data-step", "data-receipt", "data-dock"] },
  { path: "/guide/basic-pension-calculator/", attrs: ["data-two", "data-won", "data-presets", "data-seg", "data-receipt", "data-group", "data-bar", "data-dock"] },
  { path: "/guide/child-incentive-amount/", attrs: ["data-two", "data-won", "data-step", "data-seg", "data-receipt", "data-group", "data-bar", "data-dock"] },
  { path: "/guide/earned-incentive-amount/", attrs: ["data-two", "data-won", "data-seg", "data-receipt", "data-group", "data-bar", "data-dock"] },
  { path: "/guide/medical-credit-limit/", attrs: ["data-two", "data-won", "data-receipt", "data-group", "data-bar", "data-dock"] },
  { path: "/guide/irp-tax-credit-calculator/", attrs:["data-two", "data-won", "data-presets", "data-seg", "data-receipt", "data-group", "data-bar", "data-dock"] },
];

/**
 * 자동완성에 금액이 붙어 나오지 않아 '자주 넣는 금액' 버튼이 없는 계산기 — 금액은 지어내지 않는다.
 * /penalty/: 네이버 '가산세 1'·'무신고가산세 1'·'기한후신고 가산세 1'·'종합소득세 가산세 1' 등 결과 없음(2026-10-17, keywords/ac-penalty-2026-10-17.csv)
 * /national-pension-premium/: 네이버 '국민연금 보험료 1·2·3·5'·'지역가입자 국민연금 1·2·3'·'국민연금 100만원·200만원·300만원' 결과 없음(2026-10-17, keywords/ac-pension-premium-2026-10-17.csv)
 * /guide/weekly-holiday-pay-calculator/: 네이버 '주휴수당 1'·'주휴수당 시급 1'·'시급 1 주휴수당'·'주휴수당 계산 1' 에 시급 금액 줄기 없음 — 시간('15시간')만 나옴(2026-10-17, keywords/ac-weekly-holiday-2026-10-17.csv). 2026·2027 최저시급 버튼은 고시 금액이라 그대로 둔다
 * /guide/minimum-wage-calculator/: 네이버 '최저임금 월급 1·2'·'월급 200만원 최저임금'·'월급 시급 환산 1'·'최저임금 계산 1' 에 금액 줄기 없음 — 연도('2026'·'2027')만 나옴(2026-10-17, keywords/ac-minimum-wage-2026-10-17.csv)
 * /guide/severance-pay-calculator/: 네이버 '퇴직금 월급 1·2·3'·'월급 250·300 퇴직금'·'연봉 3000·4000 퇴직금'·'퇴직금 계산 1' 결과 없음(2026-10-18, keywords/ac-severance-pay-2026-10-18.csv)
 * /guide/annual-leave-calculator/: 네이버 '연차수당 월급 1·2·3'·'월급 300 연차수당'·'연차 계산 1'·'연차수당 계산 1' 결과 없음(2026-10-17, keywords/ac-annual-leave-2026-10-17.csv)
 * /guide/unemployment-benefit-calculator/: 네이버 '실업급여 1·2·3' 은 일수('180일'·'210일')·회차('1차')만, '실업급여 200·300'·'200만원 실업급여'·'월급 300 실업급여'·'실업급여 월급'·'실업급여 계산기 월급' 결과 없음(2026-10-17, keywords/ac-unemployment-2026-10-17.csv)
 * /guide/severance-tax-calculator/: 네이버 '퇴직금 세금'·'퇴직소득세'·'퇴직금 1억·2억·3천만원·5천만원 세금' 에서 금액 줄기는 '퇴직금 1억 세금 계산기 방법' 하나 — 기본값 1억과 같아 버튼 없음(2026-10-17, keywords/ac-severance-tax-2026-10-17.csv)
 * /guide/earned-incentive-amount/: 네이버 '근로장려금 1000만원·2000만원'·'연봉 2000 근로장려금'·'월급 150 근로장려금'·'근로장려금 연봉' 결과 없음, '근로장려금 금액·지급액' 확장은 금액표·산정표·구간·조회뿐(2026-10-17, keywords/ac-earned-incentive-2026-10-17.csv)
 * /guide/child-incentive-amount/: 네이버 '자녀장려금 3000만원'·'자녀장려금 연봉'·'연봉 4000 자녀장려금'·'자녀장려금 자녀 2명' 결과 없음, '자녀장려금 금액·지급액' 확장은 기준·산정표·지급일·조회뿐(2026-10-17, keywords/ac-child-incentive-2026-10-17.csv)
 * /guide/medical-credit-limit/: 네이버 '의료비 세액공제'·'의료비 세액공제 한도·계산·연봉'·'연봉 의료비 세액공제'·'총급여 3% 의료비'·'의료비 3%' 에 금액 줄기 없음, '연봉 3000·4000·5000 의료비'·'의료비 100만원·500만원·700만원' 결과 없음(2026-10-17, keywords/ac-medical-credit-2026-10-17.csv)
 * /guide/old-age-pension-age/: 금액 입력 칸 없음(출생연도·나이만)
 * /guide/dsr-calculator/: 네이버 'DSR 계산기'·'DSR 계산'·'DSR'·'스트레스 DSR'·'연봉 DSR' 확장은 40%·규제·한도·뜻·마통·부부합산·주담대·신용·전세·1~3단계뿐, 연봉·대출 금액 줄기 없음(2026-10-18, keywords/ac-dsr-2026-10-18.csv)
 * /guide/brokerage-fee-calculator/: 네이버 '중개보수'·'중개보수 계산기'·'복비'·'복비 계산기'·'부동산 중개수수료' 확장은 요율표·뜻·월세·전세·부가세·아파트·원룸·상가·청년 지원뿐, 금액 줄기 없음(2026-10-18, keywords/ac-brokerage-fee-2026-10-18.csv)
 * /guide/crypto-tax-calculator/: 네이버 '코인 세금'·'가상자산 세금'·'코인 과세'·'비트코인 세금'·'코인 세금 계산' 확장은 유예·폐지·법안·신고·기준·계산기뿐, 금액 시드 '코인 1억 세금' 은 확장 0건(시드 줄로만 남음)(2026-10-18, keywords/ac-crypto-2026-10-18.csv)
 * /guide/electric-car-tax-calculator/: 네이버 '전기차 취득세'·'전기차 세금'·'전기차 자동차세'·'전기차 취득세 계산' 확장은 감면·2027·계산기·연납·기준뿐, 금액 시드 '전기차 4000만원 취득세'·'5000만원 취득세' 는 확장 0건(시드 줄로만 남음)(2026-10-18, keywords/ac-electric-car-2026-10-18.csv)
 * /vehicle-tax/: 금액 입력 칸 없음(배기량 cc·기산 연도) — cc 버튼 1,598·1,601 은 1,600cc 경계를 보여 주는 예시라 돈 프리셋이 아님
 * /guide/jongbu-calculator/: 네이버 '종부세 계산기'·'종부세'·'종합부동산세 계산'·'종부세 1주택'·'종부세 1·2'·'아파트 종부세' 확장에 금액 줄기 없음, '공시가격 20억 종부세' 는 자기 자신만 — 기본값 20억과 같아 버튼 없음('종부세 12억 유지'는 공제 기준)(2026-10-18, keywords/ac-jongbu-2026-10-18.csv)
 * /guide/capital-gains-calculator/: 네이버 '양도세 1억·2억·3억·5억' 확장은 '1억5천'·'1억이상'·'2억할부로 내는법', '양도차익 1억 세금'·'양도차익 2억 양도세' — 금액이 양도차익(또는 뜻이 갈림)이라 판 값·산 값 칸에 넣을 금액이 아니다(2026-10-18, keywords/ac-capital-gains-2026-10-18.csv)
 * /guide/divorce-acquisition-tax/: 네이버 '재산분할 취득세'·'이혼 재산분할 취득세'·'이혼 취득세'·'재산분할 부동산 취득세'·'협의이혼 취득세'·'재산분할 취득세율' 확장은 '신고 방법'·'감면'뿐, 금액 줄기 없음(2026-10-18, keywords/ac-divorce-acq-2026-10-18.csv)
 * /guide/industrial-accident-disability/: 네이버 '산재 장해등급'·'장해등급 보상금'·'산재 장해급여'·'장해보상연금'·'장해등급 14급 보상금' 확장은 등급(7·10·12·14급)·금액·보상표·계산법·신청·세금뿐, 평균임금 금액 줄기 없음(2026-10-17, keywords/ac-industrial-disability-2026-10-17.csv)
 * /guide/industrial-accident-leave-pay/: 네이버 '월급 300 산재'·'산재 휴업급여 월급' 결과 없음, '산재 휴업급여·휴업급여 계산·산재 평균임금' 확장은 계산 방법·일수·기간·신청·지급일·상한선뿐(2026-10-17, keywords/ac-industrial-leave-2026-10-17.csv)
 */
const NO_PRESETS = new Set(["/guide/severance-pay-calculator/", "/guide/crypto-tax-calculator/", "/guide/electric-car-tax-calculator/", "/vehicle-tax/", "/guide/jongbu-calculator/", "/guide/capital-gains-calculator/", "/guide/divorce-acquisition-tax/", "/guide/industrial-accident-disability/", "/guide/industrial-accident-leave-pay/", "/guide/old-age-pension-age/", "/penalty/", "/national-pension-premium/", "/guide/weekly-holiday-pay-calculator/", "/guide/minimum-wage-calculator/", "/guide/annual-leave-calculator/", "/guide/unemployment-benefit-calculator/", "/guide/severance-tax-calculator/", "/guide/medical-credit-limit/", "/guide/earned-incentive-amount/", "/guide/child-incentive-amount/", "/guide/hourly-wage-calculator/", "/guide/dsr-calculator/", "/guide/brokerage-fee-calculator/"]);

const bench = readFileSync("docs/calc-benchmark.md", "utf-8");

for (const { path, attrs } of MOVED) {
  describe(`${path} 새 틀`, () => {
    // roberin 에 같은 도구가 없으면 '없음'(Task 8 Step 1)
    it("대조표에 한 행", () => expect(bench.includes(`| ${path} | https://roberin.com/`) || bench.includes(`| ${path} | 없음`)).toBe(true));
    it.skipIf(NO_PRESETS.has(path))("자동완성 프리셋", () => expect(calcPresets[path]).toBeDefined());
    const file = `dist${path}index.html`;
    it.skipIf(!existsSync(file))("마크업 계약", () => {
      const html = readFileSync(file, "utf-8");
      for (const a of attrs) expect(html, a).toContain(a);
    });
  });
}
