/**
 * OG 이미지 파일 이름 규칙.
 *
 * 생성기(social/render-og.mjs)와 <head>(BaseHead)가 같은 규칙을 써야
 * 이미지가 붙는다. 한쪽만 바뀌면 조용히 404가 되므로 여기 한 곳에 둔다.
 *
 *   /                      → home
 *   /vat/                  → vat
 *   /guide/vat-filing/     → guide-vat-filing
 */
export function ogSlug(path: string): string {
  const clean = path.split("?")[0].split("#")[0];
  const parts = clean.split("/").filter(Boolean);
  return parts.length === 0 ? "home" : parts.join("-");
}

/** 페이지 경로 → OG 이미지의 사이트 내 절대 경로. */
export function ogPath(path: string): string {
  return `/og/${ogSlug(path)}.png`;
}

