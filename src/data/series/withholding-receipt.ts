/**
 * 원천징수영수증 시리즈 — 2026-10-13, 1월 묶음 세 번째.
 * 자동완성 23개를 허브 + 6편으로 묶었다.
 *   근로소득·근로·갑근세 원천징수영수증 → 근로소득 한 편
 *   발급·발급 방법·홈택스·조회·출력·확인·직인·회사직인·양식 → 발급 한 편(화면은 절로만)
 *   뜻·이란 → 허브. '영어로' 는 쓰지 않았다(세법 밖)
 */
import type { Series } from "./types";

export const withholdingReceiptSeries: Series = {
  id: "withholding-receipt",
  cluster: "income",
  hub: { slug: "withholding-receipt", keyword: "원천징수영수증", label: "원천징수영수증" },
  items: [
    { slug: "earned-income-withholding-receipt", keyword: "근로소득원천징수영수증", label: "근로소득 원천징수영수증" },
    { slug: "business-income-withholding-receipt", keyword: "사업소득 원천징수영수증", label: "사업소득 원천징수영수증(3.3%)" },
    { slug: "severance-withholding-receipt", keyword: "퇴직소득원천징수영수증", label: "퇴직소득 원천징수영수증" },
    { slug: "withholding-receipt-issue", keyword: "원천징수영수증 발급", label: "원천징수영수증 발급" },
    { slug: "withholding-receipt-read", keyword: "원천징수영수증 보는법", label: "원천징수영수증 보는 법" },
    { slug: "withholding-receipt-vs-income-certificate", keyword: "원천징수영수증 소득금액증명원 차이", label: "원천징수영수증과 소득금액증명원" },
  ],
};
