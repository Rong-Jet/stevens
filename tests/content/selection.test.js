import { describe, it, expect, beforeEach } from "@jest/globals";
import { getSelection } from "../../src/content/utils/selection.js";

function mockWindowSelection(text, collapsed = false) {
  const range = {
    getBoundingClientRect: () => ({ top: 10, bottom: 30, left: 5, right: 100 }),
  };
  global.window = {
    getSelection: () => ({
      rangeCount: text !== null ? 1 : 0,
      isCollapsed: collapsed,
      toString: () => text ?? "",
      getRangeAt: () => range,
    }),
  };
}

describe("getSelection", () => {
  it("should return text and rect when text is selected", () => {
    mockWindowSelection("hello world");
    const result = getSelection();
    expect(result).not.toBeNull();
    expect(result.text).toBe("hello world");
    expect(result.rect).toBeDefined();
  });

  it("should return null when selection is collapsed", () => {
    mockWindowSelection("", true);
    expect(getSelection()).toBeNull();
  });

  it("should return null when selected text is only whitespace", () => {
    mockWindowSelection("   ");
    expect(getSelection()).toBeNull();
  });

  it("should return null when there is no selection", () => {
    mockWindowSelection(null);
    expect(getSelection()).toBeNull();
  });

  it("should trim whitespace from returned text", () => {
    mockWindowSelection("  trimmed  ");
    expect(getSelection().text).toBe("trimmed");
  });
});
