# Tab-Local Activation

## Status

Accepted

## Context

Stevens previously translated selected text whenever the content script could read a selection. The new behavior needs Stevens off at the start of each new tab or page load, while still giving users a lightweight way to invite it on for the current page.

## Decision

Stevens activation is tab-local content-script state. Each top-level page load starts disabled, shows a top-center **Invite Stevens?** toast for five seconds, and enables translation only when the toast or popup toggle is used. Clicking the invite toast changes it to a translucent green **Stevens is here.** success state for two seconds.

The popup exposes a **Stevens on this tab** toggle before the API key controls. It sends messages to the active tab and does not persist activation in `chrome.storage.local`.

## Technical Limitations

- Chrome content-script state is reset by tab reloads, navigations, and extension reloads.
- Restricted browser pages such as `chrome://` cannot receive the content script, so the popup toggle is disabled there.
- No site allowlist or auto-activate policy is defined in this decision.

## Alternatives Considered

- **Persist activation per site:** Rejected because new tabs must begin off and auto-activation rules are out of scope.
- **Global on/off setting:** Rejected because it would not match per-tab opt-in behavior.
- **Enable translation from the PDF context menu while off:** Rejected because off should block API calls and show the invite prompt instead.

## Consequences

- Normal selection translation, PDF polling, and PDF context-menu translation are blocked until Stevens is enabled for the tab.
- The background service worker asks the tab to show the invite toast instead of calling DeepL when the PDF context menu is used while disabled.
- The PDF fallback bubble starts lower in PDF mode so it does not collide with the top-center toast.

## Validation

- `tests/content/selection-translator.test.js` covers disabled selection behavior, runtime enable messages, and shifted PDF fallback positioning.
- `tests/content/invite-toast.test.js` covers invite and success toast timing.
- `tests/settings/wizard.test.js` covers the current-tab popup toggle and unavailable-page state.
- `tests/background/context-menu.test.js` covers context-menu gating while disabled.

## Revisit When

- Stevens defines a site allowlist or auto-activation policy.
- Activation should persist across reloads or browser sessions.
