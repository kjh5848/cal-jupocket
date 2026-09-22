/**
 * 유입 계측 테스트.
 *
 * 왜 두는가: 스레드 조회 9,237 에 사이트 세션 25 였는데(2026-09-16),
 * 그 25 를 어느 글이 만들었는지 알 방법이 없었다. 답글 링크에 표식이
 * 없었기 때문이다. 표식은 한 번 빠지면 그 기간 데이터가 통째로 사라지고
 * 되돌릴 수 없다 — 이미 나간 글에 소급해 붙일 수 없다. 그래서 막아 둔다.
 *
 * 두 번째 묶음(실제 큐 파일)이 핵심이다. 새 글에 ref 를 빠뜨리면 조용히
 * 옛 동작으로 돌아가 계측 없이 나간다. 그걸 여기서 잡는다.
 */
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  parsePost,
  withUtm,
  campaignOf,
  replySentence,
  resolveReply,
  findBodyLink,
  SITE,
} from "../parse.mjs";

describe("withUtm", () => {
  it("source·medium·campaign 을 붙인다", () => {
    const u = new URL(
      withUtm(`${SITE}/guide/vat-penalty/`, { source: "threads", campaign: "022" }),
    );
    expect(u.origin + u.pathname).toBe(`${SITE}/guide/vat-penalty/`);
    expect(u.searchParams.get("utm_source")).toBe("threads");
    expect(u.searchParams.get("utm_medium")).toBe("social");
    expect(u.searchParams.get("utm_campaign")).toBe("022");
  });

  it("campaign 이 없으면 그 칸만 뺀다", () => {
    const u = new URL(withUtm(`${SITE}/`, { source: "threads" }));
    expect(u.searchParams.has("utm_campaign")).toBe(false);
    expect(u.searchParams.get("utm_source")).toBe("threads");
  });
});

describe("campaignOf", () => {
  it("파일 이름 앞 일련번호를 쓴다", () => {
    expect(campaignOf("022-vat-penalty-supply-base.md")).toBe("022");
    expect(campaignOf("001-pension-premium.md")).toBe("001");
  });

  it("번호가 없으면 null — 캠페인 칸을 비운다", () => {
    expect(campaignOf("draft.md")).toBeNull();
    expect(campaignOf(undefined)).toBeNull();
  });
});

describe("replySentence", () => {
  it("손으로 쓴 링크 안내 꼬리를 뗀다", () => {
    expect(
      replySentence("기준이 공급가액이라 그렇습니다. 프로필 링크에서 24번 글입니다 → jupocket.com/link/"),
    ).toBe("기준이 공급가액이라 그렇습니다.");
  });

  it("꼬리에 링크가 없어도 뗀다", () => {
    expect(replySentence("정리해 뒀어요. 프로필 링크에서 13번 글입니다")).toBe("정리해 뒀어요.");
  });

  it("꼬리가 없으면 그대로 둔다", () => {
    expect(replySentence("정리해 뒀어요.")).toBe("정리해 뒀어요.");
  });
});

describe("resolveReply", () => {
  const meta = {
    reply: "기준이 공급가액이라 그렇습니다. 프로필 링크에서 24번 글입니다 → jupocket.com/link/",
    ref: "/guide/vat-penalty/",
    ref_no: "24",
  };
  const file = "022-vat-penalty-supply-base.md";

  it("스레드는 글 주소를 직접 건다 — 링크가 눌리기 때문", () => {
    const out = resolveReply(meta, { platform: "threads", file });
    expect(out).toContain(`${SITE}/guide/vat-penalty/`);
    expect(out).toContain("utm_campaign=022");
    // 프로필을 거치게 하지 않는다. 한 번 더 건너뛰면 그만큼 샌다.
    expect(out).not.toContain("프로필 링크");
  });

  it("인스타는 프로필 안내를 유지한다 — 캡션 URL 이 안 눌린다", () => {
    const out = resolveReply(meta, { platform: "instagram", file });
    expect(out).toContain("프로필 링크에서 24번 글입니다");
    expect(out).not.toContain("utm_");
  });

  it("ref 가 없으면 손으로 쓴 답글을 그대로 쓴다", () => {
    // 계측을 넣었다고 이미 예약된 글이 조용히 달라지면 안 된다.
    const only = { reply: meta.reply };
    expect(resolveReply(only, { platform: "threads", file })).toBe(meta.reply);
  });

  it("reply 가 없으면 null 을 그대로 넘긴다", () => {
    expect(resolveReply({}, { platform: "threads", file })).toBeNull();
  });
});

