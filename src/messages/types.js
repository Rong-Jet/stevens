export const MessageType = Object.freeze({
  TRANSLATE: "TRANSLATE",
  TRANSLATE_RESULT: "TRANSLATE_RESULT",
  TRANSLATE_ERROR: "TRANSLATE_ERROR",
  GET_LANGUAGE_OPTIONS: "GET_LANGUAGE_OPTIONS",
  LANGUAGE_OPTIONS_RESULT: "LANGUAGE_OPTIONS_RESULT",
  LANGUAGE_OPTIONS_ERROR: "LANGUAGE_OPTIONS_ERROR",
  DISPLAY_TRANSLATION_RESULT: "DISPLAY_TRANSLATION_RESULT",
  DISPLAY_TRANSLATION_ERROR: "DISPLAY_TRANSLATION_ERROR",
  GET_STEVENS_STATE: "GET_STEVENS_STATE",
  SET_STEVENS_ENABLED: "SET_STEVENS_ENABLED",
  STEVENS_STATE_RESULT: "STEVENS_STATE_RESULT",
  SHOW_STEVENS_INVITE: "SHOW_STEVENS_INVITE",
});

/**
 * @typedef {{ type: "TRANSLATE", payload: { text: string } }} TranslateMessage
 * @typedef {{ type: "TRANSLATE_RESULT", payload: { translation: string, detectedLang: string, targetLang: string, sourceLang: string } }} TranslateResultMessage
 * @typedef {{ type: "TRANSLATE_ERROR", payload: { message: string } }} TranslateErrorMessage
 * @typedef {{ type: "GET_LANGUAGE_OPTIONS", payload?: { apiKey?: string } }} GetLanguageOptionsMessage
 * @typedef {{ type: "LANGUAGE_OPTIONS_RESULT", payload: { sourceLanguages: Array<{ language: string, name: string }>, targetLanguages: Array<{ language: string, name: string }> } }} LanguageOptionsResultMessage
 * @typedef {{ type: "LANGUAGE_OPTIONS_ERROR", payload: { message: string } }} LanguageOptionsErrorMessage
 * @typedef {{ type: "DISPLAY_TRANSLATION_RESULT", payload: { originalText: string, result: { translation: string, detectedLang: string, targetLang: string, sourceLang: string } } }} DisplayTranslationResultMessage
 * @typedef {{ type: "DISPLAY_TRANSLATION_ERROR", payload: { message: string } }} DisplayTranslationErrorMessage
 * @typedef {{ type: "GET_STEVENS_STATE" }} GetStevensStateMessage
 * @typedef {{ type: "SET_STEVENS_ENABLED", payload: { enabled: boolean } }} SetStevensEnabledMessage
 * @typedef {{ type: "STEVENS_STATE_RESULT", payload: { enabled: boolean } }} StevensStateResultMessage
 * @typedef {{ type: "SHOW_STEVENS_INVITE" }} ShowStevensInviteMessage
 */
