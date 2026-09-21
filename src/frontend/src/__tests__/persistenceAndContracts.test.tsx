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
import { createTestQueryClient, renderWithProviders } from "@/test/harness";
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

describe("persistence across a refresh", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(TODAY);
    setMockIdentity({ isAuthenticated: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("re-reads subjects from the backend after a fresh mount", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    useBackend();

    resetRoute();
    const first = renderWithProviders(<App />);
    await user.click(
      await screen.findByRole("button", { name: /add subjects/i }),
    );
    const dialog = await screen.findByRole("dialog");
    await user.type(
      within(dialog).getByLabelText(/subject name/i),
      "Chemistry",
    );
    await user.click(
      within(dialog).getByRole("button", { name: /use colour #7C4DFF/i }),
    );
    await user.click(
      within(dialog).getByRole("button", { name: /add subject/i }),
    );
    expect(await screen.findByText("Chemistry")).toBeInTheDocument();

    // A refresh tears down the component tree and the query cache, then mounts
    // the app again against the same backend. The subject must come back from
    // the actor, not from in-memory UI state.
    first.unmount();
    resetRoute();
    renderWithProviders(<App />, createTestQueryClient());

    expect(await screen.findByText("Chemistry")).toBeInTheDocument();
    expect(state.calls.createSubject).toEqual([
      { name: "Chemistry", colour: "#7C4DFF" },
    ]);
  });

  it("re-reads recorded attendance from the backend after a fresh mount", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    useBackend({ subjects: [makeSubject(1n, "Mathematics", "#E4572E")] });

    resetRoute();
    const first = renderWithProviders(<App />);
    await user.click(await screen.findByRole("link", { name: /mathematics/i }));
    const card = await screen.findByTestId("attendance.mark_today_card");
    await user.click(within(card).getByRole("button", { name: /present/i }));
    expect(await screen.findByText(TODAY_SHORT)).toBeInTheDocument();

    first.unmount();
    resetRoute();
    renderWithProviders(<App />, createTestQueryClient());
    await user.click(await screen.findByRole("link", { name: /mathematics/i }));

    // The record survives the remount because it was written to the backend.
    const list = await screen.findByTestId("attendance.list");
    expect(within(list).getByText(TODAY_SHORT)).toBeInTheDocument();
    expect(within(list).getByText("Present")).toBeInTheDocument();
  });
});

describe("recorded-date swipe reveal", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(TODAY);
    setMockIdentity({ isAuthenticated: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("removes only the swiped date and keeps the others", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    useBackend({
      subjects: [makeSubject(1n, "Mathematics", "#E4572E")],
      attendance: [
        makeAttendance(1n, 1n, TODAY_KEY, AttendanceStatus.present),
        makeAttendance(2n, 1n, "2026-09-17", AttendanceStatus.absent),
      ],
    });

    resetRoute();
    renderWithProviders(<App />);
    await user.click(await screen.findByRole("link", { name: /mathematics/i }));

    const list = await screen.findByTestId("attendance.list");
    const deleteButton = within(list).getByRole("button", {
      name: new RegExp(`delete attendance for ${TODAY_SHORT}`, "i"),
    });
    await user.click(deleteButton);

    expect(state.calls.deleteAttendance).toEqual([1n]);
    expect(within(list).getByText("17 Sept")).toBeInTheDocument();
    expect(within(list).queryByText(TODAY_SHORT)).not.toBeInTheDocument();
  });
});

describe("backend consumer contract", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(TODAY);
    setMockIdentity({ isAuthenticated: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls the actor with the exact typed arguments for each mutation", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    useBackend({ subjects: [makeSubject(1n, "Mathematics", "#E4572E")] });

    resetRoute();
    renderWithProviders(<App />);
    await user.click(await screen.findByRole("link", { name: /mathematics/i }));

    // recordAttendance(subjectId: bigint, date: DateKey, status: AttendanceStatus)
    const card = await screen.findByTestId("attendance.mark_today_card");
    await user.click(within(card).getByRole("button", { name: /absent/i }));
    expect(state.calls.recordAttendance).toEqual([
      { subjectId: 1n, date: TODAY_KEY, status: AttendanceStatus.absent },
    ]);

    // deleteAttendance(id: bigint) — the id of the record just written.
    const list = await screen.findByTestId("attendance.list");
    const recordedId = state.attendance[0]?.id;
    expect(recordedId).toBeDefined();
    await user.click(
      within(list).getByRole("button", {
        name: new RegExp(`delete attendance for ${TODAY_SHORT}`, "i"),
      }),
    );
    expect(state.calls.deleteAttendance).toEqual([recordedId]);
  });

  it("calls deleteSubjectWithAttendance with the subject id", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    useBackend({ subjects: [makeSubject(7n, "Physics", "#7C4DFF")] });

    resetRoute();
    renderWithProviders(<App />);
    const row = await screen.findByRole("link", { name: /physics/i });
    fireEvent.keyDown(row.parentElement as HTMLElement, { key: "ArrowRight" });
    await user.click(screen.getByRole("button", { name: /delete physics/i }));

    expect(state.calls.deleteSubjectWithAttendance).toEqual([7n]);
  });
});
