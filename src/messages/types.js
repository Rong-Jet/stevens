export const MessageType = Object.freeze({
  TRANSLATE: "TRANSLATE",
  TRANSLATE_RESULT: "TRANSLATE_RESULT",
  TRANSLATE_ERROR: "TRANSLATE_ERROR",
});

/**
 * @typedef {{ type: "TRANSLATE", payload: { text: string } }} TranslateMessage
 * @typedef {{ type: "TRANSLATE_RESULT", payload: { translation: string, detectedLang: string, targetLang: string, sourceLang: string } }} TranslateResultMessage
 * @typedef {{ type: "TRANSLATE_ERROR", payload: { message: string } }} TranslateErrorMessage
 */
