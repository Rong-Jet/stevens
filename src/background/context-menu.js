import { MessageType } from "../messages/types.js";
import { translate, TranslationServiceError } from "./translation-service.js";

const TRANSLATE_SELECTION_MENU_ID = "stevens-translate-selection";

export function registerContextMenu({
  runtime = globalThis.chrome?.runtime,
  contextMenus = globalThis.chrome?.contextMenus,
  tabs = globalThis.chrome?.tabs,
  translator = translate,
  getTabState = (tabId) => sendTabMessage(tabs, tabId, { type: MessageType.GET_STEVENS_STATE }),
  requestInvite = (tabId) => sendTabMessage(tabs, tabId, { type: MessageType.SHOW_STEVENS_INVITE }),
} = {}) {
  if (!runtime?.onInstalled || !contextMenus?.create || !contextMenus?.onClicked || !tabs?.sendMessage) {
    return;
  }

  runtime.onInstalled.addListener(() => {
    contextMenus.create({
      id: TRANSLATE_SELECTION_MENU_ID,
      title: "Translate with Stevens",
      contexts: ["selection"],
    });
  });

  contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId !== TRANSLATE_SELECTION_MENU_ID) return;
    if (!tab?.id || !info.selectionText?.trim()) return;

    const state = await getTabState(tab.id);
    if (!state?.enabled) {
      await requestInvite(tab.id);
      return;
    }

    try {
      const result = await translator(info.selectionText);
      tabs.sendMessage(tab.id, {
        type: MessageType.DISPLAY_TRANSLATION_RESULT,
        payload: {
          originalText: info.selectionText.trim(),
          result,
        },
      });
    } catch (err) {
      tabs.sendMessage(tab.id, {
        type: MessageType.DISPLAY_TRANSLATION_ERROR,
        payload: {
          message: err instanceof TranslationServiceError ? err.message : "Unexpected error.",
        },
      });
    }
  });
}

function sendTabMessage(tabs, tabId, message) {
  return new Promise((resolve) => {
    tabs.sendMessage(tabId, message, (response) => {
      resolve(response?.payload ?? null);
    });
  });
}
