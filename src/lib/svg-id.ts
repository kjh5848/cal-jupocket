/** 빌드 중 SVG 내부 id 접두 — 한 페이지에 같은 그림이 여러 번 나와도 겹치지 않게. 결정적(빌드마다 같음). */
let n = 0;
export const nextId = (): number => ++n;
