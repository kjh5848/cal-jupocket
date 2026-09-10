# 소셜 업로드 자동화 (Threads)

`social/queue/` 에 글을 넣고 명령 하나로 Threads(@jupocket.money)에 올린다.
외부 라이브러리 없음 — Node 내장 fetch 만 쓴다.

## 왜 Threads 부터인가

Threads API 는 `threads_content_publish` 권한이 **고급 액세스(App Review) 없이도
본인 계정과 테스터 계정에는 게시**된다. 우리가 앱 소유자이고 올릴 곳도 우리
계정이므로 심사 없이 바로 쓸 수 있다.

인스타그램·페이스북은 사정이 다르다 — 인스타는 비즈니스/크리에이터 계정 전환이,
페이스북은 페이지와 `pages_manage_posts` 가 각각 선행 조건이다. 이번 작업에는
넣지 않았다. 스크립트는 어댑터를 하나 더 붙이면 되는 구조로 두었다.

---

## 1. Meta 개발자 앱 (완료됨)

앱 이름 `jupocket`, 이용 사례 **Threads API 액세스**, 테스터에 `jupocket.money`
등록까지 되어 있다. 새로 만들 일이 있으면:

1. https://developers.facebook.com/apps → **앱 만들기**
2. 이용 사례에서 **Threads** 선택
3. **이용 사례 > Threads API 액세스 > 설정** 에서 **리디렉션 콜백 URL** 등록
   (OAuth 경로를 쓸 때만 필요 — 아래 3-B)
4. 같은 화면 아래 **Threads 테스터 추가 또는 삭제** 에서 계정 초대
5. Threads 앱/웹에서 그 계정으로
   **설정 > 웹사이트 권한** → 초대 수락

## 2. .env 준비

`cal/.env` 에 아래를 추가한다. (이미 네이버 검색광고 키가 들어 있는 그 파일이다
— 지우지 말고 덧붙일 것. 형식은 `.env.example` 의 Threads 절 참고.)

```
THREADS_APP_SECRET=
THREADS_ACCESS_TOKEN=
```

`THREADS_APP_SECRET` 은 **이용 사례 > Threads API 액세스 > 설정** 의
"Threads 앱 시크릿 코드" — **보기** 를 눌러 나오는 값이다.
(일반 앱 시크릿이 아니라 **Threads 전용** 값이어야 한다.)

> `.env` 는 `.gitignore` 에 있다 — 커밋되지 않는다.
> **토큰과 시크릿은 채팅·이슈·커밋 어디에도 붙여넣지 않는다.** 이 파일에만 둔다.

## 3-A. 토큰 발급 — 대시보드 생성기 (권장)

**이용 사례 > Threads API 액세스 > 설정** 맨 아래 **사용자 토큰 생성기** 에서
`jupocket.money` 옆 **액세스 토큰 생성하기** 를 누르면 **장기(60일) 토큰**이
바로 나온다. OAuth 왕복이 필요 없다.

그 값을 `.env` 의 `THREADS_ACCESS_TOKEN=` 에 붙여넣고:

```bash
npm run social:setup
```

토큰이 살아 있는지 확인하고 계정(@아이디)을 보여준 뒤 `THREADS_USER_ID` 와
`THREADS_TOKEN_REFRESHED_AT` 을 채운다.

## 3-B. 토큰 발급 — OAuth (대안)

생성기를 못 쓰는 경우(비공개 계정 등)에만. 리디렉션 콜백 URL로
`https://jupocket.com/oauth/threads/` 가 등록돼 있어야 한다.

```bash
npm run social:auth
```

출력된 URL을 브라우저에서 열어 승인하면 `jupocket.com/oauth/threads/` 로
이동하며 코드가 표시된다. 그 코드를 터미널에 붙여넣으면
단기(1시간) → 장기(60일) 교환까지 자동으로 끝난다.

## 4. 게시

```bash
# 드라이런 — 컨테이너만 만들고 멈춘다. 실제로 올라가지 않는다.
npm run social:post

# 진짜 게시
npm run social:post -- --publish

# 특정 글 지정
npm run social:post -- --file 002-vat-january-deadline.md --publish
```

큐에서 **아직 안 올린 것 중 파일명 순으로 가장 앞선 하나**를 올린다.
올리고 나면 `social/posted.json` 에 기록되어 다시 올라가지 않는다.

`--file` 은 그 기록을 일부러 무시하는 탈출구다 — 같은 글을 두 번 올릴 수
있으니 재발행이 목적일 때만 쓴다. (값을 빠뜨리면 큐의 첫 글이 대신
올라가지 않도록 오류로 막는다.)

## 토큰 갱신 — 신경 쓸 게 없다

장기 토큰은 60일짜리이고, 24시간 이상 지났으면 연장할 수 있다.
`threads-post.mjs` 는 **매번 실행될 때 조건이 맞으면 알아서 연장**한다.
60일에 한 번이라도 글을 올리면 토큰은 계속 유지된다.

(갱신을 별도 스케줄러로 빼면 비밀값을 다시 써 넣을 권한이 있는 인프라 —
GitHub Actions PAT 나 Worker+KV — 가 필요해진다. 그럴 이유가 없다.)

## 토큰이 유출됐을 때

채팅·스크린샷·커밋에 토큰이 한 번이라도 노출됐다면 그 토큰은 죽은 것으로 본다.
누구든 그 값으로 `@jupocket.money` 에 글을 올릴 수 있다.

1. Threads 앱/웹에서 해당 계정 → **설정 > 웹사이트 권한** → `jupocket` 앱
   **제거** (발급된 토큰이 무효화된다)
2. 다시 테스터 초대를 수락하고 **3-A** 로 새 토큰 발급
3. 시크릿까지 노출됐다면 App Dashboard 에서 **Threads 앱 시크릿 코드 재설정**

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
