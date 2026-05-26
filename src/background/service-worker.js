import { MessageType } from "../messages/types.js";
import { translate, TranslationServiceError } from "./translation-service.js";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== MessageType.TRANSLATE) return false;

  translate(message.payload.text)
    .then((result) => {
      sendResponse({ type: MessageType.TRANSLATE_RESULT, payload: result });
    })
    .catch((err) => {
      sendResponse({
        type: MessageType.TRANSLATE_ERROR,
        payload: { message: err instanceof TranslationServiceError ? err.message : "Unexpected error." },
      });
    });

  return true; // keep message channel open for async response
});
