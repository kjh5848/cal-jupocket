/**
 * 코인 세금 시리즈 — 2026-10-14. v39 의 코인·가상자산 과세 묶음.
 * 코인과세 31,760 · 가상자산 과세 21,430 · 코인 세금 6,590 · 가상자산 과세 유예 3,730 · 코인 세금 유예 930 · 코인 세금 계산기 30.
 * 근거: 소득세법 제21조·제37조·제64조의3·제70조·제84조·제127조·제164조의4·부칙(법률 제17757호) 제5조, 지방세법 제93조 제18항. rates: crypto-2026.json
 */
import type { Series } from "./types";

export const cryptoSeries: Series = {
  id: "crypto",
  cluster: "income",
  hub: { slug: "crypto-tax", keyword: "코인 과세", label: "코인 과세 — 2027년·250만원·22%" },
  items: [
    { slug: "crypto-tax-delay", keyword: "가상자산 과세 유예", label: "가상자산 과세 유예" },
    { slug: "crypto-tax-calculator", keyword: "코인 세금 계산기", label: "코인 세금 계산기" },
  ],
};
