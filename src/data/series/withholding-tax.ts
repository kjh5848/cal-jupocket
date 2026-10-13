/**
 * 원천세·지급명세서 시리즈 — 2026-10-14. keywords/today-100-2026-10-13.csv 의 원천세·지급명세서 6개를 전부 쓴다.
 * 근거: 소득세법 제47조 제2항·제59조 제3항·제81조의11·제86조·제128조·제129조·제134조·제164조·제164조의3, 시행령 제20조·제185조·제186조,
 * 국세기본법 제47조의5·시행령 제27조의4. rates: withholding-tax-2026.json
 *
 * 원천세(신고·납부·기한·반기납부·가산세) → 허브 / 원천징수이행상황신고서(작성·0원 신고) → 이행상황
 * 일용직 세금(계산·6%·15만원·2.7%) → 일용 세금 / 일용직 소득신고(지급명세서 다음 달 말일) → 일용 신고
 * 간이지급명세서(매달·근로 2027) → 간이 / 지급명세서(2월 말·3월 10일·가산세) → 지급명세서
 */
import type { Series } from "./types";

export const withholdingTaxSeries: Series = {
  id: "withholding-tax",
  cluster: "income",
  hub: { slug: "withholding-tax", keyword: "원천세", label: "원천세 신고·납부" },
  items: [
    { slug: "withholding-status-report", keyword: "원천징수이행상황신고서", label: "원천징수이행상황신고서" },
    { slug: "daily-worker-tax", keyword: "일용직 세금", label: "일용직 세금" },
    { slug: "daily-worker-income-report", keyword: "일용직 소득신고", label: "일용직 소득신고" },
    { slug: "simplified-payment-statement", keyword: "간이지급명세서", label: "간이지급명세서" },
    { slug: "payment-statement", keyword: "지급명세서", label: "지급명세서" },
  ],
};
