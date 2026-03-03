import { test, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MainContent } from "@/app/main-content";

vi.mock("@/lib/contexts/file-system-context", () => ({
  FileSystemProvider: ({ children }: any) => <>{children}</>,
  useFileSystem: vi.fn(),
}));

vi.mock("@/lib/contexts/chat-context", () => ({
  ChatProvider: ({ children }: any) => <>{children}</>,
  useChat: vi.fn(),
}));

vi.mock("@/components/chat/ChatInterface", () => ({
  ChatInterface: () => <div data-testid="chat-interface" />,
}));

vi.mock("@/components/editor/FileTree", () => ({
  FileTree: () => <div data-testid="file-tree" />,
}));

vi.mock("@/components/editor/CodeEditor", () => ({
  CodeEditor: () => <div data-testid="code-editor" />,
}));

vi.mock("@/components/preview/PreviewFrame", () => ({
  PreviewFrame: () => <div data-testid="preview-frame" />,
}));

vi.mock("@/components/HeaderActions", () => ({
  HeaderActions: () => <div data-testid="header-actions" />,
}));

vi.mock("@/components/ui/resizable", () => ({
  ResizablePanelGroup: ({ children }: any) => <div>{children}</div>,
  ResizablePanel: ({ children }: any) => <div>{children}</div>,
  ResizableHandle: () => <div />,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

test("Preview tab is active by default", () => {
  render(<MainContent />);

  expect(screen.getByTestId("preview-frame")).toBeDefined();
  expect(screen.queryByTestId("code-editor")).toBeNull();
});

test("Clicking Code tab shows code editor", () => {
  render(<MainContent />);

  const codeTab = screen.getByRole("tab", { name: "Code" });
  fireEvent.click(codeTab);

  expect(screen.getByTestId("code-editor")).toBeDefined();
  expect(screen.queryByTestId("preview-frame")).toBeNull();
});

test("Clicking Preview tab shows preview frame", () => {
  render(<MainContent />);

  // Switch to Code first
  const codeTab = screen.getByRole("tab", { name: "Code" });
  fireEvent.click(codeTab);
  expect(screen.getByTestId("code-editor")).toBeDefined();

  // Switch back to Preview
  const previewTab = screen.getByRole("tab", { name: "Preview" });
  fireEvent.click(previewTab);

  expect(screen.getByTestId("preview-frame")).toBeDefined();
  expect(screen.queryByTestId("code-editor")).toBeNull();
});

test("Tabs toggle correctly multiple times", () => {
  render(<MainContent />);

  const previewTab = screen.getByRole("tab", { name: "Preview" });
  const codeTab = screen.getByRole("tab", { name: "Code" });

  // Start on preview
  expect(screen.getByTestId("preview-frame")).toBeDefined();

  // Switch to code
  fireEvent.click(codeTab);
  expect(screen.queryByTestId("preview-frame")).toBeNull();
  expect(screen.getByTestId("code-editor")).toBeDefined();

  // Switch back to preview
  fireEvent.click(previewTab);
  expect(screen.getByTestId("preview-frame")).toBeDefined();
  expect(screen.queryByTestId("code-editor")).toBeNull();

  // Switch to code again
  fireEvent.click(codeTab);
  expect(screen.queryByTestId("preview-frame")).toBeNull();
  expect(screen.getByTestId("code-editor")).toBeDefined();
});
