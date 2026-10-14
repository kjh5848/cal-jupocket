/**
 * 연차 시리즈 — 2026-10-14. v39 에서 함께 뽑힌 연차 묶음.
 * 연차계산기 24,840(광고 클릭 207) · 연차발생기준 21,500(385) · 연차수당 계산기 14,890 · 연차수당 7,200 · 지급기준 3,250 · 계산법 2,450 · 퇴사시 연차수당 1,090.
 * 근거: 근로기준법 제18조 제3항·제36조·제37조·제49조·제60조·제61조, 시행령 제6조·별표 1·별표 2. rates: labor-2026.json
 */
import type { Series } from "./types";

export const annualLeaveSeries: Series = {
  id: "annual-leave",
  cluster: "labor",
  hub: { slug: "annual-leave-pay", keyword: "연차수당", label: "연차수당 지급기준·계산법" },
  items: [
    { slug: "annual-leave-days", keyword: "연차 발생기준", label: "연차 발생기준·근속별 일수" },
    { slug: "annual-leave-calculator", keyword: "연차 계산기", label: "연차 계산기" },
  ],
};
