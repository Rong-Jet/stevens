# DeepL Language Discovery

## Status

Accepted

## Context

Stevens needs source and target language dropdowns that include regional variants such as Brazilian Portuguese without maintaining a stale hardcoded allowlist.

DeepL's legacy `/v2/languages` endpoint is deprecated for language discovery. The current language discovery API is `GET /v3/languages?resource=translate_text`, which returns BCP 47 language codes and flags indicating whether each language is usable as a source, a target, or both.

## Decision

The background worker loads translation languages from DeepL v3 and maps them into separate source and target option lists. The popup and options page request those lists through extension messages so content and settings UI do not call DeepL directly.

Saved legacy uppercase codes are normalized to DeepL v3 option values where possible. Translation requests pass the selected language code through to DeepL.

## Technical Limitations

- DeepL owns the available source and target language list; Stevens cannot expose variants that DeepL does not return for `translate_text`.
- Some languages are source-only or target-only. Regional variants such as `pt-BR` may be target-only, so source speech may fall back to the generic source language unless the selected or detected source is more specific.
- Browser audio uses the Web Speech API, not DeepL voice. Voice availability, accent quality, and regional pronunciation depend on installed browser or OS voices.
- The language list requires a valid DeepL API key and network access. If loading fails, Stevens keeps the existing static HTML fallback options and shows a settings error.

## Alternatives Considered

- **Maintain a local language list:** Rejected because regional variants and new DeepL languages would drift over time.
- **Use `/v2/languages`:** Rejected because it is deprecated and returns older casing conventions.
- **Call DeepL from UI code:** Rejected because Stevens keeps external API communication and key handling in the background layer.

## Consequences

- New DeepL language additions become available without code changes.
- Settings need an API key before they can show the authoritative dropdown options.
- Tests must use v3 BCP 47 casing such as `pt-BR` and `en-US`.

## Validation

- `tests/background/api.test.js` covers the DeepL v3 language request and source/target mapping.
- `tests/background/language-service.test.js` covers API-key validation and service-level error mapping.
- `tests/background/runtime-messages.test.js` covers language-list messaging through the background worker.
- `tests/settings/language-options.test.js`, `tests/settings/wizard.test.js`, and `tests/settings/options-controller.test.js` cover dropdown population and legacy-code normalization.

## Revisit When

- DeepL changes the `v3/languages` response contract.
- Stevens adds DeepL voice output instead of relying on browser Web Speech.
- Language lists need caching to reduce repeated settings-page API calls.
