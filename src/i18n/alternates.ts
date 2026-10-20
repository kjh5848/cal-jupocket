/**
 * 같은 일을 하는 각 판의 주소 — <link rel="alternate" hreflang> 와 헤더 언어 메뉴의 근거.
 *
 * 짝은 **계산이 같은 페이지끼리만** 맺는다. 퍼센트 계산기처럼 나라와 상관없는 도구는 짝이 되지만,
 * 한국 상속세 글과 일본 相続税 글은 짝이 아니다 — 같은 주제라도 다른 제도라 서로의 번역판이 아니고,
 * hreflang 으로 묶으면 검색엔진이 한쪽을 다른 쪽의 대체품으로 여긴다. 그런 글은 짝 없이 각자 선다.
 *
 * 짝은 각 판 도구 목록(src/data/<판>/tools.ts)의 `ko` 칸에서 만든다. 홈은 열린 판끼리 서로 짝이다.
 * 짝은 양방향으로 쓰인다(한쪽에만 적으면 hreflang 이 무시된다) — 같은 표에서 양쪽 태그가 다 나온다.
 */
import { LOCALES, meta, type Locale } from "./locales";
import { toolsByLocale, openLocales } from "./registry";

/** 이 주소와 같은 페이지의 각 판. 짝이 없으면 빈 객체 */
export function alternatesFor(path: string): Partial<Record<Locale, string>> {
  const homeOf = openLocales.find((l) => meta(l).prefix === path);
  if (homeOf && openLocales.length > 1) return Object.fromEntries(openLocales.map((l) => [l, meta(l).prefix]));

  let ko: string | undefined;
  for (const l of LOCALES) {
    const t = toolsByLocale[l]?.find((x) => x.href === path || x.ko === path);
    if (t?.ko) { ko = t.ko; break; }
  }
  if (!ko) return {};
  const out: Partial<Record<Locale, string>> = { ko };
  for (const l of LOCALES) {
    const t = toolsByLocale[l]?.find((x) => x.ko === ko);
    if (t) out[l] = t.href;
  }
  return Object.keys(out).length > 1 ? out : {};
}
