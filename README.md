# CodeflingEx

Browser extension for publishing custom HTML layouts to [Codefling](https://codefling.com) file descriptions.

## Why

Codefling file pages run CKEditor 4 on Invision Community. The "About This File" field stores HTML, but the editor's Advanced Content Filter strips anything the toolbar cannot produce, so the styled layouts you see on some product pages are impossible to author through the UI.

Everything else fails too:

| Approach | Result |
|---|---|
| BBCode (`[B]`, `[LIST]`) | rendered as literal text |
| Markdown (`##`, `**`, tables) | rendered as literal text |
| Typing raw HTML | escaped to `&lt;div&gt;` |
| Pasting rendered HTML from a browser | flattened to bare paragraphs |

The only route is to disable the filter and call `setData` directly. This extension does that from a right-click menu instead of by hand in the console.

## Install

1. Clone or download this repository
2. Open `chrome://extensions` (or `brave://extensions`)
3. Enable **Developer mode**
4. **Load unpacked** → select this folder

## Usage

1. Open the edit page of your file on Codefling
2. Right-click anywhere → **CodeflingEx: insert description...**
3. Pick your `.html` file, or drop it on the overlay
4. Press **Save without clicking into the editor**

## Important

**Never reopen a published description in the normal editor.** CKEditor runs the filter on load, so the layout is destroyed the moment the page opens — even if you change nothing and just press Save. Keep your `.html` file as the single source of truth and re-inject it for every change.

Verify the published page in a private window: the server-side sanitizer can behave differently from the client one.

## Writing the HTML

What survives the sanitizer:

- Inline `style` attributes only — a `<style>` block is stripped and the layout collapses
- `<table>` for multi-column layouts instead of flexbox or grid
- `<div>`, `<span>`, `<p>`, `<b>`, `<a>`, inline colors, backgrounds, borders, padding

Feed the extension plain HTML. Files containing a `CKEDITOR.instances` console wrapper are rejected.

## How it works

`chrome.scripting.executeScript` with `world: "MAIN"` — `CKEDITOR` is a page global that content scripts cannot reach from the isolated world. The injected function disables `editor.filter` and calls `setData`.

The file picker lives in an injected overlay rather than opening directly, because a context-menu click does not grant the page user activation and a bare `input.click()` can be silently ignored.
