/**
 * 건강보험 피부양자 시리즈 — 2026-10-14. v39 의 건강보험 피부양자 묶음(검색 3.1만).
 * 건강보험 피부양자 11,160 · 등록 8,760 · 조건 4,670 · 등록 방법 2,200 · 확인 800 · 등록 서류 730.
 * 근거: 국민건강보험법 제5조, 시행령 제41조, 시행규칙 제2조·별표 1·별표 1의2. rates: health-dependent-2026.json
 */
import type { Series } from "./types";

export const healthDependentSeries: Series = {
  id: "health-dependent",
  cluster: "retirement",
  hub: { slug: "health-dependent", keyword: "건강보험 피부양자", label: "건강보험 피부양자 — 2천만원·5억4천" },
  items: [
    { slug: "health-dependent-criteria", keyword: "건강보험 피부양자 조건", label: "피부양자 조건·소득·재산" },
    { slug: "health-dependent-registration", keyword: "건강보험 피부양자 등록", label: "피부양자 등록·90일·서류" },
  ],
};
