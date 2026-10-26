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
  {
    href: "/en-au/tools/date-diff/",
    ko: "/tools/date-diff/",
    name: "Days Between Dates Calculator",
    blurb: "Days between two dates (inclusive or not), add days, weeks or months to a date, and Monday–Friday working days",
    type: "date",
    icon: "calendar",
    basis: "math",
  },
  {
    href: "/en-au/tools/compound/",
    ko: "/tools/compound/",
    name: "Compound Interest Calculator",
    blurb: "Grow a starting balance plus monthly deposits in dollars: interest earned, daily vs monthly compounding, after-tax and inflation-adjusted balance",
    type: "money",
    icon: "chart",
    basis: "math",
  },
  {
    href: "/en-au/tools/dday/",
    ko: "/tools/dday/",
    name: "Days Until Countdown",
    blurb: "How many days are left until Christmas, 2027, a birthday or any date — a live countdown in days, hours and minutes",
    type: "date",
    icon: "calendar",
    basis: "math",
  },
  {
    href: "/en-au/tools/unix-time/",
    ko: "/tools/unix-time/",
    name: "Epoch Time Converter",
    blurb: "A Unix timestamp in seconds or 13-digit milliseconds to a date in UTC or your device's time zone, and a date back to epoch time",
    type: "date",
    icon: "calendar",
    basis: "math",
  },
  {
    href: "/en-au/tools/sec-convert/",
    ko: "/tools/sec-convert/",
    name: "Seconds to Minutes Converter",
    blurb: "Milliseconds, seconds, minutes, hours and days at once, plus decimal hours for timesheets read as hours and minutes",
    type: "date",
    icon: "calendar",
    basis: "math",
  },
  {
    href: "/en-au/tools/debt-payoff/",
    ko: "/tools/debt-payoff/",
    name: "Debt Repayment Calculator",
    blurb: "Several credit cards and loans at once: debt avalanche vs snowball or your own order, extra repayments, the month you're debt-free and total interest",
    type: "money",
    icon: "chart",
    basis: "math",
  },
  {
    href: "/en-au/tools/loss-recovery/",
    ko: "/tools/loss-recovery/",
    name: "Loss Recovery Calculator",
    blurb: "The gain needed to get back to even after a loss, dollars short, years to recover at different returns, and maximum drawdown from daily closing prices",
    type: "money",
    icon: "chart",
    basis: "math",
  },
];
