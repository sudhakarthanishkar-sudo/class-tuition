import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AttendanceStatus } from "@/backend";
import {
  getMockActor,
  getMockIdentity,
  setMockActor,
  setMockIdentity,
} from "@/test/appMock";
import { renderWithProviders } from "@/test/harness";
import {
  type MockBackendState,
  createMockBackendActor,
  createMockBackendState,
  makeAttendance,
  makeSubject,
} from "@/test/mockBackend";

vi.mock("@caffeineai/core-infrastructure", () => ({
  useInternetIdentity: () => getMockIdentity(),
  useActor: () => ({ actor: getMockActor(), isFetching: false }),
  InternetIdentityProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}));

vi.mock("@/backend", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/backend")>();
  return { ...actual, createActor: () => getMockActor() };
});

const { default: App } = await import("@/App");

// A fixed "today" so the mark-today card and the calendar month are stable.
const TODAY = new Date(2026, 8, 21); // Monday, 21 September 2026
const TODAY_KEY = "2026-09-21";
const PAST_KEY = "2026-09-10";
// en-GB short dates render September as "Sept" in this runtime.
const TODAY_SHORT = "21 Sept";

let state: MockBackendState;

function useBackend(seed: Parameters<typeof createMockBackendState>[0] = {}) {
  state = createMockBackendState(seed);
  setMockActor(createMockBackendActor(state));
  return state;
}

/**
 * `App` builds its router once at module scope, so a route visited by one test
 * would persist into the next. Resetting the browser history to the home route
 * before each render puts the singleton router back on `/`.
 */
function resetRoute() {
  window.history.replaceState(null, "", "/");
}

/** Open the app on the subject detail route for the seeded subject. */
async function openSubject(user: ReturnType<typeof userEvent.setup>) {
  resetRoute();
  renderWithProviders(<App />);
  await user.click(await screen.findByRole("link", { name: /mathematics/i }));
  return screen.findByRole("heading", { name: "Mathematics" });
}

describe("subject attendance detail", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(TODAY);
    setMockIdentity({ isAuthenticated: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("lists recorded dates with their Present / Absent / Class Cancelled status", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    useBackend({
      subjects: [makeSubject(1n, "Mathematics", "#E4572E")],
      attendance: [
        makeAttendance(1n, 1n, "2026-09-18", AttendanceStatus.present),
        makeAttendance(2n, 1n, "2026-09-17", AttendanceStatus.absent),
        makeAttendance(3n, 1n, "2026-09-16", AttendanceStatus.classCancelled),
      ],
    });

    await openSubject(user);

    const list = await screen.findByTestId("attendance.list");
    const rows = within(list).getAllByRole("listitem");
    expect(rows).toHaveLength(3);
    expect(within(list).getByText("Present")).toBeInTheDocument();
    expect(within(list).getByText("Absent")).toBeInTheDocument();
    expect(within(list).getByText("Class Cancelled")).toBeInTheDocument();
    // Newest date first.
    expect(within(list).getByText("18 Sept")).toBeInTheDocument();
  });

  it("records today's attendance with the chosen status", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    useBackend({ subjects: [makeSubject(1n, "Mathematics", "#E4572E")] });

    await openSubject(user);

    const card = await screen.findByTestId("attendance.mark_today_card");
    await user.click(within(card).getByRole("button", { name: /present/i }));

    expect(state.calls.recordAttendance).toEqual([
      { subjectId: 1n, date: TODAY_KEY, status: AttendanceStatus.present },
    ]);
    // The new record appears in the recorded-dates list.
    expect(await screen.findByText(TODAY_SHORT)).toBeInTheDocument();
  });

  it("records attendance for a past date picked from the calendar", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    useBackend({ subjects: [makeSubject(1n, "Mathematics", "#E4572E")] });

    await openSubject(user);

    const calendar = await screen.findByTestId("attendance.calendar_card");
    // Pick 10 September 2026 from the month grid. The gridcell carries the
    // ISO `data-day`; the day button inside it is what selects the date.
    const dayCell = calendar.querySelector<HTMLElement>(
      '[data-day="2026-09-10"]',
    );
    expect(dayCell).not.toBeNull();
    await user.click(within(dayCell as HTMLElement).getByRole("button"));
    await user.click(within(calendar).getByRole("button", { name: /absent/i }));

    expect(state.calls.recordAttendance).toEqual([
      { subjectId: 1n, date: PAST_KEY, status: AttendanceStatus.absent },
    ]);
  });

  it("changes the status on an already-recorded date", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    useBackend({
      subjects: [makeSubject(1n, "Mathematics", "#E4572E")],
      attendance: [makeAttendance(1n, 1n, TODAY_KEY, AttendanceStatus.present)],
    });

    await openSubject(user);

    const list = await screen.findByTestId("attendance.list");
    const row = within(list).getByTestId("attendance.row.1");
    expect(row).toHaveAttribute("aria-expanded", "false");

    // Tapping the card expands the three status choices.
    fireEvent.click(row);
    expect(row).toHaveAttribute("aria-expanded", "true");

    await user.click(
      within(list).getByRole("button", { name: /class cancelled/i }),
    );

    expect(state.calls.recordAttendance).toEqual([
      {
        subjectId: 1n,
        date: TODAY_KEY,
        status: AttendanceStatus.classCancelled,
      },
    ]);
  });

  it("deletes a recorded date through its red delete action", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    useBackend({
      subjects: [makeSubject(1n, "Mathematics", "#E4572E")],
      attendance: [makeAttendance(1n, 1n, TODAY_KEY, AttendanceStatus.present)],
    });

    await openSubject(user);

    const list = await screen.findByTestId("attendance.list");
    const deleteButton = within(list).getByRole("button", {
      name: new RegExp(`delete attendance for ${TODAY_SHORT}`, "i"),
    });
    await user.click(deleteButton);

    expect(state.calls.deleteAttendance).toEqual([1n]);
    expect(
      await screen.findByText("No attendance recorded yet"),
    ).toBeInTheDocument();
  });
});
