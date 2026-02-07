// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
  act,
} from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// ─── Mocks ──────────────────────────────────────────────────────────

const mockNotify = vi.fn();
const mockRefresh = vi.fn();

vi.mock("ra-core", () => ({
  useRefresh: () => mockRefresh,
  useNotify: () => mockNotify,
  useDataProvider: () => ({}),
  useResourceContext: () => "posts",
}));

vi.mock("./translateWrapper", () => ({
  translateWrapper: () => (key: string, _args?: any) => key,
}));

vi.mock("./import-controller", () => ({
  GetCSVItems: vi.fn(),
  CheckCSVValidation: vi.fn().mockResolvedValue(undefined),
  GetIdsColliding: vi.fn(),
}));

vi.mock("./uploader", () => ({
  create: vi.fn().mockResolvedValue(undefined),
  update: vi.fn().mockResolvedValue(undefined),
}));

// Simplified UI mocks (avoid Radix portal issues in jsdom)
vi.mock("./components/SharedDialogWrapper", () => ({
  SharedDialogWrapper: ({ open, title, subTitle, children }: any) =>
    open ? (
      <div data-testid="dialog" data-title={title}>
        <h2>{title}</h2>
        <p>{subTitle}</p>
        {children}
      </div>
    ) : null,
}));

vi.mock("./components/SharedDialogButton", () => ({
  SharedDialogButton: ({ onClick, label, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  ),
}));

vi.mock("./components/SharedLoader", () => ({
  SharedLoader: ({ loadingTxt }: any) => (
    <div data-testid="loader">{loadingTxt}</div>
  ),
}));

vi.mock("./ui/tooltip", () => ({
  Tooltip: ({ children }: any) => <div>{children}</div>,
  TooltipTrigger: ({ children }: any) => <div>{children}</div>,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("./ui/button", () => ({
  Button: ({ children, onClick, ...rest }: any) => (
    <button onClick={onClick} {...rest}>
      {children}
    </button>
  ),
}));

// ─── Imports (after mocks) ──────────────────────────────────────────

import { ImportButton } from "./main-csv-button";
import { GetCSVItems, GetIdsColliding } from "./import-controller";
import { create, update } from "./uploader";

// ─── Test helpers ───────────────────────────────────────────────────

/** Renders ImportButton, selects a file, and waits for the strategy dialog. */
async function openStrategyDialog() {
  const result = render(<ImportButton />);
  const input = result.container.querySelector(
    'input[type="file"]',
  ) as HTMLInputElement;

  await act(async () => {
    fireEvent.change(input, {
      target: { files: [new File([""], "test.csv")] },
    });
  });

  // Wait for async CSV processing → strategy dialog appears
  await waitFor(() => {
    expect(
      screen.getByText("csv.dialogImport.buttons.letmeDecide"),
    ).toBeInTheDocument();
  });

  return result;
}

/** Clicks "Let me decide" and waits for the per-item dialog to appear. */
async function clickLetMeDecide() {
  const btn = screen.getByText("csv.dialogImport.buttons.letmeDecide");
  await act(async () => {
    fireEvent.click(btn);
  });
  await waitFor(() => {
    expect(
      screen.getByText("csv.dialogDecide.buttons.replaceRow"),
    ).toBeInTheDocument();
  });
}

// ─── Tests ──────────────────────────────────────────────────────────

describe("ImportButton - 'Let me decide' flow", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();

    // 3 CSV rows: id=1 is new, id=2 and id=3 collide with existing records
    vi.mocked(GetCSVItems).mockResolvedValue([
      { id: "1", title: "New" },
      { id: "2", title: "Conflict B" },
      { id: "3", title: "Conflict C" },
    ]);
    vi.mocked(GetIdsColliding).mockResolvedValue(["2", "3"]);
  });

  it("should auto-create non-colliding items and show strategy dialog", async () => {
    await openStrategyDialog();

    // Non-colliding item {id:"1"} should be auto-created
    expect(create).toHaveBeenCalledTimes(1);
    const createdValues = vi.mocked(create).mock.calls[0][4];
    expect(createdValues).toEqual([{ id: "1", title: "New" }]);

    // Strategy dialog shows 3 buttons
    expect(
      screen.getByText("csv.dialogImport.buttons.replaceAllConflicts"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("csv.dialogImport.buttons.skipAllConflicts"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("csv.dialogImport.buttons.letmeDecide"),
    ).toBeInTheDocument();
  });

  it("should switch to per-item dialog with 4 choices after 'Let me decide'", async () => {
    await openStrategyDialog();
    await clickLetMeDecide();

    expect(
      screen.getByText("csv.dialogDecide.buttons.replaceRow"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("csv.dialogDecide.buttons.addAsNewRow"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("csv.dialogDecide.buttons.skipDontReplace"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("csv.dialogCommon.buttons.cancel"),
    ).toBeInTheDocument();
  });

  it("should call update when 'Replace row' is clicked per-item", async () => {
    await openStrategyDialog();
    await clickLetMeDecide();

    fireEvent.click(screen.getByText("csv.dialogDecide.buttons.replaceRow"));

    await waitFor(() => {
      expect(update).toHaveBeenCalled();
    });
  });

  it("should call create without id when 'Add as new' is clicked per-item", async () => {
    await openStrategyDialog();
    await clickLetMeDecide();

    vi.mocked(create).mockClear();

    fireEvent.click(screen.getByText("csv.dialogDecide.buttons.addAsNewRow"));

    await waitFor(() => {
      expect(create).toHaveBeenCalledTimes(1);
    });
    // The created item should have its id removed
    const vals = vi.mocked(create).mock.calls[0][4];
    expect(vals[0]).not.toHaveProperty("id");
  });

  it("should skip item without calling create/update when 'Skip' is clicked", async () => {
    await openStrategyDialog();
    vi.mocked(create).mockClear();

    await clickLetMeDecide();

    fireEvent.click(
      screen.getByText("csv.dialogDecide.buttons.skipDontReplace"),
    );

    // Neither create nor update should be called for the skip
    await waitFor(() => {
      // Dialog should still be open (one more conflicting item remains)
      expect(screen.getByTestId("dialog")).toBeInTheDocument();
    });
    expect(create).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it("should close all dialogs when 'Skip all' (cancel) is clicked", async () => {
    await openStrategyDialog();
    await clickLetMeDecide();

    fireEvent.click(screen.getByText("csv.dialogCommon.buttons.cancel"));

    await waitFor(() => {
      expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
    });
    expect(mockNotify).toHaveBeenCalled();
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("should cycle through all conflicting items then close", async () => {
    await openStrategyDialog();
    await clickLetMeDecide();

    // Skip first conflicting item (id=3, popped last from ["2","3"])
    fireEvent.click(
      screen.getByText("csv.dialogDecide.buttons.skipDontReplace"),
    );

    // Dialog stays open for second conflicting item (id=2)
    await waitFor(() => {
      expect(screen.getByTestId("dialog")).toBeInTheDocument();
    });

    // Skip second conflicting item (id=2)
    fireEvent.click(
      screen.getByText("csv.dialogDecide.buttons.skipDontReplace"),
    );

    // No more conflicting items → dialog closes
    await waitFor(() => {
      expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
    });
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("should replace first item then skip second item", async () => {
    await openStrategyDialog();
    await clickLetMeDecide();

    // Replace first conflicting item (id=3)
    fireEvent.click(screen.getByText("csv.dialogDecide.buttons.replaceRow"));

    await waitFor(() => {
      expect(update).toHaveBeenCalledTimes(1);
    });

    // Dialog should still be open for second item
    await waitFor(() => {
      expect(screen.getByTestId("dialog")).toBeInTheDocument();
    });

    // Skip second conflicting item (id=2)
    fireEvent.click(
      screen.getByText("csv.dialogDecide.buttons.skipDontReplace"),
    );

    await waitFor(() => {
      expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
    });
  });
});
