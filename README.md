# Stevens

Stevens is a Chrome Manifest V3 extension for translating selected text with DeepL and pronouncing the original selected text with the browser Web Speech API.

Highlight text on any page, and Stevens shows a small translation bubble. The speaker button pronounces the selected source text. Source language can be auto-detected or set explicitly.

## Features

- Translate highlighted text through DeepL Free or Pro.
- Configure DeepL API key, source language, and target language.
- Source language supports auto-detect or a specific language.
- Pronounce the original highlighted text from the translation bubble.
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
- `src/background/translation-service.js` owns validation, orchestration, and error mapping.
- `src/background/storage.js` owns `chrome.storage.local` access.

Content scripts are UI-only:

- `src/content/index.js` handles selection events and extension messaging.
- `src/content/components/bubble.js` renders the translation bubble.
- `src/content/utils/selection.js` and `src/content/utils/speech.js` are pure browser helpers.

## Settings

Settings are stored in `chrome.storage.local`:

- `apiKey`: DeepL API key.
- `sourceLang`: source language for translation and speech, or `auto`.
- `targetLang`: DeepL target language.

DeepL Free API keys ending in `:fx` use `https://api-free.deepl.com`; other keys use `https://api.deepl.com`.

## Git Hygiene

Generated and local-only files are ignored:

- `node_modules/`
- `dist/`
- `coverage/`
- `.env*`
- local editor/tool state
