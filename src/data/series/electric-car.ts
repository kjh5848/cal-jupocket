/**
 * 전기차 세금 시리즈 — 2026-10-14. v39 의 전기차 세금 묶음(광고 클릭 11.3 — 검색 대비 클릭이 높은 쪽).
 * 전기차 세금 2,640 · 감면 160 · 세금표 110. 자동완성: 감면·감면 종료·혜택·면제·인상·개편·계산·계산기·기준.
 * 근거: 지방세법 제12조·제127조·제128조·제150조·제151조, 시행령 제18조·제123조, 지방세특례제한법 제66조, 조세특례제한법 제109조.
 * rates: electric-car-2026.json
 */
import type { Series } from "./types";

export const electricCarSeries: Series = {
  id: "electric-car",
  cluster: "localtax",
  hub: { slug: "electric-car-tax", keyword: "전기차 세금", label: "전기차 세금 — 자동차세 13만원" },
  items: [
    { slug: "electric-car-tax-exemption", keyword: "전기차 세금 감면", label: "전기차 세금 감면 — 2026년 말까지" },
    { slug: "electric-car-tax-calculator", keyword: "전기차 세금 계산기", label: "전기차 세금 계산기" },
  ],
};
