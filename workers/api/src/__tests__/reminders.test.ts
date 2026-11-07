import { describe, it, expect } from "vitest";
import { HUG_TITLES, expandReminders, validEndpoint, todayKst, addDays } from "../reminders";
import { hugSchedule } from "../../../../src/lib/hug-jeonse";

describe("알림 제목 — 체크리스트와 같다", () => {
  it("hugSchedule 의 모든 key·title 이 서버 표에 그대로 있다", () => {
    const items = hugSchedule({ contract: 20000, start: 20030, moveIn: 20030, end: 20760 });
    expect(items.length).toBeGreaterThan(5);
    for (const i of items) expect(HUG_TITLES[i.key]).toBe(i.title);
  });
});

describe("expandReminders", () => {
  it("3일 전·하루 전·당일로 펼치고, 지난 것은 뺀다", () => {
    const rows = expandReminders([{ key: "end", date: "2026-11-09" }], "2026-11-07")!;
    expect(rows.map((r) => r.sendOn)).toEqual(["2026-11-08", "2026-11-09"]); // 3일 전(11-06)은 이미 지났다
    expect(rows[0].title).toBe("[전세] 계약 만료 — 내일");
    expect(rows[1].title).toBe("[전세] 계약 만료 — 오늘");
    expect(rows[0].url).toBe("/guide/hug-jeonse-checklist/?source=push");
  });

  it("모르는 key·틀린 날짜·너무 많은 항목은 거절한다", () => {
    expect(expandReminders([{ key: "hack", date: "2026-12-01" }], "2026-11-07")).toBeNull();
    expect(expandReminders([{ key: "end", date: "2026-13" }], "2026-11-07")).toBeNull();
    expect(expandReminders([{ key: "end", date: "2035-01-01" }], "2026-11-07")).toBeNull();
    expect(expandReminders(Array(21).fill({ key: "end", date: "2026-12-01" }), "2026-11-07")).toBeNull();
    expect(expandReminders([], "2026-11-07")).toBeNull();
    expect(expandReminders("x", "2026-11-07")).toBeNull();
  });
});

describe("validEndpoint", () => {
  it("브라우저 푸시 서버만 받는다", () => {
    expect(validEndpoint("https://fcm.googleapis.com/fcm/send/abc")).toBe(true);
    expect(validEndpoint("https://web.push.apple.com/QK1")).toBe(true);
    expect(validEndpoint("https://updates.push.services.mozilla.com/wpush/v2/x")).toBe(true);
    expect(validEndpoint("https://wns2-par02p.notify.windows.com/w/?token=x")).toBe(true);
    expect(validEndpoint("https://evil.example.com/push.apple.com")).toBe(false);
    expect(validEndpoint("http://fcm.googleapis.com/x")).toBe(false);
    expect(validEndpoint("https://fcm.googleapis.com.evil.com/x")).toBe(false);
  });
});

describe("날짜", () => {
  it("한국 날짜 — UTC 15:00 이후는 다음 날", () => {
    expect(todayKst(Date.UTC(2026, 10, 7, 14, 59))).toBe("2026-11-07");
    expect(todayKst(Date.UTC(2026, 10, 7, 15, 0))).toBe("2026-11-08");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });
});
