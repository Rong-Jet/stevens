# Chrome PDF Viewer Selection

## Status

Accepted

## Context

Stevens normally translates selected text by reading the page DOM selection and positioning the bubble at the selection rectangle.

Chrome's built-in PDF viewer does not expose PDF text selection like a normal web page. The content script can initialize on direct PDF URLs, but PDF text selection is handled inside Chrome's viewer/plugin path rather than ordinary DOM text nodes.

## Decision

Stevens supports PDFs through two fallback paths:

1. A PDF-only polling path checks for a stable DOM selection when Chrome exposes one.
2. A right-click context-menu path uses Chrome's `selectionText` fallback when the PDF viewer does not emit usable selection or mouse events.

Context-menu results render at a stable viewport position rather than directly under the highlighted PDF text.

## Technical Limitations

- Chrome PDF viewer selection may not fire `selectionchange`, `mouseup`, or `mousedown` in the content-script document.
- `window.getSelection()` may remain empty even when PDF text is visibly highlighted.
- `chrome.contextMenus` can provide selected text, but it does not provide the selected text rectangle.
- Because Chrome does not expose reliable PDF selection geometry, Stevens cannot reliably place the bubble directly under highlighted PDF text in the built-in PDF viewer.
- Scanned or image-only PDFs remain unsupported unless selectable text is available through the viewer or OCR layer.

## Alternatives Considered

- **Use normal DOM selection only:** Rejected because direct PDF URLs can initialize the content script without delivering selection events or DOM-backed text selection.
- **Poll all pages:** Rejected to avoid unnecessary work on normal websites where browser selection events are reliable.
- **Use Chrome PDF viewer internals:** Rejected because internal viewer/plugin messages are not a stable public extension API and do not solve reliable geometry.
- **Render PDFs with PDF.js:** Deferred because it requires owning the PDF rendering path, permissions, navigation behavior, and text-layer implementation.
- **Place the bubble under highlighted PDF text:** Rejected for Chrome's built-in viewer because selected text geometry is not exposed through supported extension APIs.

## Consequences

- Normal websites keep the usual under-selection bubble behavior.
- PDFs get a best-effort automatic path when DOM selection is exposed.
- PDFs get a reliable user-triggered path through **Translate with Stevens** in the right-click menu.
- Context-menu PDF results are positioned predictably, not under the highlighted text.

## Validation

- `tests/content/selection-translator.test.js` covers PDF-style `selectionchange`, PDF polling, context-menu display, and persistence while polling sees empty selection.
- `tests/background/context-menu.test.js` covers context-menu creation and background-to-content result messaging.
- `tests/manifest.test.js` covers frame injection and the `contextMenus` permission.

## Revisit When

- Chrome exposes stable selection geometry for PDF viewer selections.
- Stevens owns PDF rendering through a PDF.js-based viewer.
- A supported Chrome extension API provides both PDF selected text and its screen rectangle.
