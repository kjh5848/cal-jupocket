# 소셜 업로드 자동화 (Threads)

`social/queue/` 에 글을 넣고 명령 하나로 Threads(@jupocket.money)에 올린다.
외부 라이브러리 없음 — Node 내장 fetch 만 쓴다.

## 왜 Threads 부터인가

Threads API 는 `threads_content_publish` 권한이 **고급 액세스(App Review) 없이도
본인 계정과 테스터 계정에는 게시**된다. 우리가 앱 소유자이고 올릴 곳도 우리
계정이므로 심사 없이 오늘 바로 쓸 수 있다.

인스타그램·페이스북은 사정이 다르다 — 인스타는 비즈니스/크리에이터 계정 전환이,
페이스북은 페이지와 `pages_manage_posts` 가 각각 선행 조건이다. 이번 작업에는
넣지 않았다. 스크립트는 어댑터를 하나 더 붙이면 되는 구조로 두었다.

---

## 1. Meta 개발자 앱 만들기 (사용자가 직접)

> 앱 생성은 Meta 플랫폼 약관에 **계정 소유자 본인이 동의**하는 절차라 대신
> 눌러줄 수 없다. 아래 순서대로만 하면 된다.

1. https://developers.facebook.com/apps → **앱 만들기**
2. 유스케이스에서 **Threads** 선택 (다른 것 말고 이것)
3. 앱 생성 후 좌측 **Threads > 설정(Settings)** 으로 이동
4. **리다이렉트 콜백 URL** 에 정확히 이 값을 등록:
   ```
   https://jupocket.com/oauth/threads/
   ```
   끝의 슬래시까지 똑같아야 한다. 다르면 인증이 거부된다.
5. **앱 ID / 앱 시크릿**을 복사해 둔다.
   ⚠️ Threads 유스케이스 앱은 ID·시크릿이 **두 쌍** 나온다.
   일반 앱 것이 아니라 **Threads 전용** 값을 써야 한다.
6. 좌측 **앱 역할(App roles) > 역할(Roles) > 사람 추가** →
   **Threads 테스터**로 `@jupocket.money` 초대
7. Threads 앱/웹에서 해당 계정으로
   **설정 > 웹사이트 권한(Website permissions)** → 초대 수락

## 2. 로컬 설정

`cal/.env` 에 아래 세 줄을 추가하고 값을 채운다.
(이미 네이버 검색광고 키가 들어 있는 그 파일이다 — 지우지 말고 덧붙일 것.
 형식은 `.env.example` 의 Threads 절 참고.)

```
THREADS_APP_ID=
THREADS_APP_SECRET=
THREADS_REDIRECT_URI=https://jupocket.com/oauth/threads/
```

`.env` 는 `.gitignore` 에 있다 — 커밋되지 않는다.
**앱 시크릿은 채팅에 붙여넣지 말 것.** 이 파일에만 둔다.

## 3. 토큰 발급 (최초 1회)

```bash
node social/threads-auth.mjs
```

출력된 URL을 브라우저에서 열어 승인하면 `jupocket.com/oauth/threads/` 로
이동하며 코드가 표시된다. 그 코드를 터미널에 붙여넣으면 끝.
단기 토큰(1시간) → 장기 토큰(60일)까지 자동으로 교환해 `.env` 에 저장한다.

## 4. 게시

```bash
# 드라이런 — 컨테이너만 만들고 멈춘다. 실제로 올라가지 않는다.
node social/threads-post.mjs

# 진짜 게시
node social/threads-post.mjs --publish

# 특정 글 지정
node social/threads-post.mjs --file 002-vat-january-deadline.md --publish
```

큐에서 **아직 안 올린 것 중 파일명 순으로 가장 앞선 하나**를 올린다.
올리고 나면 `social/posted.json` 에 기록되어 다시 올라가지 않는다.

## 토큰 갱신 — 신경 쓸 게 없다

장기 토큰은 60일짜리이고, 24시간 이상 지났으면 연장할 수 있다.
`threads-post.mjs` 는 **매번 실행될 때 조건이 맞으면 알아서 연장**한다.
60일에 한 번이라도 글을 올리면 토큰은 영원히 유지된다.

(갱신을 별도 스케줄러로 빼면 비밀값을 다시 써 넣을 권한이 있는 인프라 —
GitHub Actions PAT 나 Worker+KV — 가 필요해진다. 그럴 이유가 없다.)

## 글 쓰는 법

`social/queue/NNN-슬러그.md`:

```markdown
---
link: https://jupocket.com/vat/          # 선택. 텍스트 글에 링크 카드로 붙는다
image: /photos/calc-vat.webp             # 선택. 있으면 이미지 글이 된다
---
본문. 500자 이내.
```

- `image` 는 사이트에 올라가 **공개 접근 가능한 URL**이어야 한다
  (`/photos/...` 로 쓰면 `https://jupocket.com` 이 자동으로 붙는다).
  스크립트가 게시 전에 HEAD 로 접근 가능한지 먼저 확인한다.
- `link` 와 `image` 는 함께 못 쓴다 — 링크 카드는 텍스트 전용 글만 가능하다.
- **수치는 반드시 `src/rates/*.json` 의 검증된 값만** 쓴다.
  가산세율처럼 원문 확인이 안 된 숫자는 글에 넣지 않는다.

## 한도

- 게시: 프로필당 24시간에 250건
- 본문: 500자 (문서상 이모지는 UTF-8 바이트로 계산 — 450자 넘으면 경고한다)
- 이미지: JPEG/PNG, 8MB, 가로 320~1440px
