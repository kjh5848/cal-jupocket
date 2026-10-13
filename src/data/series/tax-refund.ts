/**
 * 세금 환급 시리즈 — 2026-10-14. keywords/today-100-2026-10-13.csv 의 세금 환급 4개를 전부 쓴다.
 * 근거: 국세기본법 제45조의2·제51조~제54조, 시행령 제43조의3, 소득세법 제70조·제85조. rates: tax-refund-2026.json, refund-2026.json
 *
 * 세금환급금조회(종류·시효·사기) → 허브 / 국세환급금(충당·30일·가산금·양도) → 국세환급금
 * 종합소득세환급(3.3% 프리랜서·경정청구) → 종소세 환급 / 종합소득세환급일(언제 들어오나·가산금 기산일) → 환급일
 */
import type { Series } from "./types";

export const taxRefundSeries: Series = {
  id: "tax-refund",
  cluster: "income",
  hub: { slug: "tax-refund-lookup", keyword: "세금 환급금 조회", label: "세금 환급금 조회" },
  items: [
    { slug: "national-tax-refund", keyword: "국세환급금", label: "국세환급금" },
    { slug: "income-tax-refund-guide", keyword: "종합소득세 환급", label: "종합소득세 환급" },
    { slug: "income-tax-refund-date", keyword: "종합소득세 환급일", label: "종합소득세 환급일" },
  ],
};
