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
  {
    href: "/zh-hk/tools/date-diff/",
    ko: "/tools/date-diff/",
    name: "日數計算機",
    blurb: "計算兩個日期相隔幾多天（可連首尾計）、某日期加減幾天或幾個月，以及星期一至五的平日數",
    type: "date",
    icon: "calendar",
    basis: "math",
  },
  {
    href: "/zh-hk/tools/compound/",
    ko: "/tools/compound/",
    name: "複利計算機",
    blurb: "以港元計算起始本金加每月供款的複息：利息收益、儲到目標要多久、稅後及扣除通脹後的結餘",
    type: "money",
    icon: "chart",
    basis: "math",
  },
  {
    href: "/zh-hk/tools/dday/",
    ko: "/tools/dday/",
    name: "倒數日子計算器",
    blurb: "距離聖誕節、農曆新年、DSE 開考或任何日子還有幾多日，以日、小時、分鐘倒數",
    type: "date",
    icon: "calendar",
    basis: "math",
  },
  {
    href: "/zh-hk/tools/unix-time/",
    ko: "/tools/unix-time/",
    name: "時間戳轉換器",
    blurb: "把10位數秒或13位數毫秒的 Unix timestamp 轉成 UTC 或裝置時區的日期時間，亦可由日期轉回時間戳",
    type: "date",
    icon: "calendar",
    basis: "math",
  },
  {
    href: "/zh-hk/tools/sec-convert/",
    ko: "/tools/sec-convert/",
    name: "時間換算器",
    blurb: "秒、分鐘、小時、天及毫秒互相換算，寫成幾小時幾分鐘幾秒，並把分鐘換算成小數小時",
    type: "date",
    icon: "calendar",
    basis: "math",
  },
];
