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
    en: "en-US",
    DE: "de-DE",
    de: "de-DE",
    FR: "fr-FR",
    fr: "fr-FR",
    ES: "es-ES",
    es: "es-ES",
    IT: "it-IT",
    it: "it-IT",
    JA: "ja-JP",
    ja: "ja-JP",
    ZH: "zh-CN",
    zh: "zh-CN",
    KO: "ko-KR",
    ko: "ko-KR",
    PT: "pt-PT",
    pt: "pt-PT",
    "PT-BR": "pt-BR",
    "pt-BR": "pt-BR",
    "PT-PT": "pt-PT",
    "pt-PT": "pt-PT",
    RU: "ru-RU",
    ru: "ru-RU",
    NL: "nl-NL",
    nl: "nl-NL",
    PL: "pl-PL",
    pl: "pl-PL",
    SV: "sv-SE",
    sv: "sv-SE",
    TR: "tr-TR",
    tr: "tr-TR",
  };
  return map[deeplLang] ?? "en-US";
}
