import { vi } from "vitest";

import type { MockBackendActor } from "@/test/mockBackend";

/**
 * The Internet Identity surface the app consumes. Tests drive it directly so a
 * journey can start signed-out, sign in, and sign out without a real provider.
 */
export interface MockIdentity {
  isAuthenticated: boolean;
  isInitializing: boolean;
  isLoggingIn: boolean;
  loginError: string | null;
  login: ReturnType<typeof vi.fn>;
  clear: ReturnType<typeof vi.fn>;
}

export function createMockIdentity(
  overrides: Partial<MockIdentity> = {},
): MockIdentity {
  return {
    isAuthenticated: false,
    isInitializing: false,
    isLoggingIn: false,
    loginError: null,
    login: vi.fn(),
    clear: vi.fn(),
    ...overrides,
  };
}

/**
 * `vi.mock` factories are hoisted above module scope, so the values they close
 * over must be created by `vi.hoisted`. The holder is deliberately not exported
 * — Vitest rejects an exported hoisted binding — and is reached through the
 * accessor functions below, which the hoisted factories call at render time.
 */
const appMock = vi.hoisted(() => ({
  identity: {
    isAuthenticated: false,
    isInitializing: false,
    isLoggingIn: false,
    loginError: null as string | null,
    login: (() => {}) as (...args: unknown[]) => unknown,
    clear: (() => {}) as (...args: unknown[]) => unknown,
  },
  actor: null as MockBackendActor | null,
}));

export function getMockIdentity(): MockIdentity {
  return appMock.identity as MockIdentity;
}

export function getMockActor(): MockBackendActor | null {
  return appMock.actor;
}

/** Point the mocked identity at a fresh object so per-test overrides are clean. */
export function setMockIdentity(
  overrides: Partial<MockIdentity> = {},
): MockIdentity {
  const identity = createMockIdentity(overrides);
  appMock.identity = identity;
  return identity;
}

export function setMockActor(actor: MockBackendActor | null): void {
  appMock.actor = actor;
}
