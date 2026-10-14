/**
 * 육아휴직 시리즈 — 2026-10-14. v39 의 육아휴직급여 묶음(검색 13.2만, 광고 클릭 194) + 출산휴가급여(2.2만).
 * 육아휴직급여 79,000 · 육아휴직급여신청 30,800 · 육아휴직기간 21,780 · 출산휴가급여 13,510 · 공무원 육아휴직 급여 5,350(다루지 않음) · 계산 1,670 · 6+6 750.
 * 근거: 고용보험법 제70조·제73조·제75조·제76조, 시행령 제95조·제95조의3·제101조, 남녀고용평등법 제19조, 근로기준법 제74조, 고용노동부고시 제2026-67호.
 */
import type { Series } from "./types";

export const parentalLeaveSeries: Series = {
  id: "parental-leave",
  cluster: "labor",
  hub: { slug: "parental-leave-pay", keyword: "육아휴직급여", label: "육아휴직급여 — 250·200·160만원" },
  items: [
    { slug: "parental-leave-pay-calculator", keyword: "육아휴직 급여 계산", label: "육아휴직 급여 계산" },
    { slug: "parental-leave-pay-apply", keyword: "육아휴직급여 신청", label: "육아휴직급여 신청기간" },
    { slug: "parental-leave-period", keyword: "육아휴직 기간", label: "육아휴직 기간·단기 육아휴직" },
    { slug: "maternity-leave-pay", keyword: "출산휴가급여", label: "출산휴가급여·상한 660만원" },
  ],
};
