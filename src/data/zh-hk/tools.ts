/**
 * 홍콩 繁體中文판(/zh-hk/) 도구 목록. 한국어판 도감(src/data/tools.ts)과 따로 둔다 —
 * 홍콩판에는 산술 도구와 홍콩 원문(설정의 허용 출처: 稅務局·電子版香港法例·強積金局·勞工處·gov.hk)으로 검증한 제도 도구만 들어온다.
 *
 * 새 페이지를 만들면 여기 한 줄. 계산이 같은 한국어판이 있으면 `ko` 에 그 주소 → hreflang 짝.
 * basis 는 "math"(산술, 나라 무관) 또는 "law"(홍콩 원문으로 검증한 제도). 형식은 src/i18n/registry.ts.
 */
import type { LocaleTool } from "../../i18n/registry";

export const tools: LocaleTool[] = [
  {
    href: "/zh-hk/tools/percent/",
    ko: "/tools/percent/",
    name: "百分比計算機",
    blurb: "計算一個數的百分之幾、升幅跌幅百分比，以及打折後的價錢",
    type: "unit",
    icon: "percent",
    basis: "math",
  },
];
