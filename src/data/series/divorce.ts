/**
 * 이혼 재산분할 세금 시리즈 — 2026-10-14. v39 클릭률 표의 남은 묶음(이혼 재산분할 세금 1,450 · 클릭 3.2).
 * 자동완성(keywords/divorce-2026-10-14.csv): 재산분할 취득세(세율·감면·과세표준·계산·신고)·양도세·증여세, 위자료 세금·양도세, 위장 이혼 양도세, 사실혼.
 * 근거: 지방세법 제15조 제1항 제6호·시행령 제28조의6 제2항 등 + 판례(대법원 2012두10901·2001두4573·2016두58901·2016두36864, 헌재 96헌바14).
 * rates: divorce-2026.json
 */
import type { Series } from "./types";

export const divorceSeries: Series = {
  id: "divorce",
  cluster: "inheritance",
  hub: { slug: "divorce-property-tax", keyword: "이혼 재산분할 세금", label: "이혼 재산분할 세금" },
  items: [
    { slug: "divorce-acquisition-tax", keyword: "재산분할 취득세", label: "재산분할 취득세 1.5% — 계산" },
    { slug: "divorce-alimony-tax", keyword: "위자료 세금", label: "위자료 세금 — 양도세" },
  ],
};
