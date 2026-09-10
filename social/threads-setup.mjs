/**
 * .env 에 붙여넣은 액세스 토큰을 검증하고 설정을 마무리한다.
 *
 *   node social/threads-setup.mjs
 *
 * App Dashboard > 이용 사례 > Threads API 액세스 > "사용자 토큰 생성기" 가
 * 장기(60일) 토큰을 바로 내주므로, OAuth 왕복(threads-auth.mjs)을 할 필요가
 * 없다. 대시보드에서 토큰을 만들어 .env 의 THREADS_ACCESS_TOKEN 에 직접
 * 붙여넣은 뒤 이 스크립트를 돌리면 된다.
 *
 * 하는 일: 토큰으로 /me 를 조회해 살아 있는지 확인하고, 계정이 맞는지 보여
 * 주고, THREADS_USER_ID 와 THREADS_TOKEN_REFRESHED_AT 을 채운다.
 *
 * 토큰은 사람 손을 거치지 않는다 — .env 에서 읽어 .env 에 쓴다.
 */
import { readEnv, updateEnv, requireEnv, envPath } from "./env.mjs";

const env = readEnv();
requireEnv(env, ["THREADS_ACCESS_TOKEN"]);

const token = env.THREADS_ACCESS_TOKEN;

const res = await fetch(
  "https://graph.threads.net/v1.0/me?" +
    new URLSearchParams({
      fields: "id,username,threads_profile_picture_url",
      access_token: token,
    }),
);
const body = await res.json().catch(() => null);

if (!res.ok || !body || body.error) {
  console.error(`\n✖ 토큰이 유효하지 않습니다 (${res.status}).`);
  console.error(`  ${body?.error?.message ?? "응답을 읽지 못했습니다."}`);
  console.error(`\n  App Dashboard > 이용 사례 > Threads API 액세스 >`);
  console.error(`  "사용자 토큰 생성기" 에서 다시 발급받아 .env 에 넣으세요.\n`);
  process.exit(1);
}

updateEnv({
  THREADS_USER_ID: String(body.id),
  // 대시보드 생성기가 주는 토큰은 이미 장기(60일)다. 지금을 기준으로
  // 잡아두면 24시간 뒤부터 게시 스크립트가 알아서 연장한다.
  THREADS_TOKEN_REFRESHED_AT: new Date().toISOString(),
});

console.log(`\n✓ 토큰 확인됨`);
console.log(`  계정: @${body.username}`);
console.log(`  user_id: ${body.id}`);
console.log(`  저장 → ${envPath()}\n`);
console.log(`다음: node social/threads-post.mjs        (드라이런 — 실제 게시 안 함)\n`);
