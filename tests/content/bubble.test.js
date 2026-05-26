/**
 * @jest-environment jsdom
 */
import { describe, it, expect, beforeEach, jest } from "@jest/globals";

const mockSpeak = jest.fn();

jest.unstable_mockModule("../../src/content/utils/speech.js", () => ({
  speak: mockSpeak,
  toBCP47: (deeplLang) => ({
    EN: "en-US",
    DE: "de-DE",
    ES: "es-ES",
  })[deeplLang] ?? "en-US",
}));

const { createBubble, showError, showLoading, showResult } = await import("../../src/content/components/bubble.js");

describe("showLoading", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("should render a drag handle when the PDF fallback bubble is movable", () => {
    const bubble = createBubble();

    showLoading(bubble, { left: 20, top: 10, right: 20, bottom: 30 }, { movable: true });

    expect(bubble.querySelector(".stevens-drag-handle")).not.toBeNull();
  });

  it("should move the PDF fallback bubble when dragging its handle", () => {
    const bubble = createBubble();
    const savedPositions = [];
    bubble.getBoundingClientRect = () => ({
      left: 100,
      top: 50,
      right: 260,
      bottom: 130,
      width: 160,
      height: 80,
    });

    showLoading(
      bubble,
      { left: 100, top: 50, right: 100, bottom: 50 },
      {
        movable: true,
        position: { left: 100, top: 50 },
        onPositionChange: (position) => savedPositions.push(position),
      }
    );

    bubble
      .querySelector(".stevens-drag-handle")
      .dispatchEvent(new MouseEvent("mousedown", { bubbles: true, clientX: 120, clientY: 70 }));
    document.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: 200, clientY: 140 }));
    document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));

    expect(bubble.style.position).toBe("fixed");
    expect(bubble.style.left).toBe("180px");
    expect(bubble.style.top).toBe("120px");
    expect(savedPositions).toContainEqual({ left: 180, top: 120 });
  });

  it("should keep moving the PDF fallback bubble after the pointer leaves the handle", () => {
    const bubble = createBubble();
    const savedPositions = [];
    bubble.getBoundingClientRect = () => ({
      left: 100,
      top: 50,
      right: 260,
      bottom: 130,
      width: 160,
      height: 80,
    });

    showLoading(
      bubble,
      { left: 100, top: 50, right: 100, bottom: 50 },
      {
        movable: true,
        position: { left: 100, top: 50 },
        onPositionChange: (position) => savedPositions.push(position),
      }
    );

    const handle = bubble.querySelector(".stevens-drag-handle");
    handle.setPointerCapture = jest.fn();
    handle.releasePointerCapture = jest.fn();
    handle.dispatchEvent(createPointerEvent("pointerdown", { pointerId: 5, clientX: 120, clientY: 70 }));
    handle.dispatchEvent(createPointerEvent("pointermove", { pointerId: 5, clientX: 230, clientY: 160 }));
    handle.dispatchEvent(createPointerEvent("pointerup", { pointerId: 5, clientX: 230, clientY: 160 }));

    expect(handle.setPointerCapture).toHaveBeenCalledWith(5);
    expect(bubble.style.left).toBe("210px");
    expect(bubble.style.top).toBe("140px");
    expect(savedPositions).toContainEqual({ left: 210, top: 140 });
  });
});

describe("showResult", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    mockSpeak.mockClear();
  });

  it("should pronounce selected text using detected language when source language is auto", () => {
    const bubble = createBubble();

    showResult(bubble, { translation: "Hola", detectedLang: "EN", targetLang: "ES", sourceLang: "auto" }, "Hello");
    bubble.querySelector(".stevens-speak-btn").click();

    expect(mockSpeak).toHaveBeenCalledWith("Hello", "en-US");
  });

  it("should pronounce selected text using configured source language when it is specific", () => {
    const bubble = createBubble();

    showResult(bubble, { translation: "Hello", detectedLang: "NL", targetLang: "EN", sourceLang: "DE" }, "Hallo");
    bubble.querySelector(".stevens-speak-btn").click();

    expect(mockSpeak).toHaveBeenCalledWith("Hallo", "de-DE");
  });

  it("should keep the drag handle when the movable PDF fallback bubble shows a result", () => {
    const bubble = createBubble();

    showResult(
      bubble,
      { translation: "nice to meet you", detectedLang: "PT", targetLang: "EN", sourceLang: "auto" },
      "muito prazer",
      { movable: true }
    );

    expect(bubble.querySelector(".stevens-drag-handle")).not.toBeNull();
  });

  it("should clamp the movable PDF fallback bubble when a result is rendered", () => {
    const bubble = createBubble();
    bubble.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      right: 200,
      bottom: 100,
      width: 200,
      height: 100,
    });

    showResult(
      bubble,
      { translation: "nice to meet you", detectedLang: "PT", targetLang: "EN", sourceLang: "auto" },
      "muito prazer",
      { movable: true, position: { left: 900, top: 700 } }
    );

    expect(bubble.style.position).toBe("fixed");
    expect(bubble.style.left).toBe("816px");
    expect(bubble.style.top).toBe("660px");
  });
});

describe("showError", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("should keep the drag handle when the movable PDF fallback bubble shows an error", () => {
    const bubble = createBubble();

    showError(bubble, "Unexpected error.", { movable: true });

    expect(bubble.querySelector(".stevens-drag-handle")).not.toBeNull();
  });
});

function createPointerEvent(type, { pointerId, clientX, clientY }) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperties(event, {
    pointerId: { value: pointerId },
    clientX: { value: clientX },
    clientY: { value: clientY },
  });
  return event;
}
