/**
 * 사업자 신고 시리즈 — 2026-10-14. keywords/today-100-2026-10-13.csv 의 사업자 신고 7개를 다섯 편으로 쓴다.
 * 개인사업자폐업신고·폐업신고는 한 편, 현금영수증발급방법·현금영수증자진발급은 한 편.
 * 근거: 부가가치세법 제8조·제32조·제34조·제61조·제62조, 시행령 제13조·제68조·제109조·제110조, 소득세법 제81조의9·제162조의3,
 * 시행령 제210조의3. rates: business-filing-2026.json, vat-2026.json, vat-penalty-2026.json
 *
 * 세금계산서 발행방법(홈택스·기재사항·발행일) → 허브 / 전자세금계산서 발행(의무·8천만원·전송) → 전자
 * 간이과세자 기준(1억400만원·업종·7월) → 간이 / 개인사업자 폐업신고·폐업신고(방법·서류·홈택스) → 폐업
 * 현금영수증 발급방법·자진발급(10만원·5일·가산세) → 현금영수증
 */
import type { Series } from "./types";

export const businessFilingSeries: Series = {
  id: "business-filing",
  cluster: "vat",
  hub: { slug: "tax-invoice-how", keyword: "세금계산서 발행방법", label: "세금계산서 발행방법" },
  items: [
    { slug: "e-tax-invoice", keyword: "전자세금계산서 발행", label: "전자세금계산서 발행" },
    { slug: "simplified-taxpayer-criteria", keyword: "간이과세자 기준", label: "간이과세자 기준" },
    { slug: "business-closure", keyword: "개인사업자 폐업신고", label: "개인사업자 폐업신고" },
    { slug: "cash-receipt", keyword: "현금영수증 발급방법", label: "현금영수증 발급방법·자진발급" },
  ],
};
