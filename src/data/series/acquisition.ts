/**
 * 취득세 시리즈 — 2026-10-14. keywords/today-100-2026-10-13.csv 의 취득세 4개를 전부 쓴다.
 * 허브는 기존 /guide/acquisition-tax/(39번 글)를 '취득세' 스니펫 구조로 고쳐 썼다.
 * 근거: 지방세법 제11조·제13조의2·제13조의3·제20조·제151조, 농어촌특별세법 제4조·제5조, 주택법 제2조, 지방세특례제한법 제36조의3.
 * rates: local-tax-2026.json(기본), acquisition-extra-2026.json(중과·농특세·생애최초·오피스텔)
 *
 * 취득세(세율표·신고기한·계산) → 허브 / 아파트 취득세(1~3%·85㎡·생애최초·중과) → 아파트
 * 부동산 취득세(토지·상가·증여·상속 4.6%·4%·3.16%) → 부동산 / 오피스텔 취득세(4.6%·주택 수) → 오피스텔
 */
import type { Series } from "./types";

export const acquisitionSeries: Series = {
  id: "acquisition",
  cluster: "localtax",
  hub: { slug: "acquisition-tax", keyword: "취득세", label: "취득세 세율과 신고기한" },
  items: [
    { slug: "apartment-acquisition-tax", keyword: "아파트 취득세", label: "아파트 취득세" },
    { slug: "real-estate-acquisition-tax", keyword: "부동산 취득세", label: "부동산 취득세" },
    { slug: "officetel-acquisition-tax", keyword: "오피스텔 취득세", label: "오피스텔 취득세" },
  ],
};
