import { MessageType } from "../messages/types.js";
import { getTranslationLanguages, LanguageServiceError } from "./language-service.js";
import { translate, TranslationServiceError } from "./translation-service.js";

export function registerRuntimeMessages({
  runtime = globalThis.chrome?.runtime,
  translateText = translate,
  loadLanguages = getTranslationLanguages,
} = {}) {
  runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === MessageType.TRANSLATE) {
      translateText(message.payload.text)
        .then((result) => {
          sendResponse({ type: MessageType.TRANSLATE_RESULT, payload: result });
        })
        .catch((err) => {
          sendResponse({
            type: MessageType.TRANSLATE_ERROR,
            payload: { message: err instanceof TranslationServiceError ? err.message : "Unexpected error." },
          });
        });

      return true;
    }

    if (message.type === MessageType.GET_LANGUAGE_OPTIONS) {
      loadLanguages(message.payload?.apiKey)
        .then((languages) => {
          sendResponse({ type: MessageType.LANGUAGE_OPTIONS_RESULT, payload: languages });
        })
        .catch((err) => {
          sendResponse({
            type: MessageType.LANGUAGE_OPTIONS_ERROR,
            payload: { message: err instanceof LanguageServiceError ? err.message : "Unexpected error." },
          });
        });

      return true;
    }

    return false;
  });
}
