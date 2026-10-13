/**
 * 로또세금 시리즈 — 2026-10-14. keywords/today-100-2026-10-14.csv 의 단발 '로또세금'(14,390)을 세 편으로 쓴다.
 * 로또실수령액 11,190 · 로또세금계산기 8,570 · 로또1등세금 4,690(허브에 합쳤다).
 * 근거: 소득세법 제14조 제3항 제8호 라목·제21조 제1항 제2호·제37조·제84조 제2호·제129조 제1항 제6호, 지방세법 제103조의13. rates: lottery-2026.json
 */
import type { Series } from "./types";

export const lottoTaxSeries: Series = {
  id: "lotto-tax",
  cluster: "income",
  hub: { slug: "lotto-tax", keyword: "로또세금", label: "로또세금 — 22%와 33%" },
  items: [
    { slug: "lotto-net-amount", keyword: "로또 실수령액", label: "로또 실수령액 표" },
    { slug: "lotto-tax-calculator", keyword: "로또 세금 계산기", label: "로또 세금 계산기" },
  ],
};
