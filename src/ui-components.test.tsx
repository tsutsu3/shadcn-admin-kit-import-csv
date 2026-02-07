// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// Mock translateWrapper to avoid ra-core context dependency
vi.mock("./translateWrapper", () => ({
  translateWrapper: () => (key: string, _args?: any) => key,
}));

// Mock shared dialog components to avoid Radix UI portal issues in jsdom
vi.mock("./components/SharedDialogWrapper", () => ({
  SharedDialogWrapper: ({ open, title, subTitle, children }: any) =>
    open ? (
      <div data-testid="dialog-wrapper">
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

// Mock UI primitives for ImportButtonUI (avoid Radix tooltip portal)
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

import { ImportCsvDialogStrategy } from "./components/import-csv-dialog-strategy";
import { ImportCsvDialogEachItem } from "./components/import-csv-dialog-each-item";
import { ImportButtonUI } from "./components/import-button";

// ─── ImportCsvDialogStrategy ────────────────────────────────────────

describe("ImportCsvDialogStrategy", () => {
  const baseProps = () => ({
    disableImportOverwrite: false,
    resourceName: "posts",
    fileName: "test.csv",
    count: 5,
    handleClose: vi.fn(),
    handleReplace: vi.fn(),
    handleSkip: vi.fn(),
    handleAskDecide: vi.fn(),
    open: true,
    isLoading: false,
    idsConflicting: ["1", "2"],
  });

  beforeEach(() => {
    cleanup();
  });

  it("should render three strategy buttons when open with conflicting ids", () => {
    render(<ImportCsvDialogStrategy {...baseProps()} />);
    expect(screen.getByTestId("dialog-wrapper")).toBeInTheDocument();
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3);
  });

  it("should show loader when isLoading is true", () => {
    render(<ImportCsvDialogStrategy {...baseProps()} isLoading={true} />);
    expect(screen.getByTestId("loader")).toBeInTheDocument();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("should not render when open is false", () => {
    render(<ImportCsvDialogStrategy {...baseProps()} open={false} />);
    expect(screen.queryByTestId("dialog-wrapper")).not.toBeInTheDocument();
  });

  it("should call handleReplace when Replace button is clicked", () => {
    const props = baseProps();
    render(<ImportCsvDialogStrategy {...props} />);
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[0]); // Replace button
    expect(props.handleReplace).toHaveBeenCalledTimes(1);
  });

  it("should call handleSkip when Skip button is clicked", () => {
    const props = baseProps();
    render(<ImportCsvDialogStrategy {...props} />);
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[1]); // Skip button
    expect(props.handleSkip).toHaveBeenCalledTimes(1);
  });

  it("should call handleAskDecide when Decide button is clicked", () => {
    const props = baseProps();
    render(<ImportCsvDialogStrategy {...props} />);
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[2]); // Let me decide button
    expect(props.handleAskDecide).toHaveBeenCalledTimes(1);
  });

  it("should disable Replace button when disableImportOverwrite is true", () => {
    render(
      <ImportCsvDialogStrategy {...baseProps()} disableImportOverwrite={true} />,
    );
    const buttons = screen.getAllByRole("button");
    expect(buttons[0]).toBeDisabled();
    expect(buttons[1]).not.toBeDisabled();
    expect(buttons[2]).not.toBeDisabled();
  });

  it("should not render buttons when idsConflicting is empty", () => {
    render(<ImportCsvDialogStrategy {...baseProps()} idsConflicting={[]} />);
    expect(screen.getByTestId("dialog-wrapper")).toBeInTheDocument();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });
});

// ─── ImportCsvDialogEachItem ────────────────────────────────────────

describe("ImportCsvDialogEachItem", () => {
  const baseProps = () => ({
    disableImportNew: false,
    disableImportOverwrite: false,
    currentValue: { id: "1", title: "Test Post" },
    resourceName: "posts",
    values: [
      { id: "1", title: "Test Post" },
      { id: "2", title: "Another" },
    ],
    fileName: "test.csv",
    openAskDecide: true,
    handleClose: vi.fn(),
    handleAskDecideReplace: vi.fn(),
    handleAskDecideAddAsNew: vi.fn(),
    handleAskDecideSkip: vi.fn(),
    handleAskDecideSkipAll: vi.fn(),
    isLoading: false,
    idsConflicting: ["1", "2"],
  });

  beforeEach(() => {
    cleanup();
  });

  it("should render four action buttons when open", () => {
    render(<ImportCsvDialogEachItem {...baseProps()} />);
    expect(screen.getByTestId("dialog-wrapper")).toBeInTheDocument();
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(4);
  });

  it("should show loader when isLoading is true", () => {
    render(<ImportCsvDialogEachItem {...baseProps()} isLoading={true} />);
    expect(screen.getByTestId("loader")).toBeInTheDocument();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("should not render when openAskDecide is false", () => {
    render(
      <ImportCsvDialogEachItem {...baseProps()} openAskDecide={false} />,
    );
    expect(screen.queryByTestId("dialog-wrapper")).not.toBeInTheDocument();
  });

  it("should call handleAskDecideReplace when Replace button is clicked", () => {
    const props = baseProps();
    render(<ImportCsvDialogEachItem {...props} />);
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[0]); // Replace button
    expect(props.handleAskDecideReplace).toHaveBeenCalledTimes(1);
  });

  it("should call handleAskDecideAddAsNew when Add-as-new button is clicked", () => {
    const props = baseProps();
    render(<ImportCsvDialogEachItem {...props} />);
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[1]); // Add-as-new button
    expect(props.handleAskDecideAddAsNew).toHaveBeenCalledTimes(1);
  });

  it("should call handleAskDecideSkip when Skip button is clicked", () => {
    const props = baseProps();
    render(<ImportCsvDialogEachItem {...props} />);
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[2]); // Skip button
    expect(props.handleAskDecideSkip).toHaveBeenCalledTimes(1);
  });

  it("should call handleAskDecideSkipAll when Cancel button is clicked", () => {
    const props = baseProps();
    render(<ImportCsvDialogEachItem {...props} />);
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[3]); // Cancel button
    expect(props.handleAskDecideSkipAll).toHaveBeenCalledTimes(1);
  });

  it("should disable Replace button when disableImportOverwrite is true", () => {
    render(
      <ImportCsvDialogEachItem
        {...baseProps()}
        disableImportOverwrite={true}
      />,
    );
    const buttons = screen.getAllByRole("button");
    expect(buttons[0]).toBeDisabled();
    expect(buttons[1]).not.toBeDisabled();
  });

  it("should disable Add-as-new button when disableImportNew is true", () => {
    render(
      <ImportCsvDialogEachItem {...baseProps()} disableImportNew={true} />,
    );
    const buttons = screen.getAllByRole("button");
    expect(buttons[0]).not.toBeDisabled();
    expect(buttons[1]).toBeDisabled();
  });

  it("should disable both Replace and Add-as-new when both flags are true", () => {
    render(
      <ImportCsvDialogEachItem
        {...baseProps()}
        disableImportOverwrite={true}
        disableImportNew={true}
      />,
    );
    const buttons = screen.getAllByRole("button");
    expect(buttons[0]).toBeDisabled();
    expect(buttons[1]).toBeDisabled();
    expect(buttons[2]).not.toBeDisabled();
    expect(buttons[3]).not.toBeDisabled();
  });
});

