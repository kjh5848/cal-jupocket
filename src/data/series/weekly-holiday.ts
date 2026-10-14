/**
 * 주휴수당 시리즈 — 2026-10-14. v39(자동완성 718개 + 광고 클릭) 에서 클릭 2위 묶음.
 * 주휴수당 계산기 67,900(광고 클릭 1,067) · 주휴수당 53,020 · 주휴수당 조건 34,330 · 뜻 8,320 · 계산법 7,750 · 지급기준 3,020 · 포함 시급 1,730.
 * 근거: 근로기준법 제18조 제3항·제55조, 시행령 제30조·별표 1·별표 2, 2026·2027 최저임금 고시. rates: labor-2026.json
 */
import type { Series } from "./types";

export const weeklyHolidaySeries: Series = {
  id: "weekly-holiday",
  cluster: "labor",
  hub: { slug: "weekly-holiday-pay", keyword: "주휴수당", label: "주휴수당 — 주 15시간·개근" },
  items: [
    { slug: "weekly-holiday-pay-calculator", keyword: "주휴수당 계산기", label: "주휴수당 계산기" },
    { slug: "weekly-holiday-pay-criteria", keyword: "주휴수당 조건", label: "주휴수당 조건·지급기준" },
  ],
};
