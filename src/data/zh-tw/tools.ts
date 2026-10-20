/**
 * 대만 번체판(/zh-tw/) 도구 목록. 한국어판 도감(src/data/tools.ts)과 따로 둔다 —
 * 대만판에는 산술 도구와 대만 원문(설정의 허용 출처: 財政部·勞保局·勞動部·全國法規資料庫 등)으로 검증한 제도 도구만 들어온다.
 *
 * 새 페이지를 만들면 여기 한 줄. 계산이 같은 한국어판이 있으면 `ko` 에 그 주소 → hreflang 짝.
 * basis 는 "math"(산술, 나라 무관) 또는 "law"(대만 원문으로 검증한 제도). 형식은 src/i18n/registry.ts.
 */
import type { LocaleTool } from "../../i18n/registry";

export const tools: LocaleTool[] = [
  {
    href: "/zh-tw/tools/percent/",
    ko: "/tools/percent/",
    name: "百分比計算機",
    blurb: "算出一個數的百分之幾、成長率或減少率，以及打折後的價格",
    type: "unit",
    icon: "percent",
    basis: "math",
  },
  {
    href: "/zh-tw/tools/date-diff/",
    ko: "/tools/date-diff/",
    name: "日期計算機",
    blurb: "算兩個日期相差幾天、幾天後是幾月幾號，以及週一到週五的平日天數",
    type: "date",
    icon: "calendar",
    basis: "math",
  },
];
