import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Unmount React trees and reset storage between tests for isolation.
afterEach(() => {
  cleanup();
  localStorage.clear();
});
