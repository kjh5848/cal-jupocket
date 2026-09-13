/**
 * GA4 이벤트 전송.
 *
 * 계측이 계산기를 망가뜨리면 안 된다. gtag 는 광고 차단기·네트워크 실패·
 * 측정 ID 미설정 등으로 얼마든지 없을 수 있는데, 그때 계산이 멈추면
 * 본말이 뒤바뀐다. 그래서 없으면 조용히 아무 일도 하지 않는다.
 *
 * 반대로 "조용히" 가 개발 중에는 독이라 — 이벤트를 붙였는데 안 찍히는
 * 걸 모른다 — 로컬에서는 콘솔에 남긴다.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/** GA4 이벤트 이름은 소문자·숫자·밑줄만 받는다. 40자 상한. */
const NAME = /^[a-z][a-z0-9_]{0,39}$/;

export function track(event: string, params: Record<string, unknown> = {}): void {
  if (!NAME.test(event)) {
    if (import.meta.env.DEV) console.warn(`[track] 이벤트 이름이 규칙에 안 맞음: ${event}`);
    return;
  }
  if (import.meta.env.DEV) console.info("[track]", event, params);
  window.gtag?.("event", event, params);
}

/**
 * 입력이 멈춘 뒤 한 번만 부른다.
 *
 * 계산기는 "계산하기" 버튼 없이 입력할 때마다 갱신된다. 그대로 쏘면
 * 300만원을 치는 동안 이벤트가 일곱 번 나가고, 조회수 대비 사용률이라는
 * 지표가 통째로 못 쓰게 된다.
 */
export function debounce<T extends unknown[]>(
  fn: (...args: T) => void,
  ms = 800,
): (...args: T) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: T) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/**
 * 계산기가 "실제로 쓰였다"를 한 번 보고한다.
 *
 * 한 방문에 여러 번 세지 않는다 — 금액을 바꿔가며 다섯 번 계산해도
 * "이 사람은 계산기를 썼다" 는 한 번이다. 조회수 대비 사용률을 보려는
 * 것이므로 사람 수로 세야 의미가 있다.
 */
export function trackCalculatorUse(calculator: string) {
  let reported = false;
  return debounce((amount: number) => {
    if (reported || !Number.isFinite(amount) || amount <= 0) return;
    reported = true;
    track("calculate", { calculator });
  });
}
