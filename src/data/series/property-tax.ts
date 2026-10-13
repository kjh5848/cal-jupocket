/**
 * 재산세 시리즈 — 2026-10-14. keywords/today-100-2026-10-14.csv 의 재산세 5개를 네 편으로 쓴다(감면은 허브에 합쳤다).
 * 허브는 기존 35번 글 /guide/property-tax/ 를 '재산세' 스니펫 구조로 고쳐 썼다.
 * 근거: 지방세법 제107조·제110조·제111조·제111조의2·제112조·제114조·제115조·제117조~제119조. rates: local-tax-2026.json, property-extra-2026.json
 */
import type { Series } from "./types";

export const propertyTaxSeries: Series = {
  id: "property-tax",
  cluster: "localtax",
  hub: { slug: "property-tax", keyword: "재산세", label: "재산세 부과기준과 납부기간" },
  items: [
    { slug: "property-tax-calc", keyword: "재산세 계산", label: "재산세 계산" },
    { slug: "property-tax-payment", keyword: "재산세 납부방법", label: "재산세 납부방법·분할납부" },
    { slug: "property-tax-basis-date", keyword: "재산세 과세기준일", label: "재산세 과세기준일" },
  ],
};
