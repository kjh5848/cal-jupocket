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

/**
 * 이 경로에 전용 OG 이미지가 있는가.
 *
 * 생성기는 clusters.ts 의 링크와 홈만 굽는다. /privacy/, /link/ 처럼
 * 굽지 않는 페이지가 자기 이름의 이미지를 가리키면 공유했을 때 깨진 채로
 * 나가므로, 없으면 홈 이미지로 떨어뜨린다.
 */
import { clusters } from "../data/clusters";

const generated = new Set<string>([
  "home",
  ...clusters.flatMap((c) => c.links.map((l) => ogSlug(l.href))),
]);

export function ogPathFor(path: string): string {
  const slug = ogSlug(path);
  return `/og/${generated.has(slug) ? slug : "home"}.png`;
}
