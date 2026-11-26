/**
 * 검색에서 빼는 나라판 도구 — 같은 도구 7종을 12개 나라 말로 옮긴 84쪽.
 *
 * 2026-11-01 에 구글 노출이 사이트 전체에서 사라졌다(10-21~31 23,384회 → 11-01~10 82회).
 * 직접 조치·보안 문제는 없었고(2026-11-27 서치 콘솔 확인), 색인도 남아 있었다.
 * 급락 전 10월 노출의 89%가 나라판이었는데 클릭은 27회뿐이었다. 그중 대부분이
 * 아래 7종 — 나라만 다르고 계산이 같은 산술 도구다. 사이트가 "찍어 낸 페이지 묶음"으로
 * 읽히는 요인을 줄이려고 이 84쪽만 noindex 로 돌린다(사용자 결정, 2026-11-27).
 *
 * 페이지는 그대로 열린다. 검색 결과와 사이트맵, 다른 판의 hreflang 에서만 뺀다.
 * 그 나라 제도를 원문으로 확인해 쓴 글(미국 FICA·영국 인지세·일본 iDeCo 등)과
 * 일본 전용 도구, 나라별 첫 화면은 건드리지 않는다. 한국어판(/tools/…)도 그대로다.
 *
 * 되돌리려면 TOOLS 에서 빼면 된다. 다시 색인되는 데는 몇 주가 걸린다.
 *
 * .mjs 인 이유: astro.config.mjs 의 사이트맵 필터와 BaseHead 가 같은 규칙을 읽어야 한다.
 */
const LOCALES = ["ja", "en-us", "en-gb", "en-ca", "en-au", "en-sg", "de", "fr", "es", "zh-tw", "zh-hk", "id"];
const TOOLS = ["compound", "date-diff", "dday", "debt-payoff", "percent", "sec-convert", "unix-time"];

const RE = new RegExp(`^/(${LOCALES.join("|")})/tools/(${TOOLS.join("|")})/?$`);

/** 경로(또는 전체 주소)가 검색에서 빼는 나라판 도구인가. */
export function isSearchExcluded(pathOrUrl) {
  const s = String(pathOrUrl ?? "");
  const path = /^https?:\/\//.test(s) ? new URL(s).pathname : s;
  return RE.test(path);
}
