import { describe, it, expect, jest } from "@jest/globals";
import { MessageType } from "../../src/messages/types.js";
import { registerRuntimeMessages } from "../../src/background/runtime-messages.js";

function createRuntime() {
  return {
    onMessage: {
      addListener: jest.fn(),
    },
  };
}

describe("registerRuntimeMessages", () => {
  it("should return translation results from the background worker", async () => {
    const runtime = createRuntime();
    const translateText = jest.fn(() =>
      Promise.resolve({ translation: "Olá", detectedLang: "EN", sourceLang: "auto", targetLang: "pt-BR" })
    );
    const sendResponse = jest.fn();

    registerRuntimeMessages({ runtime, translateText });
    const listener = runtime.onMessage.addListener.mock.calls[0][0];

    const keepOpen = listener({ type: MessageType.TRANSLATE, payload: { text: "Hello" } }, {}, sendResponse);
    await Promise.resolve();

    expect(keepOpen).toBe(true);
    expect(translateText).toHaveBeenCalledWith("Hello");
    expect(sendResponse).toHaveBeenCalledWith({
      type: MessageType.TRANSLATE_RESULT,
      payload: { translation: "Olá", detectedLang: "EN", sourceLang: "auto", targetLang: "pt-BR" },
    });
  });

  it("should return DeepL language options from the background worker", async () => {
    const runtime = createRuntime();
    const loadLanguages = jest.fn(() =>
      Promise.resolve({
        sourceLanguages: [{ language: "en", name: "English" }],
        targetLanguages: [{ language: "pt-BR", name: "Portuguese (Brazilian)" }],
      })
    );
    const sendResponse = jest.fn();

    registerRuntimeMessages({ runtime, loadLanguages });
    const listener = runtime.onMessage.addListener.mock.calls[0][0];

    const keepOpen = listener(
      { type: MessageType.GET_LANGUAGE_OPTIONS, payload: { apiKey: "typed-key:fx" } },
      {},
      sendResponse
    );
    await Promise.resolve();

    expect(keepOpen).toBe(true);
    expect(loadLanguages).toHaveBeenCalledWith("typed-key:fx");
    expect(sendResponse).toHaveBeenCalledWith({
      type: MessageType.LANGUAGE_OPTIONS_RESULT,
      payload: {
        sourceLanguages: [{ language: "en", name: "English" }],
        targetLanguages: [{ language: "pt-BR", name: "Portuguese (Brazilian)" }],
      },
    });
  });
});
