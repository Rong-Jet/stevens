# Stevens

Stevens is a Chrome Manifest V3 extension for translating selected text with DeepL and pronouncing the original selected text with the browser Web Speech API.

Highlight text on any page, and Stevens shows a small translation bubble. The speaker button pronounces the selected source text. Source language can be auto-detected or set explicitly.

## Features

- Translate highlighted text through DeepL Free or Pro.
- Configure DeepL API key, source language, and target language from DeepL's supported language list.
- Source language supports auto-detect or a specific language.
- Pronounce the original highlighted text from the translation bubble.
- Translate selected text from Chrome's PDF viewer through the right-click context menu when PDF selection events are not exposed to the page.
- Toolbar popup wizard for quick setup.
- Full options page for settings.

## Requirements

- Node.js
- npm
- Chrome or another Chromium browser with unpacked extension support
- DeepL API key

## Setup

Install dependencies:

```sh
npm install
```

Build the extension bundles:

```sh
npm run build
```

This creates the bundled scripts in `dist/`. The `dist/` directory is generated and ignored by Git, so build locally before loading the extension.

## Local Environment File

`.env` is optional and intended for local developer convenience. The Chrome extension cannot write files into this repo or execute shell scripts from the popup because extension pages run inside Chrome's browser sandbox.

Only the DeepL API key belongs in `.env`. Source and target languages are browser-side settings managed by the popup wizard or options page.

To create `.env` manually, copy the example:

```sh
cp .env.example .env
```

Then edit `.env`:

```text
DEEPL_API_KEY=your-key-here
```

To create `.env` from `.env.example` with the setup script:

```sh
npm run env:setup
```

Or pass values non-interactively:

```sh
npm run env:setup -- --api-key=your-key-here
```

The shell wrapper is also available:

```sh
sh scripts/create-env.sh --api-key=your-key-here
```

The extension reads `.env` at build time. After creating or editing `.env`, run `npm run build`, reload Stevens in `chrome://extensions`, and refresh the page you are testing.

When `DEEPL_API_KEY` is present in `.env` at build time, the popup wizard skips the API key step and only asks for language settings. Without an env key, the wizard asks for an API key and stores it in `chrome.storage.local`. If a browser-stored key already exists, the key field is populated so it can be reviewed or replaced.

## Load In Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this repo folder.
5. Pin the Stevens extension from the Chrome toolbar.
6. Click the Stevens toolbar icon and complete the setup wizard.

## Usage

1. Open any webpage.
2. Highlight text.
3. Wait for the Stevens bubble to appear.
4. Read the translation in the bubble.
5. Click the speaker button to pronounce the original highlighted text.

For PDFs opened in Chrome's built-in PDF viewer, normal page selection events may not fire because the viewer owns PDF text selection outside the page DOM. If the bubble does not appear automatically, select text in the PDF, right-click, and choose **Translate with Stevens**.

If you change extension code while Chrome has it loaded, run the build again, reload the extension in `chrome://extensions`, and refresh the page you are testing.

## Development

Run a one-off build:

```sh
npm run build
```

Run esbuild in watch mode:

```sh
npm run watch
```

Run tests with coverage:

```sh
npm test
```

Run tests in watch mode:

```sh
npm run test:watch
```

## Project Structure

```text
scripts/          Local development helper scripts
src/background/   Background service worker, DeepL API layer, settings storage
src/content/      Content script, selection handling, translation bubble UI
src/messages/     Message type constants and payload typedefs
src/options/      Full settings page
src/popup/        Toolbar popup settings wizard
src/settings/     Shared settings wizard behavior
tests/            Jest tests
build.js          esbuild configuration
manifest.json     Chrome extension manifest
```

## Architecture Notes

Background code follows a layered structure:

- `src/background/api.js` handles external DeepL HTTP calls.
- `src/background/language-service.js` loads source and target language options from DeepL.
- `src/background/translation-service.js` owns validation, orchestration, and error mapping.
- `src/background/storage.js` owns `chrome.storage.local` access.

Content scripts are UI-only:

- `src/content/index.js` handles selection events and extension messaging.
- `src/content/components/bubble.js` renders the translation bubble.
- `src/content/utils/selection.js` and `src/content/utils/speech.js` are pure browser helpers.

## Settings

Settings are stored in `chrome.storage.local`:

- `apiKey`: DeepL API key, only when no local `.env` key was injected at build time.
- `sourceLang`: source language for translation and speech, or `auto`.
- `targetLang`: DeepL target language. Language options are loaded from DeepL `/v3/languages?resource=translate_text`, so regional variants such as `pt-BR` are available when DeepL exposes them as targets.

DeepL Free API keys ending in `:fx` use `https://api-free.deepl.com`; other keys use `https://api.deepl.com`.

Local `.env` files use this variable:

- `DEEPL_API_KEY`

## Git Hygiene

Generated and local-only files are ignored:

- `node_modules/`
- `dist/`
- `coverage/`
- `.env*`
- local editor/tool state
