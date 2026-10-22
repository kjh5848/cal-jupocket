/**
 * 보유세 시리즈 — 2026-10-22 도구 담기 루틴(roberin #6 보유세 계산기). 지방세 — 집·차 클러스터, 종부세·재산세 시리즈와 이어진다.
 * 자동완성(keywords/ac-holding-tax-2026-10-22.csv): 보유세(1주택·2주택·다주택자·개편·계산 방법·부동산·아파트) · 보유세 계산기(2026·2027·부동산·아파트) ·
 * 재산세 종부세(계산기·계산방법·기준·기준일·납부시기·이중과세·차이) · 주택보유세. 금액 줄기 없음 → 프리셋 없음.
 * 근거: 지방세법 제110~115조·제151조, 종합부동산세법 제8~9조·시행령 제4조의3, 농어촌특별세법 제5조, 국세청 집행기준 9-4의3 —
 * rates: local-tax-2026.json · comprehensive-property-2026.json
 *
 * 보유세·뜻·1주택·2주택·다주택·기준일·납부시기 → 허브 / 보유세 계산기·계산 방법·재산세 종부세 계산기 → 계산기 / 이중과세 → 재산세액 공제 글
 * 쓰지 않은 축: 재산세 종부세 차이(종부세 허브가 함)·납부시기 상세(재산세·종부세 납부 글), 개편·2027(확정 숫자 없음), 자동차 보유세(다른 세금)
 */
import type { Series } from "./types";

export const holdingTaxSeries: Series = {
  id: "holding-tax",
  cluster: "localtax",
  hub: { slug: "holding-tax", keyword: "보유세", label: "보유세 — 재산세 + 종부세" },
  items: [
    { slug: "holding-tax-calculator", keyword: "보유세 계산기", label: "보유세 계산기" },
    { slug: "property-jongbu-double-tax", keyword: "재산세 종부세 이중과세", label: "재산세 종부세 이중과세 — 재산세액 공제" },
  ],
};
