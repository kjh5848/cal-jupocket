/**
 * 캐나다판(/en-ca/) 도구 목록. 한국어판 도감(src/data/tools.ts)과 따로 둔다 —
 * 캐나다판에는 산술 도구와 캐나다 원문(canada.ca·laws-lois.justice.gc.ca)으로 검증된 제도 도구만 들어온다.
 *
 * 새 캐나다판 페이지를 만들면 여기 한 줄. 계산이 같은 한국어판이 있으면 `ko` 에 그 주소 → hreflang 짝.
 * basis 는 "math"(산술, 나라 무관) 또는 "law"(캐나다 원문으로 검증한 제도). 형식은 src/i18n/registry.ts.
 */
import type { LocaleTool } from "../../i18n/registry";

export const tools: LocaleTool[] = [
  {
    href: "/en-ca/tools/percent/",
    ko: "/tools/percent/",
    name: "Percent calculator",
    blurb: "Percent off a price, percent increase or decrease between two numbers, a percentage of a number and a mark out of a total",
    type: "unit",
    icon: "percent",
    basis: "math",
  },
];
