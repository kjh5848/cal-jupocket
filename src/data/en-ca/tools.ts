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
  {
    href: "/en-ca/tools/date-diff/",
    ko: "/tools/date-diff/",
    name: "Days Between Dates Calculator",
    blurb: "Days between two dates (with or without the end date), add days, weeks or months to a date, and Monday–Friday business days",
    type: "date",
    icon: "calendar",
    basis: "math",
  },
  {
    href: "/en-ca/tools/compound/",
    ko: "/tools/compound/",
    name: "Compound Interest Calculator",
    blurb: "Grow a starting balance plus monthly deposits in Canadian dollars: interest earned, daily vs monthly compounding, TFSA and GIC notes, after-tax and inflation-adjusted balance",
    type: "money",
    icon: "chart",
    basis: "math",
  },
  {
    href: "/en-ca/tools/dday/",
    ko: "/tools/dday/",
    name: "Days Until Countdown",
    blurb: "How many days are left until Christmas, Boxing Day, a birthday or any date in Canada — with a live countdown in days, hours and minutes",
    type: "date",
    icon: "calendar",
    basis: "math",
  },
  {
    href: "/en-ca/tools/unix-time/",
    ko: "/tools/unix-time/",
    name: "Epoch Time Converter",
    blurb: "Turn a Unix timestamp in seconds or milliseconds into a date in UTC or your device's time zone (Eastern, Pacific…), and a date back into epoch time",
    type: "date",
    icon: "calendar",
    basis: "math",
  },
  {
    href: "/en-ca/tools/sec-convert/",
    ko: "/tools/sec-convert/",
    name: "Seconds to Minutes Converter",
    blurb: "Milliseconds, seconds, minutes, hours and days at once, h:mm:ss, and decimal hours for a Canadian timesheet or time card",
    type: "date",
    icon: "calendar",
    basis: "math",
  },
  {
    href: "/en-ca/tools/debt-payoff/",
    ko: "/tools/debt-payoff/",
    name: "Debt Payoff Calculator",
    blurb: "Credit cards, a line of credit and loans at once in Canadian dollars: avalanche vs snowball or your own order, extra payments, your debt-free date and total interest",
    type: "money",
    icon: "chart",
    basis: "math",
  },
];
