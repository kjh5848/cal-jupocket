/**
 * 사업자등록 시리즈 — 2026-10-14. keywords/today-100-2026-10-14.csv 의 사업자등록 8개를 다섯 편으로 쓴다.
 * 사업자등록증·사업자등록증발급은 발급 글, 재발급·주소변경은 한 편, 개인사업자·간이사업자 등록은 한 편.
 * 사업자등록증명(민원)은 근거 조문을 확인하지 못해 쓰지 않았다.
 * 근거: 부가가치세법 제8조, 시행령 제11조·제12조·제14조·제15조, 법인세법 제109조·제111조. rates: business-registration-2026.json
 */
import type { Series } from "./types";

export const businessRegistrationSeries: Series = {
  id: "business-registration",
  cluster: "vat",
  hub: { slug: "business-registration", keyword: "사업자등록", label: "사업자등록 신청" },
  items: [
    { slug: "business-registration-certificate", keyword: "사업자등록증 발급", label: "사업자등록증 발급" },
    { slug: "business-registration-change", keyword: "사업자등록증 주소변경", label: "사업자등록증 주소변경·재발급" },
    { slug: "individual-business-registration", keyword: "개인사업자 등록", label: "개인사업자·간이사업자 등록" },
    { slug: "corporate-business-registration", keyword: "법인사업자등록증 발급", label: "법인사업자등록증 발급" },
  ],
};
