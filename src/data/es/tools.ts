/**
 * Versión de España (/es/) — lista de herramientas. 한국어판 도감(src/data/tools.ts)과 따로 둔다 —
 * 스페인판에는 산술 도구와 스페인 원문(설정의 허용 출처: AEAT·BOE·Seguridad Social·Hacienda)으로 검증한 제도 도구만 들어온다.
 *
 * 새 페이지를 만들면 여기 한 줄. 계산이 같은 한국어판이 있으면 `ko` 에 그 주소 → hreflang 짝.
 * basis 는 "math"(산술, 나라 무관) 또는 "law"(스페인 원문으로 검증한 제도). 형식은 src/i18n/registry.ts.
 */
import type { LocaleTool } from "../../i18n/registry";

export const tools: LocaleTool[] = [
  {
    href: "/es/tools/percent/",
    ko: "/tools/percent/",
    name: "Calculadora de porcentajes",
    blurb: "Porcentaje de un número, aumento o disminución entre dos cantidades y precio con descuento",
    type: "unit",
    icon: "percent",
    basis: "math",
  },
  {
    href: "/es/tools/date-diff/",
    ko: "/tools/date-diff/",
    name: "Calcular días entre dos fechas",
    blurb: "Días entre dos fechas (con o sin el último día), sumar o restar días, semanas o meses y días de lunes a viernes",
    type: "date",
    icon: "calendar",
    basis: "math",
  },
  {
    href: "/es/tools/compound/",
    ko: "/tools/compound/",
    name: "Calculadora de interés compuesto",
    blurb: "Capital inicial y aportación mensual: capital final, intereses, inflación y tabla por años",
    type: "money",
    icon: "chart",
    basis: "math",
  },
  {
    href: "/es/tools/dday/",
    ko: "/tools/dday/",
    name: "Cuenta atrás: cuántos días faltan",
    blurb: "Cuántos días faltan para una fecha — cuenta atrás en directo en días, horas y minutos, o contando hoy como día 1",
    type: "date",
    icon: "calendar",
    basis: "math",
  },
  {
    href: "/es/tools/unix-time/",
    ko: "/tools/unix-time/",
    name: "Convertir timestamp Unix a fecha",
    blurb: "Timestamp Unix en segundos o milisegundos a fecha y hora (UTC o tu zona horaria), y una fecha a timestamp",
    type: "date",
    icon: "calendar",
    basis: "math",
  },
  {
    href: "/es/tools/sec-convert/",
    ko: "/tools/sec-convert/",
    name: "Convertir segundos a minutos y horas",
    blurb: "Segundos, minutos, horas, días y milisegundos a la vez, horas, minutos y segundos, y horas decimales a sexagesimales",
    type: "date",
    icon: "calendar",
    basis: "math",
  },
];
