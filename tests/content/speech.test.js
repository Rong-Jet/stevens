import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { speak, toBCP47 } from "../../src/content/utils/speech.js";

describe("toBCP47", () => {
  it("should map known DeepL codes to BCP-47", () => {
    expect(toBCP47("EN")).toBe("en-US");
    expect(toBCP47("DE")).toBe("de-DE");
    expect(toBCP47("de")).toBe("de-DE");
    expect(toBCP47("JA")).toBe("ja-JP");
    expect(toBCP47("ZH")).toBe("zh-CN");
    expect(toBCP47("pt")).toBe("pt-PT");
    expect(toBCP47("PT-BR")).toBe("pt-BR");
    expect(toBCP47("pt-BR")).toBe("pt-BR");
    expect(toBCP47("PT-PT")).toBe("pt-PT");
  });

  it("should fall back to en-US for unknown codes", () => {
    expect(toBCP47("XX")).toBe("en-US");
    expect(toBCP47("")).toBe("en-US");
  });
});

describe("speak", () => {
  let mockSpeak, mockCancel;

  beforeEach(() => {
    mockSpeak = jest.fn();
    mockCancel = jest.fn();
    global.window = {
      speechSynthesis: { speak: mockSpeak, cancel: mockCancel },
      SpeechSynthesisUtterance: class {
        constructor(text) { this.text = text; }
      },
    };
    global.SpeechSynthesisUtterance = global.window.SpeechSynthesisUtterance;
  });

  it("should cancel any ongoing speech before speaking", () => {
    speak("Hello", "en-US");
    expect(mockCancel).toHaveBeenCalledTimes(1);
  });

  it("should call speechSynthesis.speak with an utterance", () => {
    speak("Hello", "en-US");
    expect(mockSpeak).toHaveBeenCalledTimes(1);
    const utterance = mockSpeak.mock.calls[0][0];
    expect(utterance.text).toBe("Hello");
    expect(utterance.lang).toBe("en-US");
  });

  it("should not throw when speechSynthesis is unavailable", () => {
    global.window.speechSynthesis = undefined;
    expect(() => speak("Hello")).not.toThrow();
  });
});
