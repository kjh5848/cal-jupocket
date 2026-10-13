/**
 * 지방세(주민세·지방소득세) 시리즈 — 2026-10-14. keywords/today-100-2026-10-13.csv 의 지방세 2개를 쓴다.
 * 지방소득세는 기존 42번 글 /guide/local-income-tax/ 를 스니펫 구조로 고쳐 시리즈에 넣었다.
 * 근거: 지방세법 제74조~제84조의7(주민세), 제92조·제95조·제103조의13(개인지방소득세). rates: local-tax-2026.json, local-extra-2026.json
 */
import type { Series } from "./types";

export const localTaxSeries: Series = {
  id: "local-tax",
  cluster: "localtax",
  hub: { slug: "resident-tax", keyword: "주민세", label: "주민세" },
  items: [
    { slug: "local-income-tax", keyword: "지방소득세", label: "지방소득세" },
  ],
};
