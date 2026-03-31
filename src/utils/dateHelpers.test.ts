import { describe, expect, it } from "vitest";
import {
  addDays,
  formatDayHeader,
  formatIsoDate,
  formatWeekLabel,
  getWeekDays,
  isDateInWeek,
  parseIsoDate,
  startOfWeekSunday,
} from "./dateHelpers";

describe("dateHelpers", () => {
  it("formats and parses ISO dates consistently", () => {
    const date = new Date(2026, 3, 1);
    const iso = formatIsoDate(date);
    expect(iso).toBe("2026-04-01");

    const parsed = parseIsoDate(iso);
    expect(formatIsoDate(parsed)).toBe("2026-04-01");
  });

  it("computes Sunday as start of week and resets time", () => {
    const wednesday = new Date(2026, 3, 1, 14, 30, 15, 20);
    const start = startOfWeekSunday(wednesday);
    expect(formatIsoDate(start)).toBe("2026-03-29");
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(start.getSeconds()).toBe(0);
    expect(start.getMilliseconds()).toBe(0);
  });

  it("returns seven consecutive week days", () => {
    const start = new Date(2026, 2, 29);
    const days = getWeekDays(start);
    expect(days).toHaveLength(7);
    expect(formatIsoDate(days[0])).toBe("2026-03-29");
    expect(formatIsoDate(days[6])).toBe("2026-04-04");
    expect(formatIsoDate(addDays(days[0], 3))).toBe("2026-04-01");
  });

  it("checks week inclusion with inclusive boundaries", () => {
    const weekStart = new Date(2026, 2, 29);
    expect(isDateInWeek("2026-03-29", weekStart)).toBe(true);
    expect(isDateInWeek("2026-04-04", weekStart)).toBe(true);
    expect(isDateInWeek("2026-04-05", weekStart)).toBe(false);
  });

  it("formats readable labels", () => {
    const weekStart = new Date(2026, 2, 29);
    expect(formatWeekLabel(weekStart)).toBe("Week of 29 Mar 2026");
    expect(formatDayHeader(new Date(2026, 3, 1))).toBe("Wed 1 Apr");
  });
});
