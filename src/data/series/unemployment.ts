/**
 * 실업급여 시리즈 — 2026-10-14. v39 클릭 1위 묶음(검색 50.6만, 광고 클릭 3,184).
 * 실업급여 조건 107,400(1,349) · 실업급여 103,600 · 계산기 89,100(745) · 신청 67,000 · 신청방법 40,200(637) · 금액 32,720 · 수급기간 25,720.
 * 근거: 고용보험법 제10조·제40조~제50조·제58조·별표 1, 시행령 제3조·제68조·제70조, 시행규칙 제91조의2·제92조·제101조·별표 2. rates: unemployment-2026.json
 */
import type { Series } from "./types";

export const unemploymentSeries: Series = {
  id: "unemployment",
  cluster: "labor",
  hub: { slug: "unemployment-benefit", keyword: "실업급여", label: "실업급여 — 조건·금액·기간" },
  items: [
    { slug: "unemployment-benefit-criteria", keyword: "실업급여 조건", label: "실업급여 조건·자진퇴사 사유" },
    { slug: "unemployment-benefit-calculator", keyword: "실업급여 계산기", label: "실업급여 계산기" },
    { slug: "unemployment-benefit-apply", keyword: "실업급여 신청방법", label: "실업급여 신청방법·실업인정" },
    { slug: "unemployment-benefit-period", keyword: "실업급여 수급기간", label: "실업급여 수급기간·일수" },
  ],
};
