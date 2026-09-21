import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterEach } from "vitest";

// Generated components mark stable hooks with `data-ocid`, not `data-testid`.
// Point the test-id query at that attribute once, so `getByTestId` works for
// controls that are not reachable by accessible role (e.g. the delete button
// inside an `aria-hidden` swipe track).
configure({ testIdAttribute: "data-ocid" });

// React Testing Library does not auto-clean when Vitest globals are disabled.
afterEach(() => {
  cleanup();
});

// jsdom implements neither pointer capture method, and components that call
// them (e.g. the swipe-to-delete rows) throw inside their pointer handlers
// without these. Provide inert stand-ins so pointer interactions are testable.
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {};
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {};
}
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}
