/**
 * 영국판(/en-gb/) 도구 목록. 한국어판 도감(src/data/tools.ts)과 따로 둔다 —
 * 영국판에는 산술 도구와 영국 원문(gov.uk·legislation.gov.uk)으로 검증된 제도 도구만 들어온다.
 *
 * 새 영국판 페이지를 만들면 여기 한 줄. 계산이 같은 한국어판이 있으면 `ko` 에 그 주소 → hreflang 짝.
 * basis 는 "math"(산술, 나라 무관) 또는 "law"(영국 원문으로 검증한 제도). 형식은 src/i18n/registry.ts.
 */
import type { LocaleTool } from "../../i18n/registry";

export const tools: LocaleTool[] = [
  {
    href: "/en-gb/tools/percent/",
    ko: "/tools/percent/",
    name: "Percentage calculator",
    blurb: "Work out a percentage of a number, percentage increase or decrease, a price after a discount and the original value",
    type: "unit",
    icon: "percent",
    basis: "math",
  },
  {
    href: "/en-gb/tools/date-diff/",
    ko: "/tools/date-diff/",
    name: "Date calculator",
    blurb: "Days between two dates (inclusive or not), add or subtract days, weeks and months, weekdays Monday to Friday",
    type: "date",
    icon: "calendar",
    basis: "math",
  },
  {
    href: "/en-gb/tools/compound/",
    ko: "/tools/compound/",
    name: "Compound interest calculator",
    blurb: "Grow a lump sum plus monthly savings in pounds: interest earned, AER conversion, after-tax and inflation-adjusted balance",
    type: "money",
    icon: "chart",
    basis: "math",
  },
  {
    href: "/en-gb/tools/dday/",
    ko: "/tools/dday/",
    name: "Days until countdown",
    blurb: "How many days are left until Christmas, a birthday or any date — a live countdown in days, hours and minutes",
    type: "date",
    icon: "calendar",
    basis: "math",
  },
  {
    href: "/en-gb/tools/unix-time/",
    ko: "/tools/unix-time/",
    name: "Unix timestamp converter",
    blurb: "Epoch time in seconds or 13-digit milliseconds to a UK-format date in UTC or your time zone (GMT/BST), and back",
    type: "date",
    icon: "calendar",
    basis: "math",
  },
  {
    href: "/en-gb/tools/sec-convert/",
    ko: "/tools/sec-convert/",
    name: "Seconds to minutes converter",
    blurb: "Milliseconds, seconds, minutes, hours and days side by side, h:mm:ss and a decimal hours chart for UK timesheets",
    type: "date",
    icon: "calendar",
    basis: "math",
  },
  {
    href: "/en-gb/vat/",
    name: "VAT calculator",
    blurb: "Add or remove UK VAT at 20% or 5% — net, VAT and gross in pounds, using HMRC's VAT fraction and penny rounding",
    type: "tax",
    icon: "calculator",
    basis: "law",
  },
  {
    href: "/en-gb/holiday-entitlement/",
    name: "Holiday entitlement calculator",
    blurb: "UK statutory annual leave: 5.6 weeks capped at 28 days, part-time and hours, first-year accrual, leaving a job and 12.07% irregular hours",
    type: "labor",
    icon: "calendar",
    basis: "law",
  },
  {
    href: "/en-gb/shared-parental-pay/",
    name: "Shared Parental Pay calculator",
    blurb: "UK Statutory Shared Parental Pay: £194.32 a week or 90% of average weekly earnings, the daily rate and ShPP weeks left",
    type: "labor",
    icon: "calculator",
    basis: "law",
  },
];
