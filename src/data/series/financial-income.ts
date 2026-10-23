/**
 * 금융소득 시리즈 — 2026-10-14. keywords/today-100-2026-10-14.csv 의 단발 '금융소득세'(1,230)를 펼치니
 * 금융소득종합과세 13,170 · 배당소득세 2,740 · 이자소득세 2,500 이 나와 세 편으로 쓴다.
 * 2026-10-23 도구 담기 루틴(roberin #34)이 배당금 계산기를 더함(keywords/ac-dividend-2026-10-23.csv: 배당금 계산기·월배당 100만원 만들기·원금·배당금 세금 계산기).
 * 근거: 소득세법 제14조·제16조·제17조·제56조·제62조·제127조·제129조, 조특법 제104조의27. rates: financial-income-2026.json
 */
import type { Series } from "./types";

export const financialIncomeSeries: Series = {
  id: "financial-income",
  cluster: "income",
  hub: { slug: "financial-income-tax", keyword: "금융소득종합과세", label: "금융소득종합과세 2천만원" },
  items: [
    { slug: "interest-income-tax", keyword: "이자소득세", label: "이자소득세 15.4%" },
    { slug: "dividend-income-tax", keyword: "배당소득세", label: "배당소득세·고배당 분리과세" },
    { slug: "dividend-calculator", keyword: "배당금 계산기", label: "배당금 계산기 — 세후 월배당" },
  ],
};
