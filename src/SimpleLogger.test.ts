import { describe, it, expect, vi } from "vitest";
import { SimpleLogger } from "./SimpleLogger";

describe("SimpleLogger", () => {
  it("should log when enabled", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const logger = new SimpleLogger("test", true);
    logger.log("hello");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("should not log when disabled", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const logger = new SimpleLogger("test", false);
    logger.log("hello");
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("should toggle via setEnabled", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const logger = new SimpleLogger("test", false);

    logger.log("should not appear");
    expect(spy).not.toHaveBeenCalled();

    logger.setEnabled(true);
    logger.log("should appear");
    expect(spy).toHaveBeenCalled();

    spy.mockRestore();
  });

  it("should warn when enabled", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const logger = new SimpleLogger("test", true);
    logger.warn("warning");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("should error when enabled", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const logger = new SimpleLogger("test", true);
    logger.error("error");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("should include prefix in log output", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const logger = new SimpleLogger("my-module", true);
    logger.log("test message");

    const logString = spy.mock.calls[0]?.[0] as string;
    expect(logString).toContain("shadcn-ra-csv-import::");
    expect(logString).toContain("my-module");

    spy.mockRestore();
  });
});
