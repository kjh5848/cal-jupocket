/**
 * 싱가포르 영어판(/en-sg/) 도구 목록. 한국어판 도감(src/data/tools.ts)과 따로 둔다 —
 * 싱가포르판에는 산술 도구와 싱가포르 원문(설정의 허용 출처: IRAS·MOM·CPF·SSO)으로 검증한 제도 도구만 들어온다.
 *
 * 새 페이지를 만들면 여기 한 줄. 계산이 같은 한국어판이 있으면 `ko` 에 그 주소 → hreflang 짝.
 * basis 는 "math"(산술, 나라 무관) 또는 "law"(싱가포르 원문으로 검증한 제도). 형식은 src/i18n/registry.ts.
 */
import type { LocaleTool } from "../../i18n/registry";

export const tools: LocaleTool[] = [
  {
    href: "/en-sg/tools/percent/",
    ko: "/tools/percent/",
    name: "Percentage Calculator",
    blurb: "Percentage of a number, percentage increase or decrease, and the price after a percentage discount",
    type: "unit",
    icon: "percent",
    basis: "math",
  },
  {
    href: "/en-sg/tools/date-diff/",
    ko: "/tools/date-diff/",
    name: "Date Calculator",
    blurb: "Days between two dates (inclusive or not), add days, weeks or months to a date, and Monday–Friday business days",
    type: "date",
    icon: "calendar",
    basis: "math",
  },
  {
    href: "/en-sg/tools/compound/",
    ko: "/tools/compound/",
    name: "Compound Interest Calculator",
    blurb: "Grow a starting sum plus monthly deposits in Singapore dollars: interest earned, months to reach a savings goal, after-tax and inflation-adjusted balance",
    type: "money",
    icon: "chart",
    basis: "math",
  },
  {
    href: "/en-sg/tools/dday/",
    ko: "/tools/dday/",
    name: "Days Until Countdown",
    blurb: "How many days to go until Christmas, Deepavali, 2027, an exam or any date — a live countdown in days, hours and minutes",
    type: "date",
    icon: "calendar",
    basis: "math",
  },
  {
    href: "/en-sg/tools/unix-time/",
    ko: "/tools/unix-time/",
    name: "Unix Timestamp Converter",
    blurb: "A Unix timestamp in seconds or 13-digit milliseconds to a date in UTC or Singapore time on your device, and a date back to epoch time",
    type: "date",
    icon: "calendar",
    basis: "math",
  },
  {
    href: "/en-sg/tools/sec-convert/",
    ko: "/tools/sec-convert/",
    name: "Seconds to Minutes Converter",
    blurb: "Milliseconds, seconds, minutes, hours and days in one go, h:mm:ss, and overtime minutes as decimal hours",
    type: "date",
    icon: "calendar",
    basis: "math",
  },
  {
    href: "/en-sg/tools/debt-payoff/",
    ko: "/tools/debt-payoff/",
    name: "Debt Payoff Calculator",
    blurb: "Up to five debts in Singapore dollars with one monthly budget: avalanche vs snowball or your own order, the debt-free month and total interest",
    type: "money",
    icon: "chart",
    basis: "math",
  },
  {
    href: "/en-sg/tools/loss-recovery/",
    ko: "/tools/loss-recovery/",
    name: "Loss Recovery Calculator",
    blurb: "Gain needed to get back to cost after a loss in Singapore dollars, amount short, selling costs, recovery time at a yearly return, and max drawdown from closing prices",
    type: "money",
    icon: "chart",
    basis: "math",
  },
];
