/**
 * 미국 영어판(/en-us/) 도구 목록. 한국어판 도감(src/data/tools.ts)과 따로 둔다 —
 * 미국판에는 산술 도구와 미국 원문(설정의 허용 출처)으로 검증한 제도 도구만 들어온다.
 *
 * 새 페이지를 만들면 여기 한 줄. 계산이 같은 한국어판이 있으면 `ko` 에 그 주소 → hreflang 짝.
 * basis 는 "math"(산술, 나라 무관) 또는 "law"(미국 원문으로 검증한 제도). 형식은 src/i18n/registry.ts.
 */
import type { LocaleTool } from "../../i18n/registry";

export const tools: LocaleTool[] = [
  {
    href: "/en-us/tools/percent/",
    ko: "/tools/percent/",
    name: "Percentage Calculator",
    blurb: "What percent of a number, X% of Y, percent change between two numbers, and percent off a price",
    type: "unit",
    icon: "percent",
    basis: "math",
  },
  {
    href: "/en-us/tools/date-diff/",
    ko: "/tools/date-diff/",
    name: "Date Calculator",
    blurb: "Days between two dates, days from today, add or subtract weeks and months, weekdays only",
    type: "date",
    icon: "calendar",
    basis: "math",
  },
];
