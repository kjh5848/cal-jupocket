/**
 * 급여명세서 시리즈 — 2026-10-14. keywords/today-100-2026-10-14.csv 의 단발 '급여명세서'(8,400)를 세 편으로 쓴다.
 * 급여명세서발급 4,610 · 급여명세서양식 3,000(허브 예시 표) · 급여명세서조회 1,860(발급 편) · 임금명세서 1,080 · 임금대장 990.
 * 근거: 근로기준법 제11조·제42조·제48조·제116조, 시행령 제7조 별표 1·제22조·제27조·제27조의2·별표 7. rates: payslip-2026.json
 */
import type { Series } from "./types";

export const payslipSeries: Series = {
  id: "payslip",
  cluster: "labor",
  hub: { slug: "payslip", keyword: "급여명세서", label: "급여명세서 — 6가지 기재사항" },
  items: [
    { slug: "payslip-issue", keyword: "급여명세서 발급", label: "급여명세서 발급·조회" },
    { slug: "wage-ledger", keyword: "임금대장", label: "임금대장 기재사항·보존" },
  ],
};
