/**
 * 도구 검색 — 이름·동의어를 브라우저 안에서 찾는다(서버 없음, 설계 5절).
 *
 *   초성      ㅅㅅㄹㅇ → 실수령액. 초성과 완성형을 섞어 쳐도 글자마다 맞춘다(ㅅㅅ령)
 *   띄어쓰기  무시. 대소문자·전각 숫자도 무시(NFKC)
 *   순위      이름 앞부분 일치 > 이름 안 일치 > 동의어 일치. 같은 점수면 공개 도구, 그다음 도감 번호 순
 */
import type { Tool } from "../data/tools";

const CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
const SYL0 = 0xac00;
const SYLN = 11172;

const choOf = (c: string): string => {
  const code = c.charCodeAt(0) - SYL0;
  return code >= 0 && code < SYLN ? CHO[Math.floor(code / 588)] : c;
};
const isCho = (c: string) => CHO.includes(c);

export function toChoseong(s: string): string {
  return [...s].map(choOf).join("");
}

/** NFKC 는 호환 자모(ㅅ)를 조합용 자모로 바꿔 초성 비교를 깨뜨린다 — 자모는 그대로 둔다 */
const fold = (s: string): string =>
  [...s].map((c) => (/[ㄱ-ㆎ]/.test(c) ? c : c.normalize("NFKC"))).join("").toLowerCase();

export function normalize(s: string): string {
  return fold(s).replace(/\s+/g, "");
}

/** target 안에서 q(정규화된 것)가 시작하는 원래 글자 구간. 초성 글자는 그 자리 글자의 초성과 맞춘다 */
function matchIn(target: string, q: string): [number, number] | null {
  const chars: { c: string; i: number }[] = [];
  // 글자마다 접어서 원래 위치를 지킨다(전각 '％' → '%' 처럼 길이가 바뀌어도 칠하기 구간이 맞게)
  let i = 0;
  for (const orig of target) {
    for (const c of fold(orig)) if (!/\s/.test(c)) chars.push({ c, i });
    i += orig.length;
  }
  const qs = [...q];
  for (let s = 0; s + qs.length <= chars.length; s++) {
    let ok = true;
    for (let k = 0; k < qs.length; k++) {
      const t = chars[s + k].c;
      if (!(t === qs[k] || (isCho(qs[k]) && choOf(t) === qs[k]))) { ok = false; break; }
    }
    if (ok) return [chars[s].i, chars[s + qs.length - 1].i + 1]; // 끝 글자는 BMP(한글·숫자)라 길이 1
  }
  return null;
}

export interface Hit {
  tool: Tool;
  /** 이름 안 일치 구간(칠하기용). 동의어로만 맞았으면 빈 배열 */
  ranges: [number, number][];
}

export function searchTools(list: Tool[], query: string, limit = 8): Hit[] {
  const q = normalize(query);
  if (!q) return [];
  const scored: { hit: Hit; score: number }[] = [];
  for (const tool of list) {
    const r = matchIn(tool.name, q);
    let score = 0;
    if (r) score = r[0] === 0 || tool.name.slice(0, r[0]).trim() === "" ? 400 : 300;
    else if (tool.keywords.some((k) => matchIn(k, q))) score = 150;
    if (score) scored.push({ hit: { tool, ranges: r ? [r] : [] }, score });
  }
  scored.sort((a, b) =>
    (a.hit.tool.status === b.hit.tool.status ? 0 : a.hit.tool.status === "live" ? -1 : 1) ||
    b.score - a.score ||
    (a.hit.tool.no ?? 1e9) - (b.hit.tool.no ?? 1e9),
  );
  return scored.slice(0, limit).map((s) => s.hit);
}
