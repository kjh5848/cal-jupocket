/**
 * 독일어판(/de/) 도구 목록. 한국어판 도감(src/data/tools.ts)과 따로 둔다 —
 * 독일어판에는 산술 도구와 독일 원문(설정의 허용 출처: BMF·gesetze-im-internet·DRV·Bundesregierung·Arbeitsagentur)으로 검증한 제도 도구만 들어온다.
 *
 * 새 페이지를 만들면 여기 한 줄. 계산이 같은 한국어판이 있으면 `ko` 에 그 주소 → hreflang 짝.
 * basis 는 "math"(산술, 나라 무관) 또는 "law"(독일 원문으로 검증한 제도). 형식은 src/i18n/registry.ts.
 */
import type { LocaleTool } from "../../i18n/registry";

export const tools: LocaleTool[] = [
  {
    href: "/de/tools/percent/",
    ko: "/tools/percent/",
    name: "Prozentrechner",
    blurb: "Prozentwert, Prozentsatz und Grundwert, prozentuale Veränderung und der Preis nach Rabatt",
    type: "unit",
    icon: "percent",
    basis: "math",
  },
  {
    href: "/de/tools/date-diff/",
    ko: "/tools/date-diff/",
    name: "Tagerechner",
    blurb: "Tage zwischen zwei Daten, Datum plus Tage, Wochen und Montag bis Freitag",
    type: "date",
    icon: "calendar",
    basis: "math",
  },
  {
    href: "/de/tools/compound/",
    ko: "/tools/compound/",
    name: "Zinseszinsrechner",
    blurb: "Startkapital plus monatliche Sparrate: Endkapital, Zinsen, Inflation und Tabelle pro Jahr",
    type: "money",
    icon: "chart",
    basis: "math",
  },
  {
    href: "/de/tools/dday/",
    ko: "/tools/dday/",
    name: "Countdown-Rechner",
    blurb: "Wie viele Tage noch bis Heiligabend, Silvester oder einem beliebigen Datum — mit Stunden und Minuten",
    type: "date",
    icon: "calendar",
    basis: "math",
  },
  {
    href: "/de/tools/unix-time/",
    ko: "/tools/unix-time/",
    name: "Unix-Timestamp-Rechner",
    blurb: "Unix-Zeit in Datum und Uhrzeit umrechnen und zurück — Sekunden oder Millisekunden, UTC oder Ihre Zeitzone",
    type: "date",
    icon: "calendar",
    basis: "math",
  },
  {
    href: "/de/tools/sec-convert/",
    ko: "/tools/sec-convert/",
    name: "Sekunden in Minuten umrechnen",
    blurb: "Millisekunden, Sekunden, Minuten, Stunden und Tage umrechnen — mit Industriestunden und h:mm:ss",
    type: "date",
    icon: "calendar",
    basis: "math",
  },
  {
    href: "/de/tools/debt-payoff/",
    ko: "/tools/debt-payoff/",
    name: "Schuldenabbau-Rechner",
    blurb: "Mehrere Kredite abbezahlen: Lawinen- oder Schneeballmethode, Monat der Schuldenfreiheit und Zinsen gesamt",
    type: "money",
    icon: "chart",
    basis: "math",
  },
  {
    href: "/de/tools/loss-recovery/",
    ko: "/tools/loss-recovery/",
    name: "Verlust-Aufhol-Rechner",
    blurb: "Wie viel Gewinn nach einem Verlust nötig ist: nötiger Prozentsatz, fehlender Betrag, Aufholdauer und Max Drawdown aus Kursen",
    type: "money",
    icon: "chart",
    basis: "math",
  },
];
