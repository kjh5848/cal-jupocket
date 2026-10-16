/**
 * 산재 시리즈 — 2026-10-16. v52 3순위.
 * 산재보험 23,560 · 산재처리방법 10,040 · 산재 휴업급여 7,060 · 산재 보상금 3,640 · 산재신청 3,560 · 산재처리 기준 3,320 ·
 * 산재 장해등급 2,500 · 장해등급 14급 보상금 430.
 * 근거: 산재보험법 제36조·제37조·제40조·제41조·제52조~제57조·제111조의2·제112조·제116조, 별표 1·2, 시행령 제51조·제53조,
 * 고용노동부고시 제2025-84호, 소득세법 제12조 제3호 다목, 근로기준법 제23조 ②. rates: industrial-accident-2026.json
 */
import type { Series } from "./types";

export const industrialAccidentSeries: Series = {
  id: "industrial-accident",
  cluster: "labor",
  hub: { slug: "industrial-accident", keyword: "산재 처리방법", label: "산재 처리방법 — 신청·기준" },
  items: [
    { slug: "industrial-accident-leave-pay", keyword: "산재 휴업급여", label: "산재 휴업급여 — 계산" },
    { slug: "industrial-accident-disability", keyword: "산재 장해등급 보상금", label: "산재 장해등급 보상금" },
  ],
};
