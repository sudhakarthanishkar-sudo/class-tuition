import { fireEvent, screen, within } from "@testing-library/react";
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

describe("home page subjects", () => {
  beforeEach(() => {
    setMockIdentity({ isAuthenticated: true });
  });

  it("shows the empty state when the signed-in user has no subjects", async () => {
    useBackend();
    renderWithProviders(<App />);

    expect(await screen.findByText("No subjects yet")).toBeInTheDocument();
    expect(screen.getByText("Your subjects")).toBeInTheDocument();
  });

  it("lists each subject with its name and chosen colour", async () => {
    useBackend({
      subjects: [
        makeSubject(1n, "Mathematics", "#E4572E"),
        makeSubject(2n, "Physics", "#7C4DFF"),
      ],
    });
    renderWithProviders(<App />);

    const list = await screen.findByRole("list");
    expect(within(list).getByText("Mathematics")).toBeInTheDocument();
    expect(within(list).getByText("Physics")).toBeInTheDocument();
    expect(screen.getByText("2 subjects")).toBeInTheDocument();

    // The colour swatch is rendered from the subject's stored colour.
    const swatches = list.querySelectorAll("span[style]");
    const colours = Array.from(swatches).map(
      (node) => (node as HTMLElement).style.backgroundColor,
    );
    expect(colours).toContain("rgb(228, 87, 46)");
    expect(colours).toContain("rgb(124, 77, 255)");
  });

  it("creates a subject with a name and colour through the Add Subjects form", async () => {
    const user = userEvent.setup();
    useBackend();
    renderWithProviders(<App />);

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

    expect(state.calls.createSubject).toEqual([
      { name: "Chemistry", colour: "#7C4DFF" },
    ]);
    expect(await screen.findByText("Chemistry")).toBeInTheDocument();
  });

  it("does not submit the form without a subject name", async () => {
    const user = userEvent.setup();
    useBackend();
    renderWithProviders(<App />);

    await user.click(
      await screen.findByRole("button", { name: /add subjects/i }),
    );
    const dialog = await screen.findByRole("dialog");

    expect(
      within(dialog).getByRole("button", { name: /add subject/i }),
    ).toBeDisabled();
    expect(state.calls.createSubject).toHaveLength(0);
  });

  it("reveals a red delete action on swipe and removes the subject", async () => {
    const user = userEvent.setup();
    useBackend({ subjects: [makeSubject(1n, "Mathematics", "#E4572E")] });
    renderWithProviders(<App />);

    const row = await screen.findByRole("link", { name: /mathematics/i });
    // The delete control lives in the swipe track, which is `aria-hidden` until
    // the row is revealed, so it is not reachable by role/name beforehand.
    const track = row.parentElement?.previousElementSibling as HTMLElement;
    expect(track).toHaveAttribute("aria-hidden", "true");

    // Reveal the action with the row's keyboard gesture (ArrowRight), the
    // accessible equivalent of the swipe. jsdom does not deliver pointer
    // coordinates, so the pointer path cannot be driven here.
    fireEvent.keyDown(row.parentElement as HTMLElement, { key: "ArrowRight" });
    expect(track).toHaveAttribute("aria-hidden", "false");

    const deleteButton = screen.getByRole("button", {
      name: /delete mathematics/i,
    });
    await user.click(deleteButton);

    expect(state.calls.deleteSubjectWithAttendance).toEqual([1n]);
    expect(await screen.findByText("No subjects yet")).toBeInTheDocument();
  });
});
