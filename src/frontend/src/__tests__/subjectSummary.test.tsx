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
 * Characterization of the subject page's existing aggregate surface: the
 * "Recorded dates" section header count and the list it summarises. The
 * requested change adds a summary sentence to this page, so these tests pin the
 * data source it will read (the subject's own records) without freezing the
 * page markup around it.
 */
describe("characterization: subject page recorded-dates summary", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(TODAY);
    setMockIdentity({ isAuthenticated: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("counts the subject's recorded dates in the section header", async () => {
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

    const section = await screen.findByTestId("attendance.section");
    expect(within(section).getByText("Recorded dates")).toBeInTheDocument();
    // The header count reflects the number of records loaded for this subject.
    expect(within(section).getByText(/\b3 entries\b/)).toBeInTheDocument();
  });

  it("uses the singular form for a single recorded date", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    useBackend({
      subjects: [makeSubject(1n, "Mathematics", "#E4572E")],
      attendance: [
        makeAttendance(1n, 1n, "2026-09-18", AttendanceStatus.present),
      ],
    });

    await openSubject(user);

    const section = await screen.findByTestId("attendance.section");
    expect(within(section).getByText(/\b1 entry\b/)).toBeInTheDocument();
    expect(
      within(section).queryByText(/\b1 entries\b/),
    ).not.toBeInTheDocument();
  });

  it("counts only the current subject's records, not another subject's", async () => {
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

    const section = await screen.findByTestId("attendance.section");
    // Physics owns two records; the Mathematics page must not count them.
    expect(within(section).getByText(/\b1 entry\b/)).toBeInTheDocument();
    expect(
      within(section).queryByText(/\b3 entries\b/),
    ).not.toBeInTheDocument();
  });

  it("shows no recorded-dates count when the subject has no records", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    useBackend({ subjects: [makeSubject(1n, "Mathematics", "#E4572E")] });

    await openSubject(user);

    expect(
      await screen.findByText("No attendance recorded yet"),
    ).toBeInTheDocument();
    const section = screen.getByTestId("attendance.section");
    // No "N entries" summary is rendered for an empty list.
    expect(within(section).queryByText(/\bentries?\b/)).not.toBeInTheDocument();
  });

  it("renders one row per record, newest date first", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    useBackend({
      subjects: [makeSubject(1n, "Mathematics", "#E4572E")],
      attendance: [
        makeAttendance(1n, 1n, "2026-09-16", AttendanceStatus.classCancelled),
        makeAttendance(2n, 1n, "2026-09-18", AttendanceStatus.present),
        makeAttendance(3n, 1n, "2026-09-17", AttendanceStatus.absent),
      ],
    });

    await openSubject(user);

    const list = await screen.findByTestId("attendance.list");
    const rows = within(list).getAllByRole("listitem");
    expect(rows).toHaveLength(3);
    // Newest first: 18 Sept, then 17 Sept, then 16 Sept.
    expect(
      within(rows[0] as HTMLElement).getByText("18 Sept"),
    ).toBeInTheDocument();
    expect(
      within(rows[1] as HTMLElement).getByText("17 Sept"),
    ).toBeInTheDocument();
    expect(
      within(rows[2] as HTMLElement).getByText("16 Sept"),
    ).toBeInTheDocument();
  });

  it("keeps the subject heading and attendance-record subtitle", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    useBackend({ subjects: [makeSubject(1n, "Mathematics", "#E4572E")] });

    await openSubject(user);

    expect(
      screen.getByRole("heading", { name: "Mathematics" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Attendance record")).toBeInTheDocument();
  });
});

/**
 * The requested summary sentence: how many classes have been marked in total
 * across every subject the signed-in user owns, and how many distinct subjects
 * that attendance comes from. The total is the sum of all marked records; the
 * subject count only includes subjects with at least one record.
 */
describe("subject page attendance summary sentence", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(TODAY);
    setMockIdentity({ isAuthenticated: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /** The summary paragraph, once its fan-out queries have settled. */
  async function findSummary(): Promise<HTMLElement> {
    return screen.findByTestId("attendance.summary");
  }

  it("totals marked classes across all subjects and counts contributing subjects", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    useBackend({
      subjects: [
        makeSubject(1n, "Mathematics", "#E4572E"),
        makeSubject(2n, "Physics", "#7C4DFF"),
        makeSubject(3n, "Chemistry", "#2F9E8F"),
      ],
      attendance: [
        makeAttendance(1n, 1n, "2026-09-18", AttendanceStatus.present),
        makeAttendance(2n, 1n, "2026-09-17", AttendanceStatus.absent),
        makeAttendance(3n, 2n, "2026-09-16", AttendanceStatus.classCancelled),
        // Chemistry has no records, so it must not count as a contributing
        // subject even though it is one of the user's subjects.
      ],
    });

    await openSubject(user);

    const summary = await findSummary();
    // 3 records across Mathematics and Physics; Chemistry contributes none.
    expect(summary).toHaveTextContent(
      "You have marked 3 classes in total, across 2 subjects.",
    );
  });

  it("renders the total number in bold", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    useBackend({
      subjects: [
        makeSubject(1n, "Mathematics", "#E4572E"),
        makeSubject(2n, "Physics", "#7C4DFF"),
      ],
      attendance: [
        makeAttendance(1n, 1n, "2026-09-18", AttendanceStatus.present),
        makeAttendance(2n, 1n, "2026-09-17", AttendanceStatus.absent),
        makeAttendance(3n, 2n, "2026-09-16", AttendanceStatus.present),
      ],
    });

    await openSubject(user);

    const summary = await findSummary();
    const boldTotal = within(summary).getByText("3");
    expect(boldTotal.tagName).toBe("STRONG");
    // The subject count is emphasised the same way.
    const boldSubjects = within(summary).getByText("2");
    expect(boldSubjects.tagName).toBe("STRONG");
  });

  it("uses singular wording for one class from one subject", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    useBackend({
      subjects: [makeSubject(1n, "Mathematics", "#E4572E")],
      attendance: [
        makeAttendance(1n, 1n, "2026-09-18", AttendanceStatus.present),
      ],
    });

    await openSubject(user);

    const summary = await findSummary();
    expect(summary).toHaveTextContent(
      "You have marked 1 class in total, across 1 subject.",
    );
    expect(summary).not.toHaveTextContent("classes");
    expect(summary).not.toHaveTextContent("subjects");
  });

  it("uses plural wording for many classes from one subject", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    useBackend({
      subjects: [makeSubject(1n, "Mathematics", "#E4572E")],
      attendance: [
        makeAttendance(1n, 1n, "2026-09-18", AttendanceStatus.present),
        makeAttendance(2n, 1n, "2026-09-17", AttendanceStatus.absent),
      ],
    });

    await openSubject(user);

    const summary = await findSummary();
    expect(summary).toHaveTextContent(
      "You have marked 2 classes in total, across 1 subject.",
    );
  });

  it("renders a zero total with no subjects", async () => {
    useBackend();

    resetRoute();
    renderWithProviders(<App />);
    // With no subjects there is no subject link to open; the home page is the
    // only reachable surface, so assert the summary is simply absent rather
    // than broken.
    expect(await screen.findByText("No subjects yet")).toBeInTheDocument();
    expect(screen.queryByTestId("attendance.summary")).not.toBeInTheDocument();
  });

  it("renders a zero total when the subject has no marked attendance", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    useBackend({ subjects: [makeSubject(1n, "Mathematics", "#E4572E")] });

    await openSubject(user);

    const summary = await findSummary();
    expect(summary).toHaveTextContent(
      "You have marked 0 classes in total, across 0 subjects.",
    );
    // The empty attendance state still renders alongside the summary.
    expect(
      await screen.findByText("No attendance recorded yet"),
    ).toBeInTheDocument();
  });
});
