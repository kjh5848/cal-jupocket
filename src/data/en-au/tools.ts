/**
 * 호주 영어판(/en-au/) 도구 목록. 한국어판 도감(src/data/tools.ts)과 따로 둔다 —
 * 호주판에는 산술 도구와 호주 원문(설정의 허용 출처)으로 검증한 제도 도구만 들어온다.
 *
 * 새 페이지를 만들면 여기 한 줄. 계산이 같은 한국어판이 있으면 `ko` 에 그 주소 → hreflang 짝.
 * basis 는 "math"(산술, 나라 무관) 또는 "law"(호주 원문으로 검증한 제도). 형식은 src/i18n/registry.ts.
 */
import type { LocaleTool } from "../../i18n/registry";

export const tools: LocaleTool[] = [
  {
    href: "/en-au/tools/percent/",
    ko: "/tools/percent/",
    name: "Percentage Calculator",
    blurb: "Percentage of a number, percentage increase or decrease between two numbers, and the price after a percentage off",
    type: "unit",
    icon: "percent",
    basis: "math",
  },
];
