/**
 * Returns the trimmed selected text and the bounding rect of the selection,
 * or null if nothing meaningful is selected.
 * @returns {{ text: string, rect: DOMRect } | null}
 */
export function getSelection() {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null;

  const text = sel.toString().trim();
  if (text.length === 0) return null;

  const rect = sel.getRangeAt(0).getBoundingClientRect();
  return { text, rect };
}
