/**
 * Instagram 액세스 토큰 확인 및 설정 마무리.
 *
 *   node social/ig-setup.mjs
 *
 * App Dashboard > 이용 사례 > Instagram > "Instagram 로그인이 포함된 API 설정"
 * > 2. 액세스 토큰 생성 > 계정 추가 에서 토큰을 만들어 .env 의
 * IG_ACCESS_TOKEN 에 붙여넣은 뒤 실행한다.
 *
 * 하는 일: 토큰으로 /me 를 조회해 살아 있는지 확인하고, 어느 계정인지
 * 보여주고, IG_USER_ID 와 갱신 기준일을 채운다. 토큰은 사람 손을 거치지
 * 않는다 — .env 에서 읽어 .env 에 쓴다.
 */
import { readEnv, updateEnv, requireEnv, envPath } from "./env.mjs";

const API = "https://graph.instagram.com";

const env = readEnv();
requireEnv(env, ["IG_ACCESS_TOKEN"]);

const res = await fetch(
  `${API}/me?` +
    new URLSearchParams({
      fields: "id,username,account_type",
      access_token: env.IG_ACCESS_TOKEN,
    }),
);
const body = await res.json().catch(() => null);

if (!res.ok || !body || body.error) {
  console.error(`\n✖ 토큰이 유효하지 않습니다 (${res.status}).`);
  console.error(`  ${body?.error?.message ?? "응답을 읽지 못했습니다."}`);
  console.error(`\n  App Dashboard > 이용 사례 > Instagram >`);
  console.error(`  "Instagram 로그인이 포함된 API 설정" > 액세스 토큰 생성`);
  console.error(`  에서 다시 발급받아 .env 에 넣으세요.\n`);
  process.exit(1);
}

updateEnv({
  IG_USER_ID: String(body.id),
  IG_TOKEN_REFRESHED_AT: new Date().toISOString(),
});

console.log(`\n✓ 토큰 확인됨`);
console.log(`  계정: @${body.username}`);
if (body.account_type) console.log(`  유형: ${body.account_type}`);
console.log(`  user_id: ${body.id}`);
console.log(`  저장 → ${envPath()}\n`);
console.log(`다음: node social/ig-post.mjs        (드라이런 — 실제 게시 안 함)\n`);
