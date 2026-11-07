/**
 * 합친 글 → 들어간 허브(2026-11-07 쪼갠 글 합치기).
 *
 * public/_redirects 의 "/guide/<글>/ /guide/<허브>/#<글>" 줄에서 읽는다 — 리다이렉트가 단 하나의 원본이다.
 * seriesHref·irpHref 처럼 slug 로 주소를 조립하는 곳이 이 표를 거쳐 합친 글을 허브의 섹션으로 보낸다.
 */
import redirects from "../../public/_redirects?raw";

export const mergedInto: Record<string, string> = Object.fromEntries(
  [...redirects.matchAll(/^\/guide\/([a-z0-9-]+)\/\s+\/guide\/([a-z0-9-]+)\/#\1\s+301/gm)].map((m) => [m[1], m[2]]),
);

/** slug 의 실제 주소 — 합쳐졌으면 허브의 #섹션 */
export const guideHref = (slug: string) => (mergedInto[slug] ? `/guide/${mergedInto[slug]}/#${slug}` : `/guide/${slug}/`);
