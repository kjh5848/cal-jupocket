/**
 * 노령연금 시리즈 — 2026-10-15. v52 에서 검색·광고 클릭이 가장 큰 묶음.
 * 노령연금 기준 16,650 · 노령연금 14,740 · 수급자격 13,820(클릭 653) · 자격 10,550(733) · 나이 3,440 · 재산 기준 2,980 · 신청 2,170 ·
 * 국민연금 차이 850 · 기초연금 차이 580. '재산 기준' 검색은 기초연금 기준을 노령연금으로 부른 것 — 차이 글이 받는다.
 * 근거: 국민연금법 제13조·제49조·제50조·제61조~제64조의3·제77조·제115조, 부칙, 시행령 제45조, 보건복지부고시 제2026-12호. rates: pension-2026.json
 */
import type { Series } from "./types";

export const oldAgePensionSeries: Series = {
  id: "old-age-pension",
  cluster: "retirement",
  hub: { slug: "old-age-pension", keyword: "노령연금", label: "노령연금 — 자격·기준" },
  items: [
    { slug: "old-age-pension-age", keyword: "노령연금 나이", label: "노령연금 나이 — 출생연도별" },
    { slug: "old-age-pension-vs-basic", keyword: "노령연금 기초연금 차이", label: "노령연금 기초연금 차이" },
  ],
};
