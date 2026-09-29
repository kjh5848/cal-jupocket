/**
 * 큐 글에서 "AI 가 쓴 티"를 기계로 잡는다.
 *
 * `SKILL.md` 에 금지 목록을 적어 뒀는데, 산문 규칙은 다른 세션이 조용히
 * 건너뛴다. 실제로 그렇게 066~069 가 나갔고 사용자가 "글이 너무 AI 스러워"
 * 라고 했다. 규칙을 지키게 하려면 **읽는 것이 아니라 도는 것**이어야 한다.
 *
 * 그래서 `npm test` 가 이걸 돌린다. 미발행 글만 본다 — 이미 나간 글은
 * 고칠 수 없고, 경고해 봤자 매일 보는 소음이 된다.
 *
 * **잡을 수 있는 것과 없는 것을 구분한다.** 정규식이 "사람이 없는 스토리"
 * 를 알아볼 수는 없다. 그래서 여기서는 **문자열로 드러나는 넷**만 본다:
 * 대구 · 훈수 · 조문 · 리듬. 나머지는 사람이 읽어야 한다. 이 파일이
 * 통과했다고 글이 좋다는 뜻이 아니다 — **명백히 나쁜 것이 없다**는 뜻이다.
 *
 * 일부러 쓰는 경우가 있으므로 빠져나갈 문을 둔다. frontmatter 에
 * `tics_ok: "대구"` 처럼 적으면 그 항목만 통과한다. `allow_body_link` 와
 * 같은 방식이다 — 검사를 지우는 대신 글 단위로 연다.
 */

/** 본문에서 마무리·표시 줄을 뺀 실제 문장들. */
export function bodyLines(text) {
  return String(text ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("※"));
}

/** 빈 줄로 끊은 문단마다 줄 수 — 리듬의 지문이다. */
export function rhythm(text) {
  return String(text ?? "")
    .split(/\n\s*\n/)
    .map((p) =>
      p
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith("※")).length,
    )
    .filter((n) => n > 0)
    .join("-");
}

/*
 * ── 규칙 ────────────────────────────────────────────────────
 *
 * 각 규칙은 { key, label, why, find(text) → 걸린 문자열[] } 이다.
 * why 는 사람이 읽고 고칠 수 있게 쓴다 — "규칙 위반" 만 뜨면 아무도
 * 무엇을 고쳐야 하는지 모른다.
 */

/**
 * ① "A가 아니라 B다" 대구.
 *
 * 한국어에서 LLM 티가 가장 잘 나는 구문이다. 060·063·066·067·068·069 에
 * 전부 있었다.
 *
 * 부정문 자체를 막지는 않는다("고지서가 안 왔다"는 사실이다). 막는 것은
 * **대비 구문**이다 — "아니라" 로 잇거나, "아니다" 로 끊고 다음 줄에서
 * 정답을 말하는 꼴.
 */
const 대구 = {
  key: "대구",
  label: '"A가 아니라 B다" 대구',
  why: "사실을 그냥 진술한다. 틀린 답을 먼저 세우고 지우는 구조를 쓰지 않는다.",
  find(text) {
    const hits = [];
    for (const line of bodyLines(text)) {
      // "…이 아니라 …" — 한 줄 안에서 대비를 잇는다
      if (/[이가는을를]\s*아니라/.test(line)) hits.push(line);
      // "…가 아니다" 로 끊고 다음 줄이 정답인 꼴은 줄 단위로는 못 본다.
      // 대신 "~는 ~가 아니다" 처럼 주어가 앞에 붙은 단정만 잡는다.
      else if (/[은는이가]\s*\S+[이가]\s*아니(다|었다|에요|예요|ㅂ니다|입니다)/.test(line))
        hits.push(line);
    }
    return hits;
  },
};

/**
 * ③ 마지막 줄 훈수.
 *
 * 사실로 끝내고 독자가 알아서 생각하게 둔다. 정리 문장이 붙으면 글이
 * 강의가 된다.
 */
