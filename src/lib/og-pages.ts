/**
 * 어떤 경로에 전용 OG 이미지가 있는가.
 *
 * clusters.ts 를 읽어야 해서 og.ts 와 분리해 둔다. og.ts 는 생성기
 * (social/render-og.mjs)가 순수 node 로 불러오는데, 거기서 clusters 까지
 * 딸려오면 확장자 없는 import 때문에 모듈 해석이 깨진다.
 */
import { clusters } from "../data/clusters";
import { ogSlug } from "./og";

const generated = new Set<string>([
  "home",
  ...clusters.flatMap((c) => c.links.map((l) => ogSlug(l.href))),
]);

/**
 * 생성기는 clusters 의 링크와 홈만 굽는다. /privacy/, /link/ 처럼 굽지
 * 않는 페이지가 자기 이름의 이미지를 가리키면 공유했을 때 깨진 채로
 * 나가므로, 없으면 홈 이미지로 떨어뜨린다.
 */
export function ogPathFor(path: string): string {
  const slug = ogSlug(path);
  return `/og/${generated.has(slug) ? slug : "home"}.png`;
}
