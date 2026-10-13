/**
 * 양도소득세 시리즈 — 2026-10-13. keywords/today-100-2026-10-13.csv 의 양도소득세 19개를 전부 쓴다.
 * 자동완성(양도세·양도소득세·장기보유특별공제·1가구2주택 양도세·해외주식·양도세 비과세·주식·신고·중과·세율) 약 190개.
 * 근거: 소득세법 제89조·제94조·제95조·제103조~제106조·제110조~제112조, 시행령 제154조·제155조·제157조·제159조의4·
 * 제160조·제167조의10, 조특법 제69조·제133조, 지방세법 제103조의3. rates: capital-gains-2026.json
 *
 * 양도소득세·양도세·뜻·란·기준·면제 → 허브 / 양도세 계산기·양도소득세 계산기·계산·계산법 → 계산기
 * 세율·세율표·기본세율·율·구간·2026·주택·상가 → 세율 / 비과세 조건·요건·2년 거주·12억·1주택 → 비과세
 * 장기보유특별공제(표·율·1세대 1주택·거주요건·한도·다주택자) → 장특공 / 1가구2주택 세금·2주택 양도세·일시적 → 2주택
 * 다주택자 중과·유예·종료·세율 → 중과 / 신고·신고방법·서류·안하면 → 신고 / 신고기간·신고기한·납부 → 기간
 * 해외주식(250만원·신고·세율·지방세·기간) → 해외주식 / 주식·국내주식·대주주 기준 → 주식
 * 토지 양도소득세율·비사업용 → 토지 / 농지 양도소득세·자경 → 농지
 * 쓰지 않은 축: 개편안(공포 전), 신고 대행 수수료·세무사 비용(법령 아님), 환차손(환산 방법 미확인)
 */
import type { Series } from "./types";

export const capitalGainsSeries: Series = {
  id: "capital-gains",
  cluster: "inheritance",
  hub: { slug: "capital-gains-tax", keyword: "양도소득세", label: "양도소득세" },
  items: [
    { slug: "capital-gains-calculator", keyword: "양도세 계산기", label: "양도세 계산기" },
    { slug: "capital-gains-rate", keyword: "양도소득세 세율", label: "양도소득세 세율" },
    { slug: "capital-gains-exemption", keyword: "양도세 비과세 조건", label: "양도세 비과세 조건" },
    { slug: "long-term-holding-deduction", keyword: "장기보유특별공제", label: "장기보유특별공제" },
    { slug: "two-homes-capital-gains", keyword: "1가구2주택 양도소득세", label: "1가구2주택 양도소득세" },
    { slug: "multi-home-surcharge", keyword: "다주택자 양도세 중과", label: "다주택자 양도세 중과" },
    { slug: "capital-gains-filing", keyword: "양도소득세 신고", label: "양도소득세 신고 방법" },
    { slug: "capital-gains-deadline", keyword: "양도세 신고기간", label: "양도세 신고기간" },
    { slug: "overseas-stock-tax", keyword: "해외주식 양도소득세", label: "해외주식 양도소득세" },
    { slug: "stock-capital-gains", keyword: "주식 양도소득세", label: "주식 양도소득세" },
    { slug: "land-capital-gains-rate", keyword: "토지 양도소득세율", label: "토지 양도소득세율" },
    { slug: "farmland-capital-gains", keyword: "농지 양도소득세", label: "농지 양도소득세" },
  ],
};
