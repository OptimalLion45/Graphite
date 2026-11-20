(() => {
const MONACO_VERSION = "0.52.2";
const MONACO_BASE = `https://cdn.jsdelivr.net/npm/monaco-editor@${MONACO_VERSION}/min`;
const THEME = "graphite";
const FONT_FAMILY = "\"Geist Mono\", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
const LINE_HEIGHT = 21;
const LOAD_TIMEOUT = 20000;
const FONT_TIMEOUT = 1500;


let loading = null;
let themed = false;


function workerUrl() {
const source = `self.MonacoEnvironment = { baseUrl: "${MONACO_BASE}/" }; importScripts("${MONACO_BASE}/vs/base/worker/workerMain.js");`;
return `data:text/javascript;charset=utf-8,${encodeURIComponent(source)}`;
}


function loadMonaco() {
if (loading) return loading;
loading = new Promise((resolve, reject) => {
if (window.monaco?.editor) {
resolve(window.monaco);
return;
}
const timer = window.setTimeout(() => reject(new Error("timeout")), LOAD_TIMEOUT);
const settle = (done, value) => {
window.clearTimeout(timer);
done(value);
};
window.MonacoEnvironment = { getWorkerUrl: workerUrl };
const script = document.createElement("script");
script.src = `${MONACO_BASE}/vs/loader.js`;
script.async = true;
script.addEventListener("error", () => settle(reject, new Error("network")), { once: true });
script.addEventListener("load", () => {
const amd = window.require;
if (typeof amd?.config !== "function") {
settle(reject, new Error("loader"));
return;
}
amd.config({ paths: { vs: `${MONACO_BASE}/vs` } });
amd(["vs/editor/editor.main"], () => settle(resolve, window.monaco), error => settle(reject, error));
}, { once: true });
document.head.append(script);
});
return loading;
}


function waitForFont() {
if (!document.fonts?.load) return Promise.resolve();
const timeout = new Promise(resolve => window.setTimeout(resolve, FONT_TIMEOUT));
return Promise.race([document.fonts.load(`13px ${FONT_FAMILY}`).catch(() => null), timeout]);
}


function defineTheme(monaco) {
if (themed) return;
themed = true;
monaco.editor.defineTheme(THEME, {
base: "vs",
inherit: false,
rules: [
{ token: "", foreground: "2a3644" },
{ token: "comment", foreground: "97a3b3", fontStyle: "italic" },
{ token: "metatag", foreground: "97a3b3" },
{ token: "metatag.content", foreground: "97a3b3" },
{ token: "delimiter", foreground: "8b98a9" },
{ token: "delimiter.bracket", foreground: "5d6c80" },
{ token: "tag", foreground: "2160a6" },
{ token: "attribute.name", foreground: "7056b8" },
{ token: "attribute.value", foreground: "1f7a5a" },
{ token: "attribute.value.number", foreground: "b0620e" },
{ token: "attribute.value.unit", foreground: "b0620e" },
{ token: "attribute.value.hex", foreground: "b0620e" },
{ token: "string", foreground: "1f7a5a" },
{ token: "keyword", foreground: "c2503a" },
{ token: "number", foreground: "b0620e" },
{ token: "type", foreground: "2160a6" },
{ token: "identifier", foreground: "2a3644" },
{ token: "regexp", foreground: "c2503a" },
{ token: "variable", foreground: "2a3644" }
],
colors: {
"editor.background": "#00000000",
"editor.foreground": "#2a3644",
"editorGutter.background": "#eef2f773",
"editorLineNumber.foreground": "#a9b4c2",
"editorLineNumber.activeForeground": "#4a5a6e",
"editor.lineHighlightBackground": "#4e98e20a",
"editor.lineHighlightBorder": "#00000000",
"editor.selectionBackground": "#4e98e230",
"editor.inactiveSelectionBackground": "#4e98e21a",
"editor.selectionHighlightBackground": "#4e98e214",
"editor.selectionHighlightBorder": "#00000000",
"editor.wordHighlightBackground": "#4e98e210",
"editor.wordHighlightBorder": "#00000000",
"editor.wordHighlightStrongBorder": "#00000000",
"editor.findMatchBackground": "#4e98e24d",
"editor.findMatchHighlightBackground": "#4e98e221",
"editor.findMatchBorder": "#00000000",
"editorCursor.foreground": "#3f8ad8",
"editorIndentGuide.background1": "#374b6412",
"editorIndentGuide.activeBackground1": "#374b642b",
"editorBracketMatch.background": "#4e98e21a",
"editorBracketMatch.border": "#00000000",
"editorWhitespace.foreground": "#374b6424",
"editorOverviewRuler.border": "#00000000",
"editorLink.activeForeground": "#2160a6",
"scrollbar.shadow": "#00000000",
"scrollbarSlider.background": "#374b641f",
"scrollbarSlider.hoverBackground": "#374b6438",
"scrollbarSlider.activeBackground": "#374b6452",
"editorWidget.background": "#f7f9fc",
"editorWidget.border": "#dbe2ea",
"editorSuggestWidget.background": "#f7f9fc",
"editorSuggestWidget.border": "#dbe2ea",
"editorSuggestWidget.selectedBackground": "#4e98e21f",
"editorHoverWidget.background": "#f7f9fc",
"editorHoverWidget.border": "#dbe2ea",
"input.background": "#ffffff",
"input.border": "#dbe2ea",
"focusBorder": "#00000000",
"contrastBorder": "#00000000"
}
});
}


function createMonaco(monaco, host, options) {
let silent = false;
const instance = monaco.editor.create(host, {
value: "",
language: "html",
theme: THEME,
ariaLabel: "Site code",
readOnly: Boolean(options.readOnly),
readOnlyMessage: { value: "Graphite is writing this file. Editing unlocks when it finishes." },
automaticLayout: true,
fontFamily: FONT_FAMILY,
fontSize: 13,
lineHeight: LINE_HEIGHT,
fontLigatures: false,
tabSize: 2,
insertSpaces: true,
wordWrap: "on",
wrappingIndent: "indent",
minimap: { enabled: false },
scrollBeyondLastLine: false,
smoothScrolling: true,
mouseWheelScrollSensitivity: 0.9,
cursorBlinking: "smooth",
cursorSmoothCaretAnimation: "on",
cursorWidth: 2,
renderLineHighlight: "line",
renderLineHighlightOnlyWhenFocus: true,
roundedSelection: true,
links: false,
colorDecorators: false,
unicodeHighlight: { ambiguousCharacters: false, invisibleCharacters: false },
occurrencesHighlight: "off",
selectionHighlight: false,
padding: { top: 10, bottom: 24 },
lineNumbersMinChars: 4,
lineDecorationsWidth: 14,
glyphMargin: false,
folding: true,
showFoldingControls: "mouseover",
guides: { indentation: true, bracketPairs: false, highlightActiveIndentation: false },
bracketPairColorization: { enabled: false },
matchBrackets: "near",
overviewRulerLanes: 0,
overviewRulerBorder: false,
hideCursorInOverviewRuler: true,
stickyScroll: { enabled: false },
fixedOverflowWidgets: true,
scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8, useShadows: false, verticalSliderSize: 6, horizontalSliderSize: 6 }
});


instance.onDidChangeModelContent(() => {
if (!silent) options.onChange?.(instance.getValue());
});


return {
kind: "monaco",
getValue() {
return instance.getValue();
},
setValue(text, follow = false) {
const model = instance.getModel();
if (!model) return;
const next = String(text ?? "");
const current = model.getValue();
const changed = next !== current;
if (changed) {
silent = true;
if (follow && current && next.startsWith(current)) {
const end = model.getFullModelRange().getEndPosition();
model.applyEdits([{ range: new monaco.Range(end.lineNumber, end.column, end.lineNumber, end.column), text: next.slice(current.length) }]);
} else {
model.setValue(next);
}
silent = false;
}
if (follow) {
instance.revealLine(model.getLineCount(), monaco.editor.ScrollType.Immediate);
} else if (changed) {
instance.setScrollPosition({ scrollTop: 0, scrollLeft: 0 }, monaco.editor.ScrollType.Immediate);
}
},
revealLine(line) {
const model = instance.getModel();
if (!model) return;
const lineNumber = Math.min(Math.max(Math.round(line), 1), model.getLineCount());
instance.revealLineInCenter(lineNumber, monaco.editor.ScrollType.Smooth);
instance.setSelection(new monaco.Range(lineNumber, 1, lineNumber, model.getLineMaxColumn(lineNumber)));
instance.focus();
},
setReadOnly(flag) {
instance.updateOptions({ readOnly: Boolean(flag) });
},
focus() {
instance.focus();
},
layout() {
instance.layout();
}
};
}


function createPlain(host, options) {
const area = document.createElement("textarea");
area.className = "code-plain";
area.spellcheck = false;
area.wrap = "soft";
area.readOnly = Boolean(options.readOnly);
area.setAttribute("autocomplete", "off");
area.setAttribute("autocapitalize", "off");
area.setAttribute("aria-label", "Site code");
area.addEventListener("input", () => options.onChange?.(area.value));
area.addEventListener("keydown", event => {
if (event.key !== "Tab" || event.shiftKey || event.altKey || event.ctrlKey || event.metaKey || area.readOnly) return;
event.preventDefault();
area.setRangeText(" ", area.selectionStart, area.selectionEnd, "end");
options.onChange?.(area.value);
});
host.append(area);


return {
kind: "plain",
getValue() {
return area.value;
},
setValue(text, follow = false) {
const next = String(text ?? "");
const changed = area.value !== next;
if (changed) area.value = next;
if (follow) {
area.scrollTop = area.scrollHeight;
} else if (changed) {
area.scrollTop = 0;
}
},
revealLine(line) {
const lines = area.value.split("\n");
const index = Math.min(Math.max(Math.round(line), 1), lines.length) - 1;
const start = lines.slice(0, index).reduce((total, text) => total + text.length + 1, 0);
area.focus({ preventScroll: true });
area.setSelectionRange(start, start + lines[index].length);
area.scrollTop = Math.max(0, index * LINE_HEIGHT - area.clientHeight / 2);
},
setReadOnly(flag) {
area.readOnly = Boolean(flag);
},
focus() {
area.focus({ preventScroll: true });
},
layout() {
return;
}
};
}


async function create(host, options = {}) {
try {
const monaco = await loadMonaco();
await waitForFont();
defineTheme(monaco);
const adapter = createMonaco(monaco, host, options);
document.fonts?.ready.then(() => monaco.editor.remeasureFonts());
return adapter;
} catch (error) {
host.replaceChildren();
return createPlain(host, options);
}
}


window.GraphiteEditor = Object.freeze({
create,
preload() {
loadMonaco().catch(() => null);
}
});
})();
