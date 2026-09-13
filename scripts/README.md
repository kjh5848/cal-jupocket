# 스케줄러

`post-due.cmd` 는 예약 시각이 된 글을 올린다. 30분마다 돌린다.

- **스레드**: 시각이 된 것 하나. `at:` 에 맞춰 저절로 벌어진다
- **인스타**: 하루 한 건. 같은 날 여러 개를 올리면 게시물당 도달이
  나뉘므로 `ig:post --due` 가 오늘 올린 게 있으면 그냥 끝낸다

카드 이미지는 `npm run cards` 가 자동으로 뽑는다(Playwright). 큐 글에
`images:` 만 적혀 있으면 사람 손이 필요 없다.

## 등록

```
schtasks /Create /TN "jupocket-threads" /TR "<repo>\scripts\post-due.cmd" ^
  /SC MINUTE /MO 30 /ST 07:00 /F
```

## 확인·중지

```
schtasks /Query  /TN "jupocket-threads" /V /FO LIST
schtasks /Run    /TN "jupocket-threads"      한 번 즉시 실행
schtasks /End    /TN "jupocket-threads"      실행 중인 것 중지
schtasks /Delete /TN "jupocket-threads" /F   등록 해제
```

로그는 `scripts/post-due.log`. 올릴 게 없을 때도 한 줄씩 남으므로
가끔 지워도 된다.

## 알아둘 것

- **PC가 켜져 있어야 한다.** 토큰이 로컬 `.env` 에만 있어서 클라우드로
  못 옮긴다. 꺼져 있던 시간대의 글은 켜진 뒤 다음 실행에서 순서대로 나간다
- 한 번에 **하나만** 올린다. 밀린 게 여러 건이어도 30분 간격으로 하나씩
- 인스타(카드뉴스)는 여기 없다 — 카드 렌더가 수동이라 사람이 돌린다
