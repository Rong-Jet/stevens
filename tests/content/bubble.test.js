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

const { createBubble, showResult } = await import("../../src/content/components/bubble.js");

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
});
