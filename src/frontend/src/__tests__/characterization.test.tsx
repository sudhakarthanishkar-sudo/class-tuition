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

/**
 * The swipe track is the sibling immediately before the draggable card. The
 * subject row wraps a `Link`; the attendance row wraps a `button`.
 */
function swipeTrackOf(card: HTMLElement): HTMLElement {
  const track = card.parentElement?.previousElementSibling;
  if (!(track instanceof HTMLElement)) {
    throw new Error("expected a swipe track before the card");
  }
  return track;
}

describe("characterization: swipe-to-delete reveal", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(TODAY);
    setMockIdentity({ isAuthenticated: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps the subject delete action hidden until the row is swiped right", async () => {
    useBackend({ subjects: [makeSubject(1n, "Mathematics", "#E4572E")] });
    renderWithProviders(<App />);

    const row = await screen.findByRole("link", { name: /mathematics/i });
    const track = swipeTrackOf(row);
    // The delete control lives in the swipe track, which is `aria-hidden` until
    // the row is revealed, so it is not reachable by role/name beforehand.
    const deleteButton = screen.getByTestId("subject.delete_button.1");
    expect(deleteButton).toHaveAttribute("aria-label", "Delete Mathematics");
    expect(track).toHaveAttribute("aria-hidden", "true");
    expect(deleteButton).toHaveAttribute("tabindex", "-1");

    // ArrowRight is the accessible equivalent of a right swipe; jsdom does not
    // deliver pointer coordinates, so the pointer path cannot be driven here.
    fireEvent.keyDown(row.parentElement as HTMLElement, { key: "ArrowRight" });

    expect(track).toHaveAttribute("aria-hidden", "false");
    expect(deleteButton).toHaveAttribute("tabindex", "0");
  });

  it("closes the subject delete reveal again on ArrowLeft", async () => {
    useBackend({ subjects: [makeSubject(1n, "Mathematics", "#E4572E")] });
    renderWithProviders(<App />);

    const row = await screen.findByRole("link", { name: /mathematics/i });
    const track = swipeTrackOf(row);
    const gestureTarget = row.parentElement as HTMLElement;

    fireEvent.keyDown(gestureTarget, { key: "ArrowRight" });
    expect(track).toHaveAttribute("aria-hidden", "false");

    fireEvent.keyDown(gestureTarget, { key: "ArrowLeft" });
    expect(track).toHaveAttribute("aria-hidden", "true");
  });

  it("keeps the recorded-date delete action reachable and removes only that date", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    useBackend({
      subjects: [makeSubject(1n, "Mathematics", "#E4572E")],
      attendance: [
        makeAttendance(1n, 1n, TODAY_KEY, AttendanceStatus.present),
        makeAttendance(2n, 1n, "2026-09-17", AttendanceStatus.absent),
      ],
    });

    await openSubject(user);

    const list = await screen.findByTestId("attendance.list");
    const deleteButton = within(list).getByRole("button", {
      name: new RegExp(`delete attendance for ${TODAY_SHORT}`, "i"),
    });
    // The recorded-date delete action is always present for desktop users.
    expect(deleteButton).toBeEnabled();

    await user.click(deleteButton);

    expect(state.calls.deleteAttendance).toEqual([1n]);
    // The other recorded date survives the delete.
    expect(within(list).getByText("17 Sept")).toBeInTheDocument();
    expect(within(list).queryByText(TODAY_SHORT)).not.toBeInTheDocument();
  });
});

describe("characterization: subject detail navigation", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(TODAY);
    setMockIdentity({ isAuthenticated: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows a not-found state for an unknown subject id", async () => {
    useBackend({ subjects: [makeSubject(1n, "Mathematics", "#E4572E")] });

    window.history.replaceState(null, "", "/subjects/999");
    renderWithProviders(<App />);

    expect(await screen.findByText("Subject not found")).toBeInTheDocument();
  });

  it("keeps the mark-today card and calendar on the subject view", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    useBackend({ subjects: [makeSubject(1n, "Mathematics", "#E4572E")] });

    await openSubject(user);

    expect(
      await screen.findByTestId("attendance.mark_today_card"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("attendance.calendar_card")).toBeInTheDocument();
  });
});
