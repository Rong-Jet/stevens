# Stevens — Project Standards

## Development Philosophy

### Test-Driven Development (TDD)
- **Always write failing tests first**, then implement to make them pass.
- No feature code without a corresponding failing test that justifies it.
- Test naming: `should <do something> when <condition>` — tests are specifications.
- Red → Green → Refactor. Never skip the refactor step.

### Abstraction Levels

**Backend / Service Workers:**
Use a layered architecture with strict boundaries:
```
API Layer        → handles external HTTP calls, maps responses to domain types
Service Layer    → business logic, orchestration, error handling
Storage Layer    → chrome.storage access, serialization
```
No layer may skip another (API layer must not touch storage directly).

**Frontend / Content Scripts:**
Use component + styling separation:
```
components/      → logic + structure (what it does, what it renders)
styles/          → CSS/tokens (how it looks)
utils/           → pure helpers with no DOM side effects
```
Components own their state. Styles never contain logic. Utils never touch the DOM.

### Documentation Standards

- Use `docs/templates/implementation-decision.md` for technical limitations, non-obvious design choices, and rejected alternatives.
- Keep decision docs complete and concise: enough context to guide future implementation, no implementation transcript.
- Update an existing decision doc when a change revises its trade-offs or invalidates an assumption.

---

## Agent Usage Policy (Token Efficiency)

Use the right model for the right job. Do not default to powerful models for simple tasks.

| Task type | Model |
|---|---|
| File reading, doc lookup, web search, grepping | **Haiku** |
| Writing boilerplate, scaffolding, simple edits | **Haiku** |
| Feature implementation, debugging, code review | **Sonnet** |
| Architecture decisions, planning, complex trade-offs | **Opus** |

When spawning subagents, always set `model: "haiku"` for research/exploration agents unless the task requires synthesis or judgment.

---

## Extension-Specific Conventions

- **Content scripts** are UI-only. No business logic, no API calls.
- **Background service worker** owns all API communication and key management.
- **API keys** are stored in `chrome.storage.local` — never hardcoded, never passed to content scripts.
- UI state (bubble open/closed, loading) lives in the content script only.
- Messages between content script ↔ background follow a typed `{ type, payload }` schema.