const 훈수 = {
  key: "훈수",
  label: "마지막 줄 훈수",
  why: "사실로 끝낸다. 요약·교훈·당부를 마지막 줄에 붙이지 않는다.",
  find(text) {
    const lines = bodyLines(text);
    const last = lines[lines.length - 1] ?? "";
    const patterns = [
      /는 말이다\.?$/,
      /라는 뜻이다\.?$/,
      /인 셈이다\.?$/,
      /하는 게 좋다\.?$/,
      /해야 한다\.?$/,
      /하시면 됩니다\.?$/,
      /기억하세요\.?$/,
      /확인하세요\.?$/,
      /잊지 마세요\.?$/,
      /중요합니다\.?$/,
    ];
    return patterns.some((p) => p.test(last)) ? [last] : [];
  },
};

/**
 * ⑤ 본문 조문 인용.
 *
 * 120자 글에 각주를 다는 것이다. 조문은 `reply:` 가 들고 간다.
 */
const 조문 = {
  key: "조문",
  label: "본문 조문 인용",
  why: "조문은 reply 가 들고 간다. 본문에서 뺀다.",
  find(text) {
    const hits = [];
    for (const line of bodyLines(text)) {
      const m = line.match(/제\s?\d+조(의\d+)?|시행령\s?제|시행규칙\s?제|「[^」]+법」/);
      if (m) hits.push(line);
    }
    return hits;
  },
};

export const RULES = [대구, 훈수, 조문];

/** frontmatter 의 tics_ok 를 목록으로 읽는다. "대구, 훈수" 도 받는다. */
export function allowedTics(meta) {
  return String(meta?.tics_ok ?? "")
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** 글 한 편. { key, label, why, hits }[] 를 돌려준다. */
export function scanPost(text, meta = {}) {
  const ok = allowedTics(meta);
  return RULES.filter((r) => !ok.includes(r.key))
    .map((r) => ({ key: r.key, label: r.label, why: r.why, hits: r.find(text) }))
    .filter((r) => r.hits.length > 0);
}

/**
 * ④ 균일한 행갈이 — 글 한 편으로는 알 수 없다.
 *
 * "1-2-2" 가 한 번 나오는 건 아무 문제가 아니다. 여러 편이 같은 지문을
 * 가지면 기계가 찍은 티가 난다.
 *
 * **연속만 보면 놓친다.** 처음에 그렇게 짰다가 070~079 에 돌려 보니
 * 2-2-2 가 네 편인데 연달아 있지 않아 전부 통과했다. 사람이 타임라인에서
 * 보는 것은 연속이 아니라 **한 묶음의 인상**이다. 그래서 창으로 본다 —
 * 이어지는 다섯 편 안에 서로 다른 지문이 셋은 있어야 한다.
 *
 * posts 는 발행 순서(파일명 순)로 준다.
 */
export const RHYTHM_WINDOW = 5;
export const RHYTHM_MIN_DISTINCT = 3;

export function scanRhythm(posts) {
  const bad = [];
  for (let i = 0; i + RHYTHM_WINDOW <= posts.length; i++) {
    const win = posts.slice(i, i + RHYTHM_WINDOW);
    const sigs = win.map((p) => rhythm(p.text));
    const distinct = new Set(sigs).size;
    if (distinct < RHYTHM_MIN_DISTINCT) {
      bad.push({
        from: win[0].file,
        to: win[win.length - 1].file,
        distinct,
        sigs,
      });
    }
  }
  return bad;
}

/** 사람이 읽는 꼴로. */
export function formatReport(rows) {
  const out = [];
  for (const { file, findings } of rows) {
    if (findings.length === 0) continue;
    out.push(`  ✖ ${file}`);
    for (const f of findings) {
      out.push(`      ${f.label} — ${f.why}`);
      for (const h of f.hits.slice(0, 2)) out.push(`        "${h}"`);
    }
  }
  return out.join("\n");
}
