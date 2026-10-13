/**
 * 부가세 확정신고 시리즈 — 2026-10-13, 1월 묶음 첫 번째.
 * 자동완성(keywords/january-2026-10-13.csv) 18개에서 띄어쓰기·어순만 다른 것을 합쳤다.
 *   기간·기한·확정신고기한·확정신고일 → 기간 한 편
 *   방법·확정신고서·발급·발급 방법·출력 → 방법 한 편(서식 출력은 화면이라 절로만)
 */
import type { Series } from "./types";

export const vatFinalSeries: Series = {
  id: "vat-final-return",
  cluster: "vat",
  hub: { slug: "vat-final-return", keyword: "부가세 확정신고", label: "부가세 확정신고" },
  items: [
    { slug: "vat-final-return-period", keyword: "부가세 확정신고 기간", label: "부가세 확정신고 기간" },
    { slug: "vat-final-return-first-half", keyword: "1기 부가세 확정신고", label: "1기 부가세 확정신고" },
    { slug: "vat-final-return-second-half", keyword: "2기 부가세 확정신고", label: "2기 부가세 확정신고" },
    { slug: "simplified-vat-final-return", keyword: "간이과세자 부가세 확정신고", label: "간이과세자 부가세 확정신고" },
    { slug: "individual-vat-final-return", keyword: "개인사업자 부가세 확정신고", label: "개인사업자 부가세 확정신고" },
    { slug: "corporate-vat-final-return", keyword: "법인 부가세 확정신고", label: "법인 부가세 확정신고" },
    { slug: "vat-final-return-how", keyword: "부가세 확정신고 방법", label: "부가세 확정신고 방법" },
    { slug: "vat-final-return-payment", keyword: "부가세 확정신고 납부", label: "부가세 확정신고 납부" },
    { slug: "vat-final-return-refund", keyword: "부가세 확정신고 환급", label: "부가세 확정신고 환급" },
    { slug: "vat-e-filing-credit", keyword: "부가세 확정신고 전자신고세액공제", label: "부가세 전자신고세액공제" },
    { slug: "closing-vat-final-return", keyword: "폐업 부가세 확정신고", label: "폐업 부가세 확정신고" },
  ],
};
