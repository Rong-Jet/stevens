/**
 * Speaks text using the Web Speech API.
 * @param {string} text
 * @param {string} lang  BCP-47 language code, e.g. "en-US", "de-DE"
 */
export function speak(text, lang = "en-US") {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  window.speechSynthesis.speak(utterance);
}

/** Maps DeepL source language codes to BCP-47 for Web Speech. */
export function toBCP47(deeplLang) {
  const map = {
    EN: "en-US",
    DE: "de-DE",
    FR: "fr-FR",
    ES: "es-ES",
    IT: "it-IT",
    JA: "ja-JP",
    ZH: "zh-CN",
    KO: "ko-KR",
    PT: "pt-PT",
    RU: "ru-RU",
    NL: "nl-NL",
    PL: "pl-PL",
    SV: "sv-SE",
    TR: "tr-TR",
  };
  return map[deeplLang] ?? "en-US";
}
