# Stevens Docs

This directory captures implementation-driving decisions: technical limitations, design choices, rejected alternatives, and operational notes that should shape future changes.

## Standard

Use `docs/templates/implementation-decision.md` for every decision or limitation document.

Keep each document complete and concise:

- **Complete** means the reader can understand the constraint, current behavior, trade-offs, and what would change the decision.
- **Concise** means no implementation transcript, no speculative history, and no duplicate README content.

## When To Add A Document

Add or update a document when a change is driven by:

- Browser or platform limitations.
- Security or extension-boundary constraints.
- Non-obvious architecture choices.
- Rejected alternatives that future contributors may reasonably try again.
- Investigation findings that explain current behavior.

## Index

- `decisions/pdf-viewer-selection.md`: Chrome PDF viewer selection limitations and the Stevens fallback design.
- `decisions/tab-local-activation.md`: Off-by-default per-tab activation, invite toast, and popup toggle behavior.
- `decisions/deepl-language-discovery.md`: DeepL v3 language discovery, regional variants, and source-audio limitations.
