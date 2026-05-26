/**
 * @jest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { MessageType } from "../../src/messages/types.js";
import { installSelectionTranslator } from "../../src/content/selection-translator.js";

function createBubbleView() {
  return {
    createBubble: jest.fn(() => {
      const el = document.createElement("div");
      el.id = "stevens-bubble";
      document.body.appendChild(el);
      return el;
    }),
    showLoading: jest.fn(),
    showResult: jest.fn(),
    showError: jest.fn(),
    removeBubble: jest.fn(() => {
      document.getElementById("stevens-bubble")?.remove();
    }),
  };
}

describe("installSelectionTranslator", () => {
  let uninstall;

  beforeEach(() => {
    document.body.innerHTML = "";
    window.history.replaceState({}, "", "/");
    uninstall = null;
    jest.useFakeTimers();
  });

  afterEach(() => {
    uninstall?.();
    jest.useRealTimers();
  });

  it("should translate selected text when only selectionchange fires in a PDF-style viewer", () => {
    const selection = {
      text: "muito prazer",
      rect: { left: 20, top: 10, right: 140, bottom: 32 },
    };
    const bubbleView = createBubbleView();
    const sendMessage = jest.fn((message, callback) => {
      callback({
        type: MessageType.TRANSLATE_RESULT,
        payload: {
          translation: "nice to meet you",
          detectedLang: "PT",
          sourceLang: "auto",
          targetLang: "EN",
        },
      });
    });

    uninstall = installSelectionTranslator({
      root: document,
      runtime: { id: "runtime-id", sendMessage },
      selectionReader: () => selection,
      bubbleView,
      selectionChangeDelayMs: 25,
    });

    document.dispatchEvent(new Event("selectionchange"));

    expect(sendMessage).not.toHaveBeenCalled();

    jest.advanceTimersByTime(25);

    expect(bubbleView.showLoading).toHaveBeenCalledWith(expect.any(HTMLElement), selection.rect);
    expect(sendMessage).toHaveBeenCalledWith(
      { type: MessageType.TRANSLATE, payload: { text: "muito prazer" } },
      expect.any(Function)
    );
    expect(bubbleView.showResult).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      {
        translation: "nice to meet you",
        detectedLang: "PT",
        sourceLang: "auto",
        targetLang: "EN",
      },
      "muito prazer"
    );
  });

  it("should keep selection translation off until Stevens is enabled for the tab", () => {
    const selection = {
      text: "muito prazer",
      rect: { left: 20, top: 10, right: 140, bottom: 32 },
    };
    const bubbleView = createBubbleView();
    let messageListener;
    const sendMessage = jest.fn((message, callback) => {
      callback({
        type: MessageType.TRANSLATE_RESULT,
        payload: {
          translation: "nice to meet you",
          detectedLang: "PT",
          sourceLang: "auto",
          targetLang: "EN",
        },
      });
    });
    const runtime = {
      id: "runtime-id",
      sendMessage,
      onMessage: {
        addListener: jest.fn((listener) => {
          messageListener = listener;
        }),
        removeListener: jest.fn(),
      },
    };

    uninstall = installSelectionTranslator({
      root: document,
      runtime,
      selectionReader: () => selection,
      bubbleView,
      enabled: false,
    });

    document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));

    expect(sendMessage).not.toHaveBeenCalled();

    const sendResponse = jest.fn();
    messageListener({ type: MessageType.SET_STEVENS_ENABLED, payload: { enabled: true } }, null, sendResponse);
    document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));

    expect(sendResponse).toHaveBeenCalledWith({
      type: MessageType.STEVENS_STATE_RESULT,
      payload: { enabled: true },
    });
    expect(sendMessage).toHaveBeenCalledWith(
      { type: MessageType.TRANSLATE, payload: { text: "muito prazer" } },
      expect.any(Function)
    );
    expect(bubbleView.showResult).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ translation: "nice to meet you" }),
      "muito prazer"
    );
  });

  it("should expose a tab-local enable toggle for the invite toast", () => {
    const selection = {
      text: "muito prazer",
      rect: { left: 20, top: 10, right: 140, bottom: 32 },
    };
    const sendMessage = jest.fn((message, callback) => {
      callback({
        type: MessageType.TRANSLATE_RESULT,
        payload: {
          translation: "nice to meet you",
          detectedLang: "PT",
          sourceLang: "auto",
          targetLang: "EN",
        },
      });
    });

    uninstall = installSelectionTranslator({
      root: document,
      runtime: { id: "runtime-id", sendMessage },
      selectionReader: () => selection,
      bubbleView: createBubbleView(),
      enabled: false,
    });

    expect(uninstall.isEnabled()).toBe(false);
    uninstall.setEnabled(true);
    document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));

    expect(uninstall.isEnabled()).toBe(true);
    expect(sendMessage).toHaveBeenCalledWith(
      { type: MessageType.TRANSLATE, payload: { text: "muito prazer" } },
      expect.any(Function)
    );
  });

  it("should poll for stable selections when a PDF viewer does not emit selection events", () => {
    window.history.replaceState({}, "", "/pluginfile.php/material.pdf");
    const selection = {
      text: "preposicoes em de",
      rect: { left: 30, top: 12, right: 180, bottom: 36 },
    };
    const bubbleView = createBubbleView();
    const sendMessage = jest.fn((message, callback) => {
      callback({
        type: MessageType.TRANSLATE_RESULT,
        payload: {
          translation: "prepositions in from",
          detectedLang: "PT",
          sourceLang: "auto",
          targetLang: "EN",
        },
      });
    });
    const selectionReader = jest
      .fn()
      .mockReturnValueOnce(null)
      .mockReturnValueOnce(selection)
      .mockReturnValueOnce(selection);

    uninstall = installSelectionTranslator({
      root: document,
      runtime: { id: "runtime-id", sendMessage },
      selectionReader,
      bubbleView,
      pdfSelectionPollIntervalMs: 25,
      pdfSelectionStablePolls: 2,
    });

    jest.advanceTimersByTime(25);

    expect(sendMessage).not.toHaveBeenCalled();

    jest.advanceTimersByTime(25);

    expect(sendMessage).not.toHaveBeenCalled();

    jest.advanceTimersByTime(25);

    expect(sendMessage).toHaveBeenCalledWith(
      { type: MessageType.TRANSLATE, payload: { text: "preposicoes em de" } },
      expect.any(Function)
    );
    expect(bubbleView.showResult).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ translation: "prepositions in from" }),
      "preposicoes em de"
    );
  });

  it("should start PDF selection polling only after Stevens is enabled for the tab", () => {
    window.history.replaceState({}, "", "/pluginfile.php/material.pdf");
    const selection = {
      text: "preposicoes em de",
      rect: { left: 30, top: 12, right: 180, bottom: 36 },
    };
    const sendMessage = jest.fn((message, callback) => {
      callback({
        type: MessageType.TRANSLATE_RESULT,
        payload: {
          translation: "prepositions in from",
          detectedLang: "PT",
          sourceLang: "auto",
          targetLang: "EN",
        },
      });
    });
    const selectionReader = jest.fn(() => selection);

    uninstall = installSelectionTranslator({
      root: document,
      runtime: { id: "runtime-id", sendMessage },
      selectionReader,
      bubbleView: createBubbleView(),
      enabled: false,
      pdfSelectionPollIntervalMs: 25,
      pdfSelectionStablePolls: 2,
    });

    jest.advanceTimersByTime(75);

    expect(selectionReader).not.toHaveBeenCalled();
    expect(sendMessage).not.toHaveBeenCalled();

    uninstall.setEnabled(true);
    jest.advanceTimersByTime(50);

    expect(sendMessage).toHaveBeenCalledWith(
      { type: MessageType.TRANSLATE, payload: { text: "preposicoes em de" } },
      expect.any(Function)
    );
  });

  it("should display context-menu translation results from the background worker", () => {
    const bubbleView = createBubbleView();
    let messageListener;
    const runtime = {
      id: "runtime-id",
      sendMessage: jest.fn(),
      onMessage: {
        addListener: jest.fn((listener) => {
          messageListener = listener;
        }),
        removeListener: jest.fn(),
      },
    };

    uninstall = installSelectionTranslator({
      root: document,
      runtime,
      selectionReader: () => null,
      bubbleView,
    });

    messageListener({
      type: MessageType.DISPLAY_TRANSLATION_RESULT,
      payload: {
        originalText: "muito prazer",
        result: {
          translation: "nice to meet you",
          detectedLang: "PT",
          sourceLang: "auto",
          targetLang: "EN",
        },
      },
    });

    expect(bubbleView.showLoading).toHaveBeenCalledWith(expect.any(HTMLElement), expect.objectContaining({ top: 24 }));
    expect(bubbleView.showLoading.mock.calls[0]).toHaveLength(2);
    expect(bubbleView.showResult).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      {
        translation: "nice to meet you",
        detectedLang: "PT",
        sourceLang: "auto",
        targetLang: "EN",
      },
      "muito prazer"
    );
    expect(bubbleView.showResult.mock.calls[0]).toHaveLength(3);
  });

  it("should make context-menu translation results movable in PDF fallback mode", () => {
    window.history.replaceState({}, "", "/pluginfile.php/material.pdf");
    const bubbleView = createBubbleView();
    let messageListener;
    const runtime = {
      id: "runtime-id",
      sendMessage: jest.fn(),
      onMessage: {
        addListener: jest.fn((listener) => {
          messageListener = listener;
        }),
        removeListener: jest.fn(),
      },
    };

    uninstall = installSelectionTranslator({
      root: document,
      runtime,
      selectionReader: () => null,
      bubbleView,
    });

    messageListener({
      type: MessageType.DISPLAY_TRANSLATION_RESULT,
      payload: {
        originalText: "muito prazer",
        result: {
          translation: "nice to meet you",
          detectedLang: "PT",
          sourceLang: "auto",
          targetLang: "EN",
        },
      },
    });

    expect(bubbleView.showLoading).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ top: 68 }),
      expect.objectContaining({
        movable: true,
        position: expect.objectContaining({ top: 68 }),
        onPositionChange: expect.any(Function),
      })
    );
    expect(bubbleView.showResult).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ translation: "nice to meet you" }),
      "muito prazer",
      expect.objectContaining({ movable: true })
    );
  });

  it("should reuse the moved PDF fallback bubble position for later context-menu results", () => {
    window.history.replaceState({}, "", "/pluginfile.php/material.pdf");
    const bubbleView = createBubbleView();
    let messageListener;
    const runtime = {
      id: "runtime-id",
      sendMessage: jest.fn(),
      onMessage: {
        addListener: jest.fn((listener) => {
          messageListener = listener;
        }),
        removeListener: jest.fn(),
      },
    };

    uninstall = installSelectionTranslator({
      root: document,
      runtime,
      selectionReader: () => null,
      bubbleView,
    });

    messageListener({
      type: MessageType.DISPLAY_TRANSLATION_RESULT,
      payload: {
        originalText: "muito prazer",
        result: {
          translation: "nice to meet you",
          detectedLang: "PT",
          sourceLang: "auto",
          targetLang: "EN",
        },
      },
    });
    bubbleView.showLoading.mock.calls[0][2].onPositionChange({ left: 120, top: 80 });

    messageListener({
      type: MessageType.DISPLAY_TRANSLATION_RESULT,
      payload: {
        originalText: "bom dia",
        result: {
          translation: "good morning",
          detectedLang: "PT",
          sourceLang: "auto",
          targetLang: "EN",
        },
      },
    });

    expect(bubbleView.showLoading.mock.calls[1][2]).toEqual(
      expect.objectContaining({
        movable: true,
        position: { left: 120, top: 80 },
      })
    );
  });

  it("should make context-menu translation errors movable in PDF fallback mode", () => {
    window.history.replaceState({}, "", "/pluginfile.php/material.pdf");
    const bubbleView = createBubbleView();
    let messageListener;
    const runtime = {
      id: "runtime-id",
      sendMessage: jest.fn(),
      onMessage: {
        addListener: jest.fn((listener) => {
          messageListener = listener;
        }),
        removeListener: jest.fn(),
      },
    };

    uninstall = installSelectionTranslator({
      root: document,
      runtime,
      selectionReader: () => null,
      bubbleView,
    });

    messageListener({
      type: MessageType.DISPLAY_TRANSLATION_ERROR,
      payload: { message: "Unexpected error." },
    });

    expect(bubbleView.showLoading).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ top: 68 }),
      expect.objectContaining({ movable: true })
    );
    expect(bubbleView.showError).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      "Unexpected error.",
      expect.objectContaining({ movable: true })
    );
  });

  it("should keep context-menu results visible while PDF polling continues to see no selection", () => {
    window.history.replaceState({}, "", "/pluginfile.php/material.pdf");
    const bubbleView = createBubbleView();
    let messageListener;
    const runtime = {
      id: "runtime-id",
      sendMessage: jest.fn(),
      onMessage: {
        addListener: jest.fn((listener) => {
          messageListener = listener;
        }),
        removeListener: jest.fn(),
      },
    };

    uninstall = installSelectionTranslator({
      root: document,
      runtime,
      selectionReader: () => null,
      bubbleView,
      pdfSelectionPollIntervalMs: 25,
    });

    messageListener({
      type: MessageType.DISPLAY_TRANSLATION_RESULT,
      payload: {
        originalText: "muito prazer",
        result: {
          translation: "nice to meet you",
          detectedLang: "PT",
          sourceLang: "auto",
          targetLang: "EN",
        },
      },
    });

    jest.advanceTimersByTime(75);

    expect(bubbleView.showResult).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ translation: "nice to meet you" }),
      "muito prazer",
      expect.objectContaining({ movable: true })
    );
    expect(bubbleView.removeBubble).not.toHaveBeenCalled();
  });
});
