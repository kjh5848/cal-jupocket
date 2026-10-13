/**
 * 성실신고 시리즈 — 2026-10-14. keywords/today-100-2026-10-14.csv 의 단발 '성실신고대상자'(1,350)를 두 편으로 쓴다.
 * 성실사업자기준 500 · 성실신고 170 · 성실신고확인대상자 170 · 성실신고기준 120.
 * 근거: 소득세법 제59조의4 제9항·제70조의2·제81조의2, 시행령 제118조의8·제133조, 조특법 제122조의3·제126조의6. rates: diligent-filer-2026.json
 */
import type { Series } from "./types";

export const diligentSeries: Series = {
  id: "diligent",
  cluster: "income",
  hub: { slug: "diligent-filer", keyword: "성실신고대상자", label: "성실신고대상자 기준·기한" },
  items: [{ slug: "diligent-business", keyword: "성실사업자 기준", label: "성실사업자 기준·혜택" }],
};