describe("실제 큐 파일", () => {
  const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "queue");
  const files = readdirSync(dir).filter((f) => f.endsWith(".md"));
  const withReply = files.filter(
    (f) => parsePost(readFileSync(join(dir, f), "utf8")).meta.reply,
  );

  it("답글이 있는 글은 전부 ref 를 갖는다", () => {
    const missing = withReply.filter(
      (f) => !parsePost(readFileSync(join(dir, f), "utf8")).meta.ref,
    );
    expect(missing).toEqual([]);
  });

  it.each(withReply)("%s — ref 가 사이트 안의 경로다", (file) => {
    const { meta } = parsePost(readFileSync(join(dir, file), "utf8"));
    expect(meta.ref).toMatch(/^\/[a-z0-9/-]*\/$/);
  });

  it.each(withReply)("%s — 스레드 답글에 utm 이 붙는다", (file) => {
    const { meta } = parsePost(readFileSync(join(dir, file), "utf8"));
    const out = resolveReply(meta, { platform: "threads", file });
    expect(out).toContain("utm_source=threads");
    expect(out).toContain(`utm_campaign=${campaignOf(file)}`);
  });

  it("frontmatter 키가 전부 소문자·밑줄이다", () => {
    /*
     * parsePost 의 키 정규식이 [a-z_]+ 다. 대문자가 하나 섞이면 그 줄이
     * 통째로 무시되고, 오류 없이 조용히 기본값으로 떨어진다. 실제로
     * refNo 로 썼다가 인스타 캡션에서 글 번호가 사라졌다.
     */
    const bad = [];
    for (const f of files) {
      const raw = readFileSync(join(dir, f), "utf8");
      const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (!fm) continue;
      for (const line of fm[1].split(/\r?\n/)) {
        const kv = line.match(/^\s*([A-Za-z_]+)\s*:/);
        if (kv && /[A-Z]/.test(kv[1])) bad.push(`${f} — ${kv[1]}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it.each(withReply.filter((f) => parsePost(readFileSync(join(dir, f), "utf8")).meta.ref_no))(
    "%s — 인스타 캡션이 글 번호를 말한다",
    (file) => {
      const { meta } = parsePost(readFileSync(join(dir, file), "utf8"));
      const out = resolveReply(meta, { platform: "instagram", file });
      expect(out).toContain(`프로필 링크에서 ${meta.ref_no}번 글입니다`);
    },
  );
});

describe("본문 링크 옵트인", () => {
  /*
   * 규칙을 시험하려고 가드를 끄면 가드가 영영 사라진다. 그래서 글 단위
   * 옵트인으로 만들었는데, 그 스위치가 조용히 켜져 있으면 더 나쁘다 —
   * 실험이 아닌 글이 본문 링크를 달고 나가고, 나중에 결과를 해석할 수 없다.
   */
  const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "queue");
  const files = readdirSync(dir).filter((f) => f.endsWith(".md"));

  it("본문에 링크가 있는 글은 allow_body_link 를 켜 둔 글뿐이다", () => {
    const bad = [];
    for (const f of files) {
      const { meta, text } = parsePost(readFileSync(join(dir, f), "utf8"));
      const on = String(meta.allow_body_link ?? "").toLowerCase() === "true";
      if (findBodyLink(text) && !on) bad.push(f);
    }
    expect(bad).toEqual([]);
  });

  it("allow_body_link 를 켠 글은 실제로 본문에 링크가 있다", () => {
    // 켜 두고 링크가 없으면 스위치만 남아 다음 사람을 헷갈리게 한다.
    const idle = files.filter((f) => {
      const { meta, text } = parsePost(readFileSync(join(dir, f), "utf8"));
      const on = String(meta.allow_body_link ?? "").toLowerCase() === "true";
      return on && !findBodyLink(text);
    });
    expect(idle).toEqual([]);
  });
});
