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
  "/withholding/": {
    // 사업소득은 3.3% 계산기와 같은 자동완성. 기타소득 8.8% 는 자동완성에 금액이 붙어 나오지 않아(2026-10-17 네이버 '8.8'·'100만원 8.8' 등) 버튼 없음
    business: { amounts: [1_000_000, 2_000_000, 3_000_000], source: "keywords/ac-33-2026-10-17.csv", term: "3.3" },
  },
};