// ─── ImportButtonUI ─────────────────────────────────────────────────

describe("ImportButtonUI", () => {
  const baseProps = () => ({
    label: "Import",
    clickImportButton: vi.fn(),
    onFileAdded: vi.fn(),
    onRef: vi.fn(),
  });

  beforeEach(() => {
    cleanup();
  });

  it("should render button with label text", () => {
    render(<ImportButtonUI {...baseProps()} />);
    expect(screen.getByText("Import")).toBeInTheDocument();
  });

  it("should call clickImportButton when button is clicked", () => {
    const props = baseProps();
    render(<ImportButtonUI {...props} />);
    fireEvent.click(screen.getByText("Import"));
    expect(props.clickImportButton).toHaveBeenCalledTimes(1);
  });

  it("should have a hidden file input that accepts .csv,.tsv", () => {
    const { container } = render(<ImportButtonUI {...baseProps()} />);
    const input = container.querySelector('input[type="file"]');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("accept", ".csv,.tsv");
  });

  it("should call onFileAdded when a file is selected", () => {
    const props = baseProps();
    const { container } = render(<ImportButtonUI {...props} />);
    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    fireEvent.change(input, {
      target: { files: [new File(["id,title"], "data.csv")] },
    });
    expect(props.onFileAdded).toHaveBeenCalledTimes(1);
  });

  it("should call onRef with the input element", () => {
    const props = baseProps();
    render(<ImportButtonUI {...props} />);
    expect(props.onRef).toHaveBeenCalled();
  });
});
