/**
 * Threads 액세스 토큰 최초 발급 (일회성).
 *
 *   node social/threads-auth.mjs
 *
 * 흐름: 인증 URL 출력 → 브라우저에서 승인 → jupocket.com/oauth/threads/ 에
 * 뜬 code 붙여넣기 → 단기 토큰(1시간) 교환 → 장기 토큰(60일) 교환 →
 * .env 에 저장.
 *
 * 이후 갱신은 threads-post.mjs 가 실행될 때마다 알아서 한다. 60일 안에
 * 한 번이라도 글을 올리면 토큰은 스스로 연장된다.
 *
 * 문서: https://developers.facebook.com/docs/threads/get-started
 */
import { createInterface } from "node:readline/promises";
import { readEnv, updateEnv, requireEnv, envPath } from "./env.mjs";

const SCOPES = ["threads_basic", "threads_content_publish"];

const env = readEnv();
requireEnv(env, ["THREADS_APP_ID", "THREADS_APP_SECRET", "THREADS_REDIRECT_URI"]);

/** 응답이 JSON이 아니거나 error 필드를 담고 있으면 읽을 수 있게 죽는다. */
async function callJson(url, init) {
  const res = await fetch(url, init);
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    console.error(`\n✖ ${res.status} 응답이 JSON이 아닙니다:\n${text.slice(0, 500)}\n`);
    process.exit(1);
  }
  if (!res.ok || body.error || body.error_message) {
    const msg = body.error?.message ?? body.error_message ?? JSON.stringify(body);
    console.error(`\n✖ ${res.status} ${msg}\n`);
    process.exit(1);
  }
  return body;
}

const authUrl =
  "https://threads.net/oauth/authorize?" +
  new URLSearchParams({
    client_id: env.THREADS_APP_ID,
    redirect_uri: env.THREADS_REDIRECT_URI,
    response_type: "code",
    scope: SCOPES.join(","),
  });

console.log("\n1) 아래 URL을 브라우저에서 열고 @jupocket.money 계정으로 승인하세요:\n");
console.log(authUrl);
console.log("\n2) 승인 후 jupocket.com/oauth/threads/ 로 이동하며 code가 표시됩니다.");
console.log("   code 또는 주소창 URL 전체를 그대로 붙여넣으세요. (1시간 내 1회용)\n");

const rl = createInterface({ input: process.stdin, output: process.stdout });
const raw = (await rl.question("code > ")).trim();
rl.close();

// URL 전체를 붙여넣어도 받아준다. 끝의 #_ 는 Threads가 붙이는 프래그먼트다.
let code = raw;
if (raw.includes("code=")) {
  code = new URL(raw).searchParams.get("code") ?? raw;
}
code = code.replace(/#_$/, "").trim();

if (!code) {
  console.error("\n✖ code를 읽지 못했습니다.\n");
  process.exit(1);
}

console.log("\n· 단기 토큰 교환 중…");
const short = await callJson("https://graph.threads.net/oauth/access_token", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    client_id: env.THREADS_APP_ID,
    client_secret: env.THREADS_APP_SECRET,
    grant_type: "authorization_code",
    redirect_uri: env.THREADS_REDIRECT_URI,
    code,
  }),
});

console.log("· 장기 토큰(60일) 교환 중…");
const long = await callJson(
  "https://graph.threads.net/access_token?" +
    new URLSearchParams({
      grant_type: "th_exchange_token",
      client_secret: env.THREADS_APP_SECRET,
      access_token: short.access_token,
    }),
);

updateEnv({
  THREADS_ACCESS_TOKEN: long.access_token,
  THREADS_USER_ID: String(short.user_id),
  THREADS_TOKEN_REFRESHED_AT: new Date().toISOString(),
});

const days = Math.round((long.expires_in ?? 0) / 86400);
console.log(`\n✓ 저장했습니다 → ${envPath()}`);
console.log(`  user_id: ${short.user_id}`);
console.log(`  만료: 약 ${days}일 후 (글을 올릴 때마다 자동 연장)\n`);
console.log("다음: node social/threads-post.mjs        (드라이런 — 실제 게시 안 함)\n");
