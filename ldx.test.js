import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import mock from "mock-require";

// Mock the config file at the top level
mock("./ldx.config.js", {
  "Test match 1": "✅ Test match 1 processed",
  "Test match 3": "🐳 Test match 3 processed",
});

describe("config file check", () => {
  let errorSpy;
  let exitSpy;

  beforeEach(() => {
    vi.resetModules();
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {});
  });

  test("logs an error and exits when no config file is found", async () => {
    mock.stopAll();
    await import("./ldx.js");
    expect(errorSpy).toHaveBeenCalledWith("Oops, no ldx.config.js file found!");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});

describe("processOutput", () => {
  let warnSpy;

  beforeEach(() => {
    // Reset the module cache before each test
    vi.resetModules();
    // Create a spy on console.warn
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore the original console.warn
    warnSpy.mockRestore();
  });

  test("returns correct message for static string matches", async () => {
    mock("./ldx.config.js", {
      "Test match 1": "✅ Test match 1 processed",
    });
    const { processOutput } = await import("./ldx.js");
    const line = "Test match 1";
    const result = processOutput(line);
    expect(result).toBe("✅ Test match 1 processed");
    expect(warnSpy).not.toHaveBeenCalled();
  });

  test("handles function values correctly", async () => {
    mock("./ldx.config.js", {
      "Function match": (line) => `Processed: ${line}`,
    });
    const { processOutput } = await import("./ldx.js");
    const line = "Function match test line";
    const result = processOutput(line);
    expect(result).toBe(`Processed: ${line}`);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  test("handles function errors gracefully", async () => {
    const errorFn = vi.fn(() => {
      throw new Error("Test error");
    });
    mock("./ldx.config.js", {
      "Error match": errorFn,
    });
    const { processOutput } = await import("./ldx.js");
    const line = "Error match";
    const result = processOutput(line);
    expect(result).toBeUndefined();
    expect(errorFn).toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      "LDX: provided function errored: ",
      "Test error"
    );
  });

  test("returns undefined for no match", async () => {
    mock("./ldx.config.js", { Something: "not used" });
    const { processOutput } = await import("./ldx.js");
    const line = "Some random line";
    const result = processOutput(line);
    expect(result).toBeUndefined();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  test("warns for invalid configuration type", async () => {
    mock("./ldx.config.js", {
      "Invalid match": 12345, // Invalid type (number)
    });
    const { processOutput } = await import("./ldx.js");
    const line = "Invalid match";
    const result = processOutput(line);
    expect(result).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledWith(
      "Invalid configuration for key: Invalid match. Expected string or function."
    );
  });
});

describe("executeAndProcessCommand", () => {
  let logSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    mock.stopAll();
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    // Reset the module cache to ensure fresh imports
    vi.resetModules();
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  test("rejects when no command is provided", async () => {
    const { executeAndProcessCommand } = await import("./ldx.js");
    await expect(executeAndProcessCommand()).rejects.toThrow(
      "No command provided."
    );
  });

  test("resolves when command executes successfully", async () => {
    vi.spyOn(process, "argv", "get").mockReturnValue([
      "node",
      "ldx.js",
      "echo",
      "hello",
    ]);

    const mockSpawn = vi.fn(() => ({
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      on: vi.fn((event, callback) => {
        if (event === "close") callback(0);
      }),
    }));
    vi.spyOn(require("child_process"), "spawn").mockImplementation(mockSpawn);
    const { executeAndProcessCommand } = await import("./ldx.js");
    await expect(executeAndProcessCommand()).resolves.toBeUndefined();
  });

  test("rejects when command fails", async () => {
    vi.spyOn(process, "argv", "get").mockReturnValue([
      "node",
      "ldx.js",
      "false",
    ]);

    const mockSpawn = vi.fn(() => ({
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      on: vi.fn((event, callback) => {
        if (event === "close") callback(1);
      }),
    }));
    vi.spyOn(require("child_process"), "spawn").mockImplementation(mockSpawn);
    const { executeAndProcessCommand } = await import("./ldx.js");
    await expect(executeAndProcessCommand()).rejects.toThrow(
      "Command failed with exit code 1"
    );
  });

  test("processes static strings correctly when command executes", async () => {
    // Setup config mock FIRST
    mock("./ldx.config.js", {
      "Test output": "✅ Processed output",
    });

    vi.spyOn(process, "argv", "get").mockReturnValue([
      "node",
      "ldx.js",
      "echo",
      "Test output",
    ]);

    // Mock spawn to simulate command output
    const mockSpawn = vi.fn(() => ({
      stdout: {
        on: vi.fn((event, callback) => {
          if (event === "data") {
            // Simulate actual command output
            callback(Buffer.from("Test output\n"));
          }
        }),
      },
      stderr: { on: vi.fn() },
      on: vi.fn((event, callback) => {
        if (event === "close") callback(0);
      }),
    }));
    vi.spyOn(require("child_process"), "spawn").mockImplementation(mockSpawn);

    // Import AFTER all mocks are set up
    const { executeAndProcessCommand } = await import("./ldx.js");
    await executeAndProcessCommand();

    expect(logSpy).toHaveBeenCalledWith("✅ Processed output");
  });
});
