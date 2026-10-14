/**
 * 면세한도 시리즈 — 2026-10-14. v39 의 면세한도 묶음(검색 3.8만) + 해외직구 관세(3.7천).
 * 면세한도 13,890 · 일본 면세한도 10,530 · 주류 면세한도 3,050 · 일본 주류 면세 한도 2,150 · 해외 면세 한도 1,960 · 향수 1,710 · 해외직구 관세 기준 1,670.
 * 근거: 관세법 제94조·제96조·제241조, 시행령 제96조·별표 2, 시행규칙 제45조·제48조, 관세청고시 제2026-56호. rates: customs-2026.json — 한국 입국 기준.
 */
import type { Series } from "./types";

export const customsSeries: Series = {
  id: "customs",
  cluster: "vat",
  hub: { slug: "duty-free-limit", keyword: "면세한도", label: "면세한도 — 1명당 800달러" },
  items: [
    { slug: "liquor-duty-free-limit", keyword: "주류 면세한도", label: "주류·담배·향수 면세한도" },
    { slug: "japan-duty-free-limit", keyword: "일본 면세한도", label: "일본 면세한도(한국 입국 기준)" },
    { slug: "direct-purchase-customs", keyword: "해외직구 관세 기준", label: "해외직구 관세 150달러" },
  ],
};
