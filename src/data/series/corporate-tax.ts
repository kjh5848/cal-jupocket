/**
 * 법인세 시리즈 — 2026-10-14. keywords/today-100-2026-10-14.csv 의 법인세 5개를 전부 쓴다.
 * 근거: 법인세법 제13조·제14조·제55조·제60조·제60조의2·제63조·제63조의2·제64조, 부칙 <법률 제21217호> 제5조·개정이유.
 * rates: corporate-tax-2026.json
 */
import type { Series } from "./types";

export const corporateTaxSeries: Series = {
  id: "corporate-tax",
  cluster: "vat",
  hub: { slug: "corporate-tax", keyword: "법인세", label: "법인세" },
  items: [
    { slug: "corporate-tax-rate", keyword: "법인세율", label: "법인세율" },
    { slug: "corporate-tax-deadline", keyword: "법인세 신고기간", label: "법인세 신고기간" },
    { slug: "corporate-tax-prepayment", keyword: "법인세 중간예납", label: "법인세 중간예납" },
    { slug: "corporate-tax-base", keyword: "법인세 과세표준", label: "법인세 과세표준" },
  ],
};
