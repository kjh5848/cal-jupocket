/**
 * OG 이미지 생성 — 글마다 1200×630 PNG.
 *
 *   node social/render-og.mjs
 *
 * 브라우저를 띄우지 않는다. SVG 를 만들어 sharp(이미 의존성)로 굽는다.
 * 글이 14편이라 한 장씩 스크린샷을 뜨는 방식은 감당이 안 되고, 새 의존성
 * (Playwright, 브라우저 바이너리 300MB)을 들일 이유도 없다.
 *
 * 디자인은 글 상단 썸네일과 같다 — 페이지에서 본 그림이 공유했을 때도
 * 그대로 나와야 같은 글로 읽힌다. 색·아이콘·제목 모두 clusters.ts 에서
 * 오므로 글을 추가하면 여기도 자동으로 따라온다.
 *
 * 파일 이름 규칙은 src/lib/og.ts 가 갖는다 — BaseHead 와 같은 규칙을
 * 써야 하고, 한쪽만 바뀌면 조용히 404가 된다.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";
import { clusters, clusterColor } from "../src/data/clusters.ts";
import { icons } from "../src/data/icons.ts";
import { ogSlug } from "../src/lib/og.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "og");

const W = 1200;
const H = 630;
const PAD = 80;
const FONT = "Malgun Gothic, Apple SD Gothic Neo, Noto Sans KR, sans-serif";

/**
 * SVG 에는 자동 줄바꿈이 없어서 직접 끊는다. 한글은 글자폭이 거의 1em,
 * 라틴·숫자는 절반쯤이라 그 비율로 어림한다. 정확한 계측은 아니지만
 * 줄이 넘치는지 막는 데는 충분하고, 넘치면 마지막에 검사로 잡는다.
 */
function widthOf(text, size) {
  let w = 0;
  for (const ch of text) {
    if (ch === " ") w += size * 0.3;
    else if (/[\u3131-\uD79D\uAC00-\uD7A3]/.test(ch)) w += size;
    else w += size * 0.55;
  }
  return w;
}

/** 공백에서만 끊는다 — 한글 단어 중간을 자르면 읽기 나빠진다. */
function wrap(text, size, maxWidth, maxLines) {
  const words = text.split(" ");
  const lines = [];
  let cur = "";
  for (const word of words) {
    const next = cur ? `${cur} ${word}` : word;
    if (widthOf(next, size) > maxWidth && cur) {
      lines.push(cur);
      cur = word;
    } else {
      cur = next;
    }
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = kept[maxLines - 1].replace(/.$/, "…");
    return kept;
  }
  return lines;
}

const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function card({ title, clusterTitle, color, iconKey }) {
  const inner = icons[iconKey] ?? icons.document;

  // 제목 크기를 길이에 맞춰 낮춘다 — 긴 제목이 네 줄로 흘러내리지 않게.
  const size = title.length > 30 ? 62 : title.length > 20 ? 70 : 78;
  const maxTitleWidth = W - PAD * 2 - 120;
  const lines = wrap(title, size, maxTitleWidth, 3);
  const lineH = size * 1.32;
  // 제목 블록을 세로 가운데에 두되 상단 라벨과 하단 주소를 피한다.
  const blockH = lines.length * lineH;
  const startY = (H - blockH) / 2 + size * 0.82;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${color.bg}"/>
  <g transform="translate(${W - 300}, ${H - 330}) scale(11)" fill="none" stroke="${color.wm}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${inner}</g>
  <g transform="translate(${PAD}, 74)">
    <rect width="46" height="46" rx="12" fill="${color.mark}"/>
    <text x="23" y="33" text-anchor="middle" font-family="${FONT}" font-size="25" font-weight="700" fill="#ffffff">₩</text>
    <text x="62" y="32" font-family="${FONT}" font-size="26" font-weight="700" fill="${color.ink}">${esc(clusterTitle)}</text>
  </g>
  ${lines
    .map(
      (l, i) =>
        `<text x="${PAD}" y="${startY + i * lineH}" font-family="${FONT}" font-size="${size}" font-weight="700" fill="${color.ink}" letter-spacing="-1.5">${esc(l)}</text>`,
    )
    .join("\n  ")}
  <text x="${PAD}" y="${H - 62}" font-family="${FONT}" font-size="27" font-weight="700" fill="${color.mark}">jupocket.com</text>
</svg>`;
}

mkdirSync(OUT, { recursive: true });

const jobs = [];
for (const c of clusters) {
  for (const l of c.links) {
    jobs.push({
      slug: ogSlug(l.href),
      title: l.title,
      clusterTitle: c.title,
      color: clusterColor[c.id],
      iconKey: l.icon,
    });
  }
}
// 홈은 클러스터에 없으므로 따로 넣는다.
jobs.push({
  slug: "home",
  title: "복잡한 세금, 계산부터 판단까지",
  clusterTitle: "주포켓",
  color: clusterColor.vat,
  iconKey: "calculator",
});

let made = 0;
for (const job of jobs) {
  const svg = card(job);
  const file = join(OUT, `${job.slug}.png`);
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(file);
  made++;
  console.log(`  ${job.slug}.png  ${job.title}`);
}
console.log(`\n✓ ${made}장 → public/og/\n`);
