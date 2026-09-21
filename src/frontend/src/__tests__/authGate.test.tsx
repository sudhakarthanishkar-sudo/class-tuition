import { screen } from "@testing-library/react";
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

const state = createMockBackendState({
  subjects: [makeSubject(1n, "Mathematics", "#E4572E")],
});
setMockActor(createMockBackendActor(state));

// Imported after the mocks are installed so the app resolves the mocked modules.
const { default: App } = await import("@/App");

describe("authentication gate", () => {
  beforeEach(() => {
    setMockIdentity();
  });

  it("shows the login screen to an unauthenticated visitor and hides the subject list", async () => {
    renderWithProviders(<App />);

    expect(
      await screen.findByRole("button", {
        name: /sign in with internet identity/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Attendance Book")).toBeInTheDocument();
    // The signed-in home content must not be reachable.
    expect(screen.queryByText("Your subjects")).not.toBeInTheDocument();
    expect(screen.queryByText("Mathematics")).not.toBeInTheDocument();
  });

  it("invokes Internet Identity login when the sign-in button is pressed", async () => {
    const user = userEvent.setup();
    const identity = setMockIdentity();
    renderWithProviders(<App />);

    await user.click(
      await screen.findByRole("button", {
        name: /sign in with internet identity/i,
      }),
    );

    expect(identity.login).toHaveBeenCalledTimes(1);
  });

  it("shows a loading state while Internet Identity initializes", () => {
    setMockIdentity({ isInitializing: true });
    renderWithProviders(<App />);

    expect(
      screen.getByText("Opening your attendance book…"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /sign in/i }),
    ).not.toBeInTheDocument();
  });

  it("surfaces a sign-in error to the visitor", async () => {
    setMockIdentity({ loginError: "Login failed" });
    renderWithProviders(<App />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /sign-in did not complete/i,
    );
  });

  it("renders the home page once authenticated", async () => {
    setMockIdentity({ isAuthenticated: true });
    renderWithProviders(<App />);

    expect(
      await screen.findByRole("heading", { name: "Hello Thanishkar" }),
    ).toBeInTheDocument();
    // The subtitle appears in both the app bar and the home hero.
    expect(
      screen.getAllByText("Class Tuition Attendance").length,
    ).toBeGreaterThan(0);
  });
});
