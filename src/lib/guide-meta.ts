/**
 * 가이드 글의 제목·설명·확인일을 소스에서 읽는다.
 *
 * RSS(`/rss.xml`)가 쓴다. 글마다 메타를 따로 적어 두면 반드시 한쪽이
 * 낡으므로, 각 글이 이미 들고 있는 `const title` · `const description` ·
 * `updated` 를 그대로 읽는다. 날짜를 푸는 방식은 `astro.config.mjs` 의
 * `guideDates()` 와 같다 — 리터럴이면 그대로, `{r.verifiedOn}` 이면 import
 * 를 따라가 그 rates JSON 의 verifiedOn 을 읽는다.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface GuideMeta {
  slug: string;
  path: string;
  title: string;
  description: string;
  /** YYYY-MM-DD. 원문 확인일. 못 읽으면 null. */
  updated: string | null;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function resolveUpdated(src: string, dir: string): string | null {
  const lit = src.match(/updated="(\d{4}-\d{2}-\d{2})"/);
  if (lit) return lit[1];
  const ident = src.match(/updated=\{(\w+)\.verifiedOn\}/)?.[1];
  if (!ident) return null;
  const rel = src.match(new RegExp(`import\\s+${ident}\\s+from\\s+["']([^"']+\\.json)["']`))?.[1];
  if (!rel) return null;
  const file = join(dir, rel);
  if (!existsSync(file)) return null;
  const v = JSON.parse(readFileSync(file, "utf8")).verifiedOn;
  return typeof v === "string" && DATE.test(v) ? v : null;
}

export function guideMeta(root = process.cwd()): GuideMeta[] {
  const base = join(root, "src", "pages", "guide");
  if (!existsSync(base)) return [];
  const out: GuideMeta[] = [];
  for (const slug of readdirSync(base)) {
    const dir = join(base, slug);
    const file = join(dir, "index.astro");
    if (!existsSync(file)) continue;
    const src = readFileSync(file, "utf8");
    const title = src.match(/^const title = "([^"]+)";/m)?.[1];
    const description = src.match(/const description =\s*"([^"]+)";/)?.[1];
    if (!title || !description) continue;
    out.push({
      slug,
      path: `/guide/${slug}/`,
      title,
      description,
      updated: resolveUpdated(src, dir),
    });
  }
  // 최근 확인일 먼저. 같은 날이면 제목 순으로 고정해 빌드마다 순서가 흔들리지 않게.
  return out.sort(
    (a, b) => (b.updated ?? "").localeCompare(a.updated ?? "") || a.title.localeCompare(b.title, "ko"),
  );
}
