/**
 * RSS 2.0 — 네이버 서치어드바이저 제출용.
 *
 * 네이버는 사이트맵과 별개로 RSS 를 받아 새 글을 빨리 수집한다. 가이드 글만
 * 싣는다. 계산기는 날짜가 없고(사이트맵과 같은 이유로 지어내지 않는다),
 * 카드뉴스는 글의 요약이라 원문 쪽을 내보낸다.
 *
 * pubDate 는 원문 확인일(updated)이다. 날짜를 못 읽은 글은 싣지 않는다 —
 * 오늘 날짜로 채우면 배포할 때마다 전부 새 글처럼 보인다.
 */
import { guideMeta } from "../lib/guide-meta";

const SITE = "https://jupocket.com";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** 한국 시간 자정으로 둔다. 확인일은 날짜만 있고 시각이 없다. */
const rfc822 = (d: string) => new Date(`${d}T00:00:00+09:00`).toUTCString();

export function GET() {
  const items = guideMeta().filter((g) => g.updated);
  const latest = items[0]?.updated;
  const body = items
    .map(
      (g) => `    <item>
      <title>${esc(g.title)}</title>
      <link>${SITE}${g.path}</link>
      <guid isPermaLink="true">${SITE}${g.path}</guid>
      <description>${esc(g.description)}</description>
      <pubDate>${rfc822(g.updated!)}</pubDate>
    </item>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>주포켓 — 세금 가이드</title>
    <link>${SITE}/</link>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml" />
    <description>조문 원문으로 확인한 세금 가이드. 직장인·사장님·자영업자·프리랜서.</description>
    <language>ko</language>
${latest ? `    <lastBuildDate>${rfc822(latest)}</lastBuildDate>\n` : ""}${body}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
