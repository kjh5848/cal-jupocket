/**
 * 실수령액 시리즈 — 2026-10-14. v39 의 실수령액 묶음(검색량이 가장 큰 축, 광고 클릭은 거의 없다).
 * 연봉 실수령액 67,800 · 2026 연봉 실수령액 38,420 · 월급 실수령액 18,050 · 2026 연봉 실수령액표 7,080 ·
 * 월급 실수령액 계산기 1,600 · 연봉 실수령액 계산기 1,100 · 연봉 실수령액 표 990.
 * 근거: 소득세법 제12조 제3호 러목·제129조 제3항, 시행령 제189조·제194조·별표 2(근로소득 간이세액표), 지방세법 제103조의13,
 * 4대보험은 four-insurance-2026.json. rates: withholding-table-2026.json
 */
import type { Series } from "./types";

export const takeHomeSeries: Series = {
  id: "take-home",
  cluster: "labor",
  hub: { slug: "salary-take-home", keyword: "연봉 실수령액", label: "연봉 실수령액 2026 — 표" },
  items: [
    { slug: "monthly-take-home", keyword: "월급 실수령액", label: "월급 실수령액 — 공제 네 줄" },
    { slug: "take-home-calculator", keyword: "연봉 실수령액 계산기", label: "연봉·월급 실수령액 계산기" },
  ],
};
