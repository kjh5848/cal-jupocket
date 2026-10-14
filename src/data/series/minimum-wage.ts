/**
 * 최저임금 시리즈 — 2026-10-14. v39 의 최저임금 묶음(검색 9만, 광고 클릭은 적다 — 검색량 쪽 판단).
 * 최저임금 50,500 · 최저임금 2027 17,760 · 2027 최저임금 5,290 · 최저임금 계산기 4,310 · 내년 최저임금 2027 4,250 · 월급 3,140 · 연봉 1,650.
 * 근거: 2026·2027 최저임금 고시, 최저임금법 제3조·제5조·제6조·제7조·제28조, 시행령 제3조·제5조, 부칙(법률 제15666호). rates: labor-2026.json
 */
import type { Series } from "./types";

export const minimumWageSeries: Series = {
  id: "minimum-wage",
  cluster: "labor",
  hub: { slug: "minimum-wage", keyword: "최저임금", label: "최저임금 — 2026 시급 10,320원" },
  items: [
    { slug: "minimum-wage-2027", keyword: "최저임금 2027", label: "최저임금 2027 — 10,700원" },
    { slug: "minimum-wage-calculator", keyword: "최저임금 계산기", label: "최저임금 계산기" },
  ],
};
