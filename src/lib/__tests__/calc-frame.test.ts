/**
 * 리브랜딩 Task 8 — 계산기마다 새 틀(두 칸·비율 막대·소계·자동완성 프리셋)로 옮겼는지.
 * 루틴 한 회차에 한 줄씩 늘린다. 옮긴 계산기는 docs/calc-benchmark.md 에도 한 행이 있어야 한다.
 */
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { calcPresets } from "../../data/calc-presets";

const MOVED: { path: string; attrs: string[] }[] = [
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
];

/**
 * 자동완성에 금액이 붙어 나오지 않아 '자주 넣는 금액' 버튼이 없는 계산기 — 금액은 지어내지 않는다.
 * /penalty/: 네이버 '가산세 1'·'무신고가산세 1'·'기한후신고 가산세 1'·'종합소득세 가산세 1' 등 결과 없음(2026-10-17, keywords/ac-penalty-2026-10-17.csv)
 * /national-pension-premium/: 네이버 '국민연금 보험료 1·2·3·5'·'지역가입자 국민연금 1·2·3'·'국민연금 100만원·200만원·300만원' 결과 없음(2026-10-17, keywords/ac-pension-premium-2026-10-17.csv)
 * /guide/weekly-holiday-pay-calculator/: 네이버 '주휴수당 1'·'주휴수당 시급 1'·'시급 1 주휴수당'·'주휴수당 계산 1' 에 시급 금액 줄기 없음 — 시간('15시간')만 나옴(2026-10-17, keywords/ac-weekly-holiday-2026-10-17.csv). 2026·2027 최저시급 버튼은 고시 금액이라 그대로 둔다
 * /guide/minimum-wage-calculator/: 네이버 '최저임금 월급 1·2'·'월급 200만원 최저임금'·'월급 시급 환산 1'·'최저임금 계산 1' 에 금액 줄기 없음 — 연도('2026'·'2027')만 나옴(2026-10-17, keywords/ac-minimum-wage-2026-10-17.csv)
 * /guide/annual-leave-calculator/: 네이버 '연차수당 월급 1·2·3'·'월급 300 연차수당'·'연차 계산 1'·'연차수당 계산 1' 결과 없음(2026-10-17, keywords/ac-annual-leave-2026-10-17.csv)
 * /guide/unemployment-benefit-calculator/: 네이버 '실업급여 1·2·3' 은 일수('180일'·'210일')·회차('1차')만, '실업급여 200·300'·'200만원 실업급여'·'월급 300 실업급여'·'실업급여 월급'·'실업급여 계산기 월급' 결과 없음(2026-10-17, keywords/ac-unemployment-2026-10-17.csv)
 * /guide/severance-tax-calculator/: 네이버 '퇴직금 세금'·'퇴직소득세'·'퇴직금 1억·2억·3천만원·5천만원 세금' 에서 금액 줄기는 '퇴직금 1억 세금 계산기 방법' 하나 — 기본값 1억과 같아 버튼 없음(2026-10-17, keywords/ac-severance-tax-2026-10-17.csv)
 */
const NO_PRESETS = new Set(["/penalty/", "/national-pension-premium/", "/guide/weekly-holiday-pay-calculator/", "/guide/minimum-wage-calculator/", "/guide/annual-leave-calculator/", "/guide/unemployment-benefit-calculator/", "/guide/severance-tax-calculator/"]);

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
