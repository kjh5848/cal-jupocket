/**
 * /llms.txt — AI 도구가 사이트를 한눈에 읽게 하는 안내문(llmstxt.org 형식의 마크다운).
 *
 * 효과가 입증된 표준은 아니지만 만드는 비용이 없다. 목록은 손으로 적지 않고 clusters·나라판 목록에서
 * 만든다 — 손으로 적으면 새 계산기가 빠진다. 계산기와 각 주제의 첫 설명 글만 싣는다(전체 목록은 사이트맵).
 */
import type { APIRoute } from "astro";
import { clusters } from "../data/clusters";
import { LOCALE_META } from "../i18n/locales";
import { toolsOf, openLocales } from "../i18n/registry";
import { ui } from "../i18n/ui";

export const GET: APIRoute = ({ site }) => {
  const base = site!.href.replace(/\/$/, "");
  const lines: string[] = [
    "# 주포켓 (jupocket)",
    "",
    "> 한국 세금·급여·연금·부동산 계산기와 설명 글. 세율·한도·기한은 국가법령정보센터 원문과 국세청·국민연금공단 등 기관 안내로 확인한 것만 쓰고, 글마다 확인일(기준일)과 출처를 적는다. 계산 결과는 참고용 예상치다.",
    "",
    `숫자 확인 원칙: ${base}/about/`,
    "",
  ];
  for (const c of clusters) {
    const calcs = c.links.filter((l) => l.kind === "calc");
    const firstGuide = c.links.find((l) => l.kind === "guide");
    if (!calcs.length && !firstGuide) continue;
    lines.push(`## ${c.title}`, "");
    for (const l of calcs) lines.push(`- [${l.title}](${base}${l.href})${l.blurb ? `: ${l.blurb}` : ""}`);
    if (firstGuide) lines.push(`- [${firstGuide.title}](${base}${firstGuide.href})`);
    lines.push("");
  }
  const other = openLocales.filter((l) => l !== "ko");
  if (other.length) {
    lines.push("## Other country editions (written from each country's official sources, not translations)", "");
    for (const l of other) {
      const m = LOCALE_META.find((x) => x.locale === l)!;
      lines.push(`- [${ui(l).langName}](${base}${m.prefix}): ${toolsOf(l).length} tools`);
    }
    lines.push("");
  }
  lines.push("## Optional", "", `- [Sitemap](${base}/sitemap-index.xml)`, "");
  return new Response(lines.join("\n"), { headers: { "content-type": "text/plain; charset=utf-8" } });
};
