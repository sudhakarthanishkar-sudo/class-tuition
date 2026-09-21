import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

describe("subject detail navigation", () => {
  beforeEach(() => {
    setMockIdentity({ isAuthenticated: true });
  });

  it("shows the empty attendance state for a subject with no records", async () => {
    const user = userEvent.setup();
    useBackend({ subjects: [makeSubject(1n, "Mathematics", "#E4572E")] });

    resetRoute();
    renderWithProviders(<App />);
    await user.click(await screen.findByRole("link", { name: /mathematics/i }));

    expect(
      await screen.findByRole("heading", { name: "Mathematics" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("No attendance recorded yet"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("attendance.list")).not.toBeInTheDocument();
  });

  it("returns to the subject list from the back link", async () => {
    const user = userEvent.setup();
    useBackend({
      subjects: [
        makeSubject(1n, "Mathematics", "#E4572E"),
        makeSubject(2n, "Physics", "#7C4DFF"),
      ],
    });

    resetRoute();
    renderWithProviders(<App />);
    await user.click(await screen.findByRole("link", { name: /mathematics/i }));
    await screen.findByRole("heading", { name: "Mathematics" });

    await user.click(screen.getByTestId("subject.back_link"));

    const list = await screen.findByRole("list");
    expect(within(list).getByText("Mathematics")).toBeInTheDocument();
    expect(within(list).getByText("Physics")).toBeInTheDocument();
    expect(screen.getByText("Your subjects")).toBeInTheDocument();
  });
});
