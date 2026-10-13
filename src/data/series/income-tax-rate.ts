/**
 * 소득세율·과세표준 시리즈 — 2026-10-14. keywords/today-100-2026-10-13.csv 의 소득세율·과세표준 7개를 전부 쓴다.
 * 허브는 기존 /guide/income-tax-brackets/(링크허브 8번)를 '소득세율표' 글로 고쳐 썼다.
 * 근거: 소득세법 제14조·제19조·제21조·제37조·제55조·제84조·제129조, 시행령 제87조. rates: income-tax-rate-2026.json, 2026.json,
 * year-end-2026.json(근로소득공제·세액공제).
 *
 * 소득세율표·세율 구간·누진공제 → 허브 / 근로소득세율(연봉별·실효) → 근로소득세율 / 근로소득세(간이세액표·연말정산·일용 6%) → 근로소득세
 * 과세표준(뜻·세목별) → 과세표준 / 종합소득세 과세표준(구간·계산) → 종합 / 기타소득세율(8.8%·12만5천원·300만원) → 기타
 * 사업소득세(3.3%·경비·5월) → 사업
 */
import type { Series } from "./types";

export const incomeTaxRateSeries: Series = {
  id: "income-tax-rate",
  cluster: "income",
  hub: { slug: "income-tax-brackets", keyword: "소득세율표", label: "소득세율표" },
  items: [
    { slug: "earned-income-tax-rate", keyword: "근로소득세율", label: "근로소득세율" },
    { slug: "earned-income-tax", keyword: "근로소득세", label: "근로소득세" },
    { slug: "tax-base", keyword: "과세표준", label: "과세표준" },
    { slug: "comprehensive-tax-base", keyword: "종합소득세 과세표준", label: "종합소득세 과세표준" },
    { slug: "other-income-tax-rate", keyword: "기타소득세율", label: "기타소득세율" },
    { slug: "business-income-tax", keyword: "사업소득세", label: "사업소득세" },
  ],
};
