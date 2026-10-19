/**
 * 같은 일을 하는 한국어판·일본어판 주소 짝 — <link rel="alternate" hreflang> 의 근거.
 *
 * 짝은 **계산이 같은 페이지끼리만** 맺는다. 퍼센트 계산기처럼 나라와 상관없는 도구는
 * 짝이 되지만, 한국 상속세 글과 일본 相続税 글은 짝이 아니다 — 같은 주제라도 다른
 * 제도라 서로의 번역판이 아니고, hreflang 으로 묶으면 검색엔진이 한쪽을 다른 쪽의
 * 대체품으로 여긴다. 그런 글은 짝 없이 각자 선다.
 *
 * 짝은 양방향으로 쓰인다(한쪽에만 적으면 hreflang 이 무시된다) — 이 표 하나에서
 * 양쪽 태그를 다 만든다. 새 일본어 페이지를 만들면 여기 한 줄을 더한다.
 */
import type { Locale } from "./ui";

export const PAIRS: { ko: string; ja: string }[] = [
  { ko: "/", ja: "/ja/" },
  { ko: "/tools/percent/", ja: "/ja/tools/percent/" },
  { ko: "/tools/date-diff/", ja: "/ja/tools/date-diff/" },
  { ko: "/tools/compound/", ja: "/ja/tools/compound/" },
  { ko: "/tools/dday/", ja: "/ja/tools/dday/" },
];

/** 이 주소와 같은 페이지의 각 언어판. 짝이 없으면 빈 객체 */
export function alternatesFor(path: string): Partial<Record<Locale, string>> {
  const p = PAIRS.find((x) => x.ko === path || x.ja === path);
  return p ? { ko: p.ko, ja: p.ja } : {};
}
