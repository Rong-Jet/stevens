import { describe, it, expect, jest } from "@jest/globals";
import { MessageType } from "../../src/messages/types.js";
import { registerContextMenu } from "../../src/background/context-menu.js";

function createChromeApi() {
  const onInstalled = { addListener: jest.fn() };
  const onClicked = { addListener: jest.fn() };

  return {
    runtime: {
      lastError: null,
      onInstalled,
    },
    contextMenus: {
      create: jest.fn(),
      onClicked,
    },
    tabs: {
      sendMessage: jest.fn(),
    },
  };
}

describe("registerContextMenu", () => {
  it("should create a selection context menu for translating PDF selections", () => {
    const chromeApi = createChromeApi();

    registerContextMenu(chromeApi);
    chromeApi.runtime.onInstalled.addListener.mock.calls[0][0]();

    expect(chromeApi.contextMenus.create).toHaveBeenCalledWith({
      id: "stevens-translate-selection",
      title: "Translate with Stevens",
      contexts: ["selection"],
    });
  });

  it("should translate selected text from the context menu and send it to the content script", async () => {
    const chromeApi = createChromeApi();
    const translator = jest.fn(() =>
      Promise.resolve({
        translation: "nice to meet you",
        detectedLang: "PT",
        sourceLang: "auto",
        targetLang: "EN",
      })
    );

    registerContextMenu({ ...chromeApi, translator });
    const onClicked = chromeApi.contextMenus.onClicked.addListener.mock.calls[0][0];

    await onClicked(
      {
        menuItemId: "stevens-translate-selection",
        selectionText: "muito prazer",
      },
      { id: 123 }
    );

    expect(translator).toHaveBeenCalledWith("muito prazer");
    expect(chromeApi.tabs.sendMessage).toHaveBeenCalledWith(123, {
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
  });
});
