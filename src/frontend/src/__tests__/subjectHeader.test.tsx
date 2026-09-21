import { screen, within } from "@testing-library/react";
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

/**
 * Characterization of the subject page's identity header and empty state. The
 * requested change adds a summary sentence to this page, so these tests pin the
 * surrounding working behavior — the subject's name, colour, and subtitle, and
 * the empty-attendance state — without freezing the exact markup the new
 * sentence will sit beside.
 */
describe("characterization: subject page header and empty state", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(TODAY);
    setMockIdentity({ isAuthenticated: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the subject's name, colour swatch, and attendance-record subtitle", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    useBackend({ subjects: [makeSubject(1n, "Mathematics", "#E4572E")] });

    await openSubject(user);

    const page = screen.getByTestId("subject.page");
    expect(
      within(page).getByRole("heading", { name: "Mathematics" }),
    ).toBeInTheDocument();
    expect(within(page).getByText("Attendance record")).toBeInTheDocument();

    // The colour swatch is rendered from the subject's stored colour.
    const swatch = page.querySelector<HTMLElement>("span[style]");
    expect(swatch).not.toBeNull();
    expect((swatch as HTMLElement).style.backgroundColor).toBe(
      "rgb(228, 87, 46)",
    );
  });

  it("keeps the back link to the subject list on the header", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    useBackend({ subjects: [makeSubject(1n, "Mathematics", "#E4572E")] });

    await openSubject(user);

    expect(screen.getByTestId("subject.back_link")).toHaveAttribute(
      "aria-label",
      "Back to all subjects",
    );
  });

  it("shows the empty attendance state and no recorded-dates list for a subject with no records", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    useBackend({ subjects: [makeSubject(1n, "Mathematics", "#E4572E")] });

    await openSubject(user);

    expect(
      await screen.findByText("No attendance recorded yet"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("attendance.list")).not.toBeInTheDocument();
    // The section header count is suppressed for an empty list.
    const section = screen.getByTestId("attendance.section");
    expect(within(section).queryByText(/\bentries?\b/)).not.toBeInTheDocument();
  });

  it("keeps the mark-today card and calendar available with no records", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    useBackend({ subjects: [makeSubject(1n, "Mathematics", "#E4572E")] });

    await openSubject(user);

    expect(
      await screen.findByTestId("attendance.mark_today_card"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("attendance.calendar_card")).toBeInTheDocument();
  });

  it("loads only the current subject's records, not another subject's", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    useBackend({
      subjects: [
        makeSubject(1n, "Mathematics", "#E4572E"),
        makeSubject(2n, "Physics", "#7C4DFF"),
      ],
      attendance: [
        makeAttendance(1n, 1n, "2026-09-18", AttendanceStatus.present),
        makeAttendance(2n, 2n, "2026-09-17", AttendanceStatus.absent),
        makeAttendance(3n, 2n, "2026-09-16", AttendanceStatus.absent),
      ],
    });

    await openSubject(user);

    const list = await screen.findByTestId("attendance.list");
    const rows = within(list).getAllByRole("listitem");
    // Physics owns two records; the Mathematics page must show only its own.
    expect(rows).toHaveLength(1);
    expect(within(list).getByText("18 Sept")).toBeInTheDocument();
    expect(within(list).queryByText("17 Sept")).not.toBeInTheDocument();
  });
});
