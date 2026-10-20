/**
 * 프랑스어판(/fr/) 도구 목록. 한국어판 도감(src/data/tools.ts)과 따로 둔다 —
 * 프랑스판에는 산술 도구와 프랑스 원문(설정의 허용 출처: impots.gouv.fr·service-public.fr·legifrance.gouv.fr·urssaf.fr·economie.gouv.fr)으로 검증한 제도 도구만 들어온다.
 *
 * 새 페이지를 만들면 여기 한 줄. 계산이 같은 한국어판이 있으면 `ko` 에 그 주소 → hreflang 짝.
 * basis 는 "math"(산술, 나라 무관) 또는 "law"(프랑스 원문으로 검증한 제도). 형식은 src/i18n/registry.ts.
 */
import type { LocaleTool } from "../../i18n/registry";

export const tools: LocaleTool[] = [
  {
    href: "/fr/tools/percent/",
    ko: "/tools/percent/",
    name: "Calcul de pourcentage",
    blurb: "Pourcentage d’un nombre, pourcentage d’évolution entre deux valeurs et prix après une remise",
    type: "unit",
    icon: "percent",
    basis: "math",
  },
];
