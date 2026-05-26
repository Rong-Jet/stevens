import { MessageType } from "../messages/types.js";
import { getSelection } from "./utils/selection.js";
import { createBubble, showLoading, showResult, showError, removeBubble } from "./components/bubble.js";

let bubble = null;

document.addEventListener("mouseup", (e) => {
  // Ignore clicks inside our own bubble
  if (e.target.closest("#stevens-bubble")) return;

  const selection = getSelection();
  if (!selection) {
    removeBubble();
    bubble = null;
    return;
  }

  bubble = createBubble();
  showLoading(bubble, selection.rect);

  // Extension was reloaded/updated; this tab's content script is stale.
  if (!chrome.runtime?.id) {
    showError(bubble, "Extension was updated. Please refresh this page.");
    return;
  }

  try {
    chrome.runtime.sendMessage(
      { type: MessageType.TRANSLATE, payload: { text: selection.text } },
      (response) => {
        if (chrome.runtime.lastError) {
          if (bubble) showError(bubble, "Extension was updated. Please refresh this page.");
          return;
        }
        if (!bubble) return;
        if (response?.type === MessageType.TRANSLATE_RESULT) {
          showResult(bubble, response.payload, selection.text);
        } else {
          showError(bubble, response?.payload?.message ?? "Something went wrong.");
        }
      }
    );
  } catch (err) {
    showError(bubble, "Extension was updated. Please refresh this page.");
  }
});

document.addEventListener("mousedown", (e) => {
  if (e.target.closest("#stevens-bubble")) return;
  removeBubble();
  bubble = null;
});
