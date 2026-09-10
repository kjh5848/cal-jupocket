/**
 * 카드 문구 안의 강조 표시를 파싱한다.
 *
 * 실제로 성과가 나온 게시물들이 쓰는 강조는 두 가지뿐이었다 — 형광펜(노랑)과
 * 경고(빨강). 그 두 개만 지원한다.
 *
 *   [[텍스트]]  형광펜
 *   {{텍스트}}  경고(빨강)
 *
 * 데이터 파일에 raw HTML을 두지 않으려고 만든 최소 문법이다. 카드는 이미지로
 * 구워져 나가므로, 여기서 조용히 깨지면 발행 후에야 알게 된다 — 그래서 테스트로 묶는다.
 */
export type Emphasis = "none" | "mark" | "warn";

export interface Token {
  text: string;
  emphasis: Emphasis;
}

const PATTERN = /\[\[(.+?)\]\]|\{\{(.+?)\}\}/g;

export function parseMarkup(input: string): Token[] {
  const tokens: Token[] = [];
  let last = 0;

  for (const m of input.matchAll(PATTERN)) {
    const at = m.index ?? 0;
    if (at > last) tokens.push({ text: input.slice(last, at), emphasis: "none" });
    tokens.push({
      text: m[1] ?? m[2],
      emphasis: m[1] !== undefined ? "mark" : "warn",
    });
    last = at + m[0].length;
  }

  if (last < input.length) {
    tokens.push({ text: input.slice(last), emphasis: "none" });
  }
  return tokens;
}
