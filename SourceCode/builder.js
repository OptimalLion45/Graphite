(() => {
const body = document.body;
const canvas = document.querySelector(".dot-field");
const ctx = canvas?.getContext("2d");
const regionLabel = document.querySelector(".region-label");
const regionDevice = regionLabel?.querySelector(".region-label__device");
const regionSize = regionLabel?.querySelector(".region-label__size");
const site = document.querySelector(".stage-site");
const hint = document.querySelector(".stage-empty__hint");
const statusText = document.querySelector(".stage-status__text");
const statusMeta = document.querySelector(".stage-status__meta");
const shimmerElements = Array.from(document.querySelectorAll(".shimmer"));
const projectName = document.querySelector(".project__name");
const stateChip = document.querySelector(".project__state");
const stateText = document.querySelector(".project__state-text");
const footer = document.querySelector(".site-footer");
const notice = document.querySelector(".notice");
const noticeText = notice?.querySelector(".notice__text");
const box = document.querySelector(".prompt-box");
const input = document.querySelector(".prompt-box__input");
const placeholder = document.querySelector(".prompt-box__placeholder");
const action = document.querySelector(".prompt-box__action");
const grip = document.querySelector(".dock__grip");
const modelTrigger = document.querySelector(".model-trigger");
const modelName = modelTrigger?.querySelector(".model-trigger__name");
const modelIcon = modelTrigger?.querySelector(".model-trigger__icon");
const modelLevel = modelTrigger?.querySelector(".model-trigger__level");
const modelLevelText = modelTrigger?.querySelector(".model-trigger__level-text") || modelLevel;
const modelMenu = document.querySelector(".model-menu");
const modelOptions = Array.from(modelMenu?.querySelectorAll(".model-option") ?? []);
const thinkingValue = modelMenu?.querySelector(".model-menu__thinking");
const thinkingGlass = modelMenu?.querySelector(".thinking-switch__glass");
const thinkingButtons = Array.from(modelMenu?.querySelectorAll(".thinking-switch__option") ?? []);
const keyInput = modelMenu?.querySelector(".key-field__input");
const keyState = modelMenu?.querySelector(".model-menu__key-state");
const tooltip = document.querySelector(".tooltip");
const tooltipText = tooltip?.querySelector(".tooltip__text") || tooltip;
const homeLink = document.querySelector(".project__home");
const deviceSwitch = document.querySelector(".device-switch");
const switchGlass = deviceSwitch?.querySelector(".device-switch__glass");
const deviceButtons = Array.from(deviceSwitch?.querySelectorAll(".device-switch__option") ?? []);
const soften = document.querySelector(".soften");
const slotEls = Object.fromEntries(Array.from(document.querySelectorAll(".slot")).map(el => [el.dataset.slot, el]));
const floats = Object.fromEntries(Array.from(document.querySelectorAll(".float")).map(el => [el.dataset.float, el]));
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const compactQuery = window.matchMedia("(max-width: 900px)");


if (!box || !input || !action || !site || !floats.project || !floats.dock) return;


class ApiError extends Error {
constructor(status, detail) {
super(detail || `Request failed with status ${status}`);
this.name = "ApiError";
this.status = Number(status) || 0;
}
}


const API_URL = "https://api.kie.ai/gemini-4-hydrogen-openai/v1/chat/completions";
const SLOT_NAMES = ["top-left", "top-center", "top-right", "bottom-left", "bottom-center", "bottom-right"];
const ALLOWED = { project: SLOT_NAMES, device: SLOT_NAMES, dock: ["top-center", "bottom-center"] };
const DEFAULT_LAYOUT = { project: "top-left", device: "top-right", dock: "bottom-center" };
const COMPACT_LAYOUT = { project: "top-left", dock: "bottom-center" };
const LAYOUT_KEY = "graphite:builder-layout";
const HANDOFF_KEY = "graphite:handoff";
const MODEL_KEY = "graphite:model";
const THINKING_KEY = "graphite:thinking";
const API_KEY_KEY = "graphite:api-key";


const THINKING_LEVELS = [
{ id: "low", short: "Low", label: "Low", effort: "low" },
{ id: "med", short: "Med", label: "Medium", effort: "medium" },
{ id: "high", short: "High", label: "High", effort: "high" },
{ id: "xhigh", short: "XHigh", label: "Extra high", effort: "xhigh" }
];


const MODELS = [
{
id: "gemini-4-hydrogen",
name: "Gemini 4 Hydrogen",
icon: "https://img.icons8.com/color/48/gemini-ai.png",
thinking: ["low", "med", "high", "xhigh"],
defaultThinking: "med"
}
];


const SYSTEM_PROMPT = [
"You are Graphite, an expert web designer and front-end engineer.",
"Build a complete, polished, production-quality single-file website from the user's description.",
"Respond with only one HTML document that starts with <!DOCTYPE html> and ends with </html>.",
"Put all CSS in one <style> tag in the head and any JavaScript in one <script> tag before </body>.",
"Do not use markdown, code fences, or explanations.",
"Use semantic HTML, a responsive layout that works from mobile to desktop, accessible contrast, and refined modern typography. Google Fonts are allowed.",
"Every navigation link, tab, filter, modal, and interactive control must work smoothly inside this single HTML file without linking to separate .html files or reloading the page.",
"When the site includes multiple tabs or pages, include all views in the HTML and switch between them smoothly with JavaScript or smooth section scrolling using matching #id anchors, updating active link states cleanly.",
"Handle all form submissions with JavaScript event.preventDefault() and clear in-page feedback.",
"Write realistic, specific copy. For imagery use clean inline SVG, CSS visuals, or https://picsum.photos/seed/... URLs with descriptive alt text.",
"Always include a short, meaningful <title>."
].join(" ");


const EDIT_RULES = "You are now editing an existing website. Apply the requested change and return the full updated HTML document, keeping all interactive tabs, navigation, and unchanged sections intact.";


const PREVIEW_GUARD = [
"<script data-graphite-guard>",
"(() => {",
" if (window.__graphiteGuard) return;",
" window.__graphiteGuard = true;",
" const toSlug = value => String(value || '')",
" .replace(/^#/, '')",
" .replace(/[?].*$/, '')",
" .replace(/[/]+$/, '')",
" .split('/')",
" .pop()",
" .replace(/[.](html?|php|aspx?)$/i, '')",
" .trim()",
" .toLowerCase()",
" .replace(/[^a-z0-9]+/g, '-')",
" .replace(/^-+|-+$/g, '');",
" const queryTarget = value => {",
" const idx = value.indexOf('?');",
" if (idx === -1) return '';",
" const params = new URLSearchParams(value.slice(idx + 1));",
" return params.get('tab') || params.get('page') || params.get('view') || params.get('section') || '';",
" };",
" const isHidden = el => Boolean(el) && (el.hidden || getComputedStyle(el).display === 'none');",
" const findBySlug = slug => {",
" if (!slug) return null;",
" const direct = document.getElementById(slug);",
" if (direct) return direct;",
" const attrs = ['data-tab', 'data-page', 'data-view', 'data-section', 'data-panel'];",
" for (const attr of attrs) {",
" for (const el of document.querySelectorAll('[' + attr + ']')) {",
" if (toSlug(el.getAttribute(attr)) === slug && !el.matches('a, button')) return el;",
" }",
" }",
" if (slug === 'home' || slug === 'index') return 'top';",
" for (const el of document.querySelectorAll('section, article, [role=\"tabpanel\"], [id]')) {",
" if (el.id && toSlug(el.id) === slug) return el;",
" const heading = el.querySelector('h1, h2, h3');",
" if (heading && toSlug(heading.textContent) === slug) return el;",
" }",
" for (const el of document.querySelectorAll('section, article, [id]')) {",
" if (el.id && toSlug(el.id).includes(slug)) return el;",
" const heading = el.querySelector('h1, h2, h3');",
" if (heading && toSlug(heading.textContent).includes(slug)) return el;",
" }",
" return null;",
" };",
" const findTarget = (raw, label) => {",
" if (raw.startsWith('#') && raw.length > 1) {",
" let id = raw.slice(1);",
" try { id = decodeURIComponent(id); } catch (e) {}",
" const exact = document.getElementById(id);",
" if (exact) return exact;",
" }",
" const q = queryTarget(raw);",
" const slug = toSlug(q || raw);",
" if (slug === 'top') return 'top';",
" return findBySlug(slug) || findBySlug(toSlug(label));",
" };",
" const syncNav = link => {",
" const group = link.closest('nav, [role=\"tablist\"], header ul, .tabs, .nav');",
" if (!group) return;",
" const peers = Array.from(group.querySelectorAll('a[href], [role=\"tab\"]'));",
" const usesActive = peers.some(item => item.classList.contains('active'));",
" const usesIsActive = peers.some(item => item.classList.contains('is-active'));",
" const usesCurrent = peers.some(item => item.hasAttribute('aria-current'));",
" const usesSelected = peers.some(item => item.hasAttribute('aria-selected'));",
" if (!usesActive && !usesIsActive && !usesCurrent && !usesSelected) return;",
" peers.forEach(item => {",
" const match = item === link;",
" if (usesActive) item.classList.toggle('active', match);",
" if (usesIsActive) item.classList.toggle('is-active', match);",
" if (usesCurrent) {",
" if (match) item.setAttribute('aria-current', 'page');",
" else item.removeAttribute('aria-current');",
" }",
" if (usesSelected) item.setAttribute('aria-selected', String(match));",
" });",
" };",
" const revealHidden = (target, link) => {",
" const key = toSlug(target.id || target.dataset.tab || target.dataset.page || target.dataset.view || '');",
" if (key) {",
" const triggers = document.querySelectorAll('button[data-tab], button[data-page], button[data-view], button[data-target], [role=\"tab\"]');",
" for (const btn of triggers) {",
" if (btn === link) continue;",
" const ref = toSlug(btn.dataset.tab || btn.dataset.page || btn.dataset.view || btn.dataset.target || btn.getAttribute('aria-controls') || '');",
" if (ref && ref === key) {",
" btn.click();",
" if (!isHidden(target)) return;",
" }",
" }",
" }",
" const parent = target.parentElement;",
" if (parent) {",
" const siblings = Array.from(parent.children).filter(el => el !== target && !el.matches('nav, header, footer, script, style'));",
" const usesActive = siblings.some(el => el.classList.contains('active'));",
" const usesIsActive = siblings.some(el => el.classList.contains('is-active'));",
" const usesHiddenClass = target.classList.contains('hidden') || siblings.some(el => el.classList.contains('hidden'));",
" const usesIsHidden = target.classList.contains('is-hidden') || siblings.some(el => el.classList.contains('is-hidden'));",
" siblings.forEach(el => {",
" if (usesActive) el.classList.remove('active');",
" if (usesIsActive) el.classList.remove('is-active');",
" if (usesHiddenClass) el.classList.add('hidden');",
" if (usesIsHidden) el.classList.add('is-hidden');",
" if (el.hasAttribute('hidden') || target.hasAttribute('hidden')) el.hidden = true;",
" if (el.style.display && el.style.display !== 'none') el.style.display = 'none';",
" });",
" if (usesActive) target.classList.add('active');",
" if (usesIsActive) target.classList.add('is-active');",
" target.classList.remove('hidden', 'is-hidden');",
" target.hidden = false;",
" if (target.style.display === 'none') target.style.display = '';",
" if (isHidden(target)) target.style.display = 'block';",
" }",
" syncNav(link);",
" };",
" const activateTarget = (target, link) => {",
" if (target === 'top') {",
" const firstPage = document.querySelector('[data-page=\"home\"], [data-view=\"home\"], #home');",
" if (firstPage && isHidden(firstPage)) revealHidden(firstPage, link);",
" syncNav(link);",
" window.scrollTo({ top: 0, behavior: 'smooth' });",
" return true;",
" }",
" if (!target) return false;",
" if (isHidden(target)) {",
" revealHidden(target, link);",
" const rect = target.getBoundingClientRect();",
" if (rect.top < 0 || rect.top > window.innerHeight * 0.7) {",
" target.scrollIntoView({ behavior: 'smooth', block: 'start' });",
" }",
" return true;",
" }",
" const isTabLike = link.hasAttribute('onclick') || link.getAttribute('role') === 'tab' || Boolean(link.dataset.tab || link.dataset.page || link.dataset.view);",
" if (isTabLike) {",
" const rect = target.getBoundingClientRect();",
" if (rect.top < 0 || rect.top > window.innerHeight * 0.8) {",
" target.scrollIntoView({ behavior: 'smooth', block: 'start' });",
" }",
" return true;",
" }",
" syncNav(link);",
" target.scrollIntoView({ behavior: 'smooth', block: 'start' });",
" return true;",
" };",
" document.addEventListener('click', event => {",
" const link = event.target && event.target.closest ? event.target.closest('a[href], area[href]') : null;",
" if (!link || link.hasAttribute('download')) return;",
" const raw = (link.getAttribute('href') || '').trim();",
" const wasPrevented = event.defaultPrevented;",
" if (/^(mailto:|tel:)/i.test(raw)) {",
" event.preventDefault();",
" window.open(raw, '_blank', 'noopener,noreferrer');",
" return;",
" }",
" if (/^javascript:/i.test(raw)) return;",
" event.preventDefault();",
" if (wasPrevented) return;",
" if (/^https?:[/][/]/i.test(raw)) {",
" try {",
" const parsed = new URL(raw);",
" const fake = /^(www[.])?(example[.](com|org|net)|yourdomain[.]com|localhost|127[.]0[.]0[.]1)$/i.test(parsed.hostname);",
" if (fake) {",
" activateTarget(findTarget(parsed.hash || parsed.pathname + parsed.search, link.textContent), link);",
" return;",
" }",
" window.open(raw, '_blank', 'noopener,noreferrer');",
" } catch (e) {}",
" return;",
" }",
" if (!raw || raw === '#') {",
" if (link.hasAttribute('onclick') || link.dataset.tab || link.dataset.page || link.dataset.view || link.dataset.toggle || link.dataset.bsToggle) return;",
" const byLabel = findBySlug(toSlug(link.textContent));",
" if (byLabel) {",
" activateTarget(byLabel, link);",
" return;",
" }",
" const header = link.closest('header, nav, footer');",
" if (header && (link === header.querySelector('a[href]') || /^(home|top|back to top)$/i.test(link.textContent.trim()))) {",
" window.scrollTo({ top: 0, behavior: 'smooth' });",
" }",
" return;",
" }",
" activateTarget(findTarget(raw, link.textContent), link);",
" }, false);",
" document.addEventListener('submit', event => {",
" if (!event.defaultPrevented) event.preventDefault();",
" }, false);",
"})();",
"<\/script>"
].join("\n");


const EDGE = 20;
const TOP = 20;
const BOTTOM = 36;
const GAP_TOP = 54;
const GAP_BOTTOM = 32;
const MARK_OFFSET = 10;
const DRAG_THRESHOLD = 4;
const DOCK_MAX = 680;
const DOCK_MIN = 480;
const MENU_GAP = 10;
const MENU_EDGE = 16;
const MENU_MIN = 240;
const TIP_DELAY = 500;
const TIP_WARM = 600;
const TIP_GRACE = 90;
const TIP_GAP = 8;
const NOTICE_DURATION = 6500;
const NOTICE_INSET = 16;
const LIVE_MIN = 1400;
const REVEAL_FALLBACK = 900;
const CHUNK_TIMEOUT = 60000;
const COMPLETE_IDLE = 1800;


const DEVICES = {
desktop: { label: "Desktop", width: 1440, height: Infinity },
tablet: { label: "Tablet", width: 820, height: 1180 },
phone: { label: "Phone", width: 390, height: 844 }
};


const STATE_LABELS = { idle: "Waiting for a prompt", building: "Building", ready: "Ready" };
const PLACEHOLDERS = { create: "Describe the site you want Graphite to build\u2026", edit: "Describe a change\u2026" };
const statusMessages = [
"Getting you set up",
"Creating your workspace",
"Reading your description",
"Planning the layout",
"Preparing your canvas",
"Almost ready"
];
const editMessages = [
"Reading your changes",
"Updating the design",
"Applying your changes",
"Polishing the details",
"Almost ready"
];


const DOT_GAP = 24;
const DOT_RADIUS = 1.2;
const POINTER_RADIUS = 160;
const POINTER_PUSH = 6;
const RISE_RATE = 10;
const FALL_RATE = 3.6;
const STATUS_STEP = 2800;
const STATUS_SWAP = 420;
const RELEASE_DURATION = 650;
const LEAVE_DURATION = 460;
const SOFTEN_CLEAR = "blur(0px) saturate(100%)";
const SOFTEN_FROSTED = "blur(14px) saturate(115%)";
const GLASS_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const FROST_EASE = "cubic-bezier(0.4, 0, 0.6, 1)";


const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const normalizeKey = value => String(value || "").trim().replace(/^Bearer\s+/i, "").trim();


let state = "idle";
let device = "desktop";
let layout = loadLayout();
let modelId = loadChoice(MODEL_KEY, MODELS.map(model => model.id), MODELS[0].id);
let thinkingId = loadChoice(THINKING_KEY, currentModel().thinking, currentModel().defaultThinking);
let apiKey = normalizeKey(loadText(API_KEY_KEY));
let siteHtml = "";
let loadingHtml = "";
let revealTimer = 0;
let frameSettled = false;
let history = [];
let request = null;
let menuOpen = false;
let tipTarget = null;
let tipPending = null;
let tipBlocked = null;
let tipTimer = 0;
let tipHideTimer = 0;
let tipHiddenAt = 0;
let noticeTimer = 0;
let chipAnimation = null;
let areaTop = 0;
let areaBottom = 0;
let areaCy = window.innerHeight / 2;
let currentMessages = statusMessages;
let statusIndex = 0;
let statusTimer = 0;
let statusSwapTimer = 0;
let releaseTimer = 0;
let liveMode = false;
let liveTimer = 0;
let pendingLive = "";
let lastSwapAt = 0;
let leaving = false;
let drag = null;
let suppressClick = false;
let floatFrame = 0;
let floatLast = 0;
let instantTimer = 0;
let versionTransform = "";
let versionFade = null;


const springs = {};
Object.keys(floats).forEach(name => {
springs[name] = { x: 0, y: 0, w: 0, vx: 0, vy: 0, vw: 0, tx: 0, ty: 0, tw: 0, ready: false };
});


const region = { x: 0, y: 0, w: 0, h: 0, tx: 0, ty: 0, tw: 0, th: 0, ready: false };


const field = {
w: 0, h: 0, cols: 0, rows: 0, count: 0,
bx: null, by: null, ox: null, oy: null, lift: null,
dotSprite: null, tintSprite: null, spriteScale: 1,
frame: 0, last: 0, time: 0,
px: -9999, py: -9999, sx: -9999, sy: -9999,
strength: 0, strengthTarget: 0, build: 0
};


function currentModel() {
return MODELS.find(model => model.id === modelId) || MODELS[0];
}


function levelFor(id) {
return THINKING_LEVELS.find(level => level.id === id) || THINKING_LEVELS[1];
}


function loadText(key) {
try {
return localStorage.getItem(key) || "";
} catch (error) {
return "";
}
}


function loadChoice(key, allowed, fallback) {
const saved = loadText(key);
return allowed.includes(saved) ? saved : fallback;
}


function saveChoice(key, value) {
try {
if (value) {
localStorage.setItem(key, value);
} else {
localStorage.removeItem(key);
}
} catch (error) {
return;
}
}


function loadLayout() {
try {
const saved = JSON.parse(loadText(LAYOUT_KEY) || "null");
if (!saved) return { ...DEFAULT_LAYOUT };
const next = { ...DEFAULT_LAYOUT };
Object.keys(DEFAULT_LAYOUT).forEach(name => {
if (ALLOWED[name].includes(saved[name])) next[name] = saved[name];
});
const used = Object.values(next);
return new Set(used).size === used.length ? next : { ...DEFAULT_LAYOUT };
} catch (error) {
return { ...DEFAULT_LAYOUT };
}
}


function saveLayout() {
saveChoice(LAYOUT_KEY, JSON.stringify(layout));
}


function moveBead(glass, buttons, button, animate) {
if (!glass || !button || !buttons.length) return;
const to = button.offsetLeft - buttons[0].offsetLeft;
const from = parseFloat(glass.dataset.x);
glass.dataset.x = String(to);
glass.style.width = `${button.offsetWidth}px`;
glass.style.transform = `translateX(${to}px)`;
if (!animate || motionPreference.matches || Number.isNaN(from) || from === to) return;
const middle = (from + to) / 2;
glass.animate([
{ transform: `translateX(${from}px) scaleX(1)`, easing: "cubic-bezier(0.4, 0, 0.2, 1)" },
{ transform: `translateX(${middle}px) scaleX(1.16)`, offset: 0.42, easing: GLASS_EASE },
{ transform: `translateX(${to}px) scaleX(1)` }
], { duration: 460 });
}


function applyModel(animate = false) {
const model = currentModel();
const level = levelFor(thinkingId);
const prevLevel = modelLevel?.dataset.level;
if (modelName) modelName.textContent = model.name;
if (modelLevel) modelLevel.dataset.level = level.id;
if (modelLevelText) modelLevelText.textContent = level.short;
if (animate && !motionPreference.matches && modelLevel && prevLevel && prevLevel !== level.id) {
modelLevel.animate(
[{ opacity: 0.65, transform: "scale(0.94)" }, { opacity: 1, transform: "scale(1)" }],
{ duration: 260, easing: GLASS_EASE }
);
}
if (modelIcon && modelIcon.getAttribute("src") !== model.icon) modelIcon.src = model.icon;
modelTrigger?.setAttribute("aria-label", `Model: ${model.name}, thinking ${level.label}`);
if (thinkingValue) thinkingValue.textContent = level.label;


modelOptions.forEach(option => {
const selected = option.dataset.model === model.id;
option.classList.toggle("is-selected", selected);
option.setAttribute("aria-selected", String(selected));
option.tabIndex = selected ? 0 : -1;
});


let activeButton = null;
thinkingButtons.forEach(button => {
const available = model.thinking.includes(button.dataset.level);
const active = button.dataset.level === level.id;
button.hidden = !available;
button.classList.toggle("is-active", active);
button.setAttribute("aria-checked", String(active));
button.tabIndex = active ? 0 : -1;
if (active) activeButton = button;
});
moveBead(thinkingGlass, thinkingButtons, activeButton, animate);
}


function applyKey() {
if (keyInput && document.activeElement !== keyInput) keyInput.value = apiKey;
if (!keyState) return;
keyState.textContent = apiKey ? "Saved" : "Not set";
keyState.classList.toggle("is-set", Boolean(apiKey));
}


function requestKey() {
openMenu();
modelMenu?.classList.add("is-attention");
keyInput?.focus({ preventScroll: true });
}


function selectModel(id) {
if (!MODELS.some(model => model.id === id) || id === modelId) return;
modelId = id;
saveChoice(MODEL_KEY, id);
if (!currentModel().thinking.includes(thinkingId)) thinkingId = currentModel().defaultThinking;
applyModel(true);
layoutFloats(true);
}


function selectThinking(id) {
if (!currentModel().thinking.includes(id) || id === thinkingId) return;
thinkingId = id;
saveChoice(THINKING_KEY, id);
applyModel(true);
layoutFloats(true);
}


function positionMenu() {
if (!modelTrigger || !modelMenu) return;
modelMenu.style.maxHeight = "";
const anchor = box.getBoundingClientRect();
const trigger = modelTrigger.getBoundingClientRect();
const width = modelMenu.offsetWidth;
const natural = modelMenu.offsetHeight;
const spaceBelow = window.innerHeight - anchor.bottom - MENU_GAP - MENU_EDGE;
const spaceAbove = anchor.top - MENU_GAP - MENU_EDGE;
const needed = Math.min(natural, MENU_MIN);
const preferBelow = anchor.top + anchor.height / 2 < window.innerHeight / 2;
const below = preferBelow
? spaceBelow >= needed || spaceBelow >= spaceAbove
: !(spaceAbove >= needed || spaceAbove >= spaceBelow);
const room = Math.max(below ? spaceBelow : spaceAbove, 0);
const height = Math.min(natural, room);
if (natural > room) modelMenu.style.maxHeight = `${room.toFixed(1)}px`;
const left = clamp(anchor.right - width, 12, window.innerWidth - width - 12);
const top = below ? anchor.bottom + MENU_GAP : anchor.top - height - MENU_GAP;
modelMenu.dataset.side = below ? "below" : "above";
modelMenu.style.transformOrigin = `${(trigger.left + trigger.width / 2 - left).toFixed(1)}px ${below ? 0 : height.toFixed(1)}px`;
modelMenu.style.transform = `translate3d(${left.toFixed(1)}px, ${top.toFixed(1)}px, 0)`;
}


function openMenu(focusFirst = false) {
if (!modelTrigger || !modelMenu || menuOpen || modelTrigger.disabled) return;
menuOpen = true;
hideTip();
hideNotice();
apiKey = normalizeKey(loadText(API_KEY_KEY));
applyModel(false);
applyKey();
positionMenu();
modelMenu.scrollTop = 0;
modelMenu.classList.add("is-open");
modelTrigger.setAttribute("aria-expanded", "true");
if (focusFirst) {
const selected = modelOptions.find(option => option.classList.contains("is-selected")) || modelOptions[0];
selected?.focus({ preventScroll: true });
}
}


function closeMenu(returnFocus = false) {
if (!menuOpen) return;
menuOpen = false;
modelMenu.classList.remove("is-open", "is-attention");
modelTrigger.setAttribute("aria-expanded", "false");
if (returnFocus) modelTrigger.focus({ preventScroll: true });
}


function stepFocus(items, current, step) {
const visible = items.filter(item => !item.hidden);
const position = visible.indexOf(current);
return visible[(position + step + visible.length) % visible.length];
}


function onMenuKey(event) {
const focused = document.activeElement;
if (event.key === "Escape") {
event.preventDefault();
closeMenu(true);
return;
}


if (focused === keyInput && event.key === "Enter") {
event.preventDefault();
closeMenu();
input.focus();
return;
}


if (modelOptions.includes(focused)) {
if (event.key === "ArrowDown" || event.key === "ArrowUp") {
event.preventDefault();
stepFocus(modelOptions, focused, event.key === "ArrowDown" ? 1 : -1)?.focus({ preventScroll: true });
} else if (event.key === "Enter" || event.key === " ") {
event.preventDefault();
selectModel(focused.dataset.model);
}
return;
}


if (thinkingButtons.includes(focused)) {
const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1
: event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
if (!step) return;
event.preventDefault();
const next = stepFocus(thinkingButtons, focused, step);
if (!next) return;
selectThinking(next.dataset.level);
next.focus({ preventScroll: true });
}
}


function canTip(target) {
if (!tooltip || !target || !target.dataset.tooltip) return false;
if (target.disabled || leaving || drag?.started || !body.classList.contains("is-ready")) return false;
if (menuOpen && target === modelTrigger) return false;
return isShown(target);
}


function placeTip(target, glide) {
const rect = target.getBoundingClientRect();
const width = tooltip.offsetWidth;
const height = tooltip.offsetHeight;
const above = rect.top - height - TIP_GAP >= 8;
const left = clamp(rect.left + rect.width / 2 - width / 2, 8, window.innerWidth - width - 8);
const top = above ? rect.top - height - TIP_GAP : rect.bottom + TIP_GAP;
tooltip.classList.toggle("is-gliding", Boolean(glide) && !motionPreference.matches);
tooltip.dataset.side = above ? "above" : "below";
tooltip.style.transform = `translate3d(${left.toFixed(1)}px, ${top.toFixed(1)}px, 0)`;
}


function setTipText(text, animate) {
if (tooltipText.textContent === text) return;
tooltipText.textContent = text;
if (!animate || motionPreference.matches) return;
tooltipText.animate(
[{ opacity: 0, filter: "blur(2px)" }, { opacity: 1, filter: "blur(0px)" }],
{ duration: 220, easing: GLASS_EASE }
);
}


function showTip(target) {
window.clearTimeout(tipTimer);
window.clearTimeout(tipHideTimer);
tipTimer = 0;
tipHideTimer = 0;
tipPending = null;
if (!canTip(target)) {
concealTip();
return;
}
const swapping = Boolean(tipTarget) && tooltip.classList.contains("is-visible");
tipTarget = target;
setTipText(target.dataset.tooltip, swapping);
placeTip(target, swapping);
tooltip.classList.add("is-visible");
}


function concealTip() {
window.clearTimeout(tipHideTimer);
tipHideTimer = 0;
if (tipTarget) tipHiddenAt = performance.now();
tipTarget = null;
tooltip?.classList.remove("is-visible", "is-gliding");
}


function hideTip(immediate = true) {
window.clearTimeout(tipTimer);
tipTimer = 0;
tipPending = null;
if (!tipTarget) return;
if (immediate) {
concealTip();
return;
}
window.clearTimeout(tipHideTimer);
tipHideTimer = window.setTimeout(concealTip, TIP_GRACE);
}


function queueTip(target, immediate) {
if (target === tipTarget) {
window.clearTimeout(tipHideTimer);
tipHideTimer = 0;
return;
}
if (target === tipPending) return;
window.clearTimeout(tipTimer);
tipTimer = 0;
tipPending = null;
const warm = Boolean(tipTarget) || performance.now() - tipHiddenAt < TIP_WARM;
if (immediate || warm) {
showTip(target);
return;
}
tipPending = target;
tipTimer = window.setTimeout(() => showTip(target), TIP_DELAY);
}


function refreshTip(target) {
if (tipTarget !== target) return;
setTipText(target.dataset.tooltip, true);
placeTip(target, true);
}


function placeNotice() {
if (!notice) return;
const width = notice.offsetWidth;
const height = notice.offsetHeight;
const dock = box.getBoundingClientRect();
const dockBelow = dock.top + dock.height / 2 > window.innerHeight / 2;
const regionTop = region.ty;
const regionBottom = region.ty + region.th;
const fits = region.th >= height + NOTICE_INSET * 2;
let top;
if (fits) {
top = dockBelow ? regionBottom - height - NOTICE_INSET : regionTop + NOTICE_INSET;
} else {
top = dockBelow ? dock.top - height - 12 : dock.bottom + 12;
}
const center = region.tw > 0 ? region.tx + region.tw / 2 : window.innerWidth / 2;
const left = clamp(center - width / 2, 16, window.innerWidth - width - 16);
notice.style.transform = `translate3d(${left.toFixed(1)}px, ${top.toFixed(1)}px, 0)`;
}


function showNotice(text) {
if (!notice || !noticeText) return;
noticeText.textContent = text;
placeNotice();
notice.classList.add("is-visible");
window.clearTimeout(noticeTimer);
noticeTimer = window.setTimeout(hideNotice, NOTICE_DURATION);
}


function hideNotice() {
window.clearTimeout(noticeTimer);
noticeTimer = 0;
notice?.classList.remove("is-visible");
}


function isShown(el) {
return Boolean(el) && el.getClientRects().length > 0;
}


function activeLayout() {
return compactQuery.matches ? COMPACT_LAYOUT : layout;
}


function edgeInset() {
return compactQuery.matches ? 12 : EDGE;
}


function measureBands(current, exclude) {
const bands = { top: 0, bottom: 0 };
Object.keys(floats).forEach(name => {
if (name === exclude) return;
const slot = current[name];
if (!slot || !isShown(floats[name])) return;
const band = slot.split("-")[0];
bands[band] = Math.max(bands[band], floats[name].offsetHeight);
});
return bands;
}


function dockWidthFor(band, current) {
if (compactQuery.matches) return window.innerWidth - 24;
let side = 0;
["project", "device"].forEach(name => {
const slot = current[name];
if (!slot || !isShown(floats[name])) return;
const [slotBand, slotSide] = slot.split("-");
if (slotBand === band && slotSide !== "center") side = Math.max(side, floats[name].offsetWidth);
});
let width = Math.min(DOCK_MAX, window.innerWidth - 48);
if (side) width = Math.min(width, window.innerWidth - 2 * (side + EDGE + 24));
return Math.max(width, Math.min(DOCK_MIN, window.innerWidth - 48));
}


function widthFor(name, slot, current) {
return name === "dock" ? dockWidthFor(slot.split("-")[0], current) : floats[name].offsetWidth;
}


function slotPosition(slot, width, height, bands) {
const [band, side] = slot.split("-");
const edge = edgeInset();
const rowHeight = Math.max(bands[band] || 0, height);
const x = side === "left" ? edge : side === "right" ? window.innerWidth - width - edge : (window.innerWidth - width) / 2;
const y = band === "top"
? TOP + (rowHeight - height) / 2
: window.innerHeight - BOTTOM - rowHeight + (rowHeight - height) / 2;
return { x, y };
}


function applyFloat(name) {
const spring = springs[name];
floats[name].style.transform = `translate3d(${spring.x.toFixed(2)}px, ${spring.y.toFixed(2)}px, 0)`;
if (name === "dock" && spring.w > 0) box.style.width = `${spring.w.toFixed(2)}px`;
}


function layoutFloats(animate = true) {
const current = activeLayout();
const instant = !animate || motionPreference.matches;
const bands = measureBands(current);


Object.keys(floats).forEach(name => {
const el = floats[name];
const slot = current[name];
if (!slot || !isShown(el)) return;
const width = widthFor(name, slot, current);
const target = slotPosition(slot, width, el.offsetHeight, bands);
const spring = springs[name];
spring.tx = target.x;
spring.ty = target.y;
spring.tw = name === "dock" ? width : 0;
if (instant || !spring.ready) {
spring.x = spring.tx;
spring.y = spring.ty;
spring.w = spring.tw;
spring.vx = 0;
spring.vy = 0;
spring.vw = 0;
spring.ready = true;
if (!(drag?.started && drag.name === name)) applyFloat(name);
}
});


areaTop = TOP + bands.top + GAP_TOP;
areaBottom = BOTTOM + bands.bottom + GAP_BOTTOM;
areaCy = (areaTop + window.innerHeight - areaBottom) / 2;
body.style.setProperty("--area-cy", `${areaCy.toFixed(1)}px`);
updateCopy();
placeVersion(current, !instant);
updateRegionTarget(!instant);
if (menuOpen) positionMenu();
if (notice?.classList.contains("is-visible")) placeNotice();
if (!instant) requestFloats();
}


function updateCopy() {
const editing = Boolean(siteHtml);
if (placeholder) placeholder.textContent = editing ? PLACEHOLDERS.edit : PLACEHOLDERS.create;
if (hint) {
hint.textContent = activeLayout().dock.startsWith("top")
? "Describe it above. Graphite builds it."
: "Describe it below. Graphite builds it.";
}
}


function requestFloats() {
if (!floatFrame) floatFrame = window.requestAnimationFrame(stepFloats);
}


function stepFloats(timestamp) {
const delta = floatLast ? Math.min((timestamp - floatLast) / 1000, 0.05) : 1 / 60;
floatLast = timestamp;
const k = 300;
const damping = 2 * 0.82 * Math.sqrt(k);
const steps = 4;
let moving = false;


Object.keys(springs).forEach(name => {
if (drag?.started && drag.name === name) return;
const spring = springs[name];
if (!spring.ready) return;
for (let i = 0; i < steps; i += 1) {
const dt = delta / steps;
spring.vx += (k * (spring.tx - spring.x) - damping * spring.vx) * dt;
spring.vy += (k * (spring.ty - spring.y) - damping * spring.vy) * dt;
spring.vw += (k * (spring.tw - spring.w) - damping * spring.vw) * dt;
spring.x += spring.vx * dt;
spring.y += spring.vy * dt;
spring.w += spring.vw * dt;
}
const settled =
Math.abs(spring.tx - spring.x) < 0.1 && Math.abs(spring.ty - spring.y) < 0.1 && Math.abs(spring.tw - spring.w) < 0.1 &&
Math.abs(spring.vx) < 2 && Math.abs(spring.vy) < 2 && Math.abs(spring.vw) < 2;
if (settled) {
spring.x = spring.tx;
spring.y = spring.ty;
spring.w = spring.tw;
spring.vx = 0;
spring.vy = 0;
spring.vw = 0;
} else {
moving = true;
}
applyFloat(name);
});


if (menuOpen) positionMenu();
if (tipTarget) placeTip(tipTarget, false);
if (notice?.classList.contains("is-visible")) placeNotice();
floatFrame = moving ? window.requestAnimationFrame(stepFloats) : 0;
if (!floatFrame) floatLast = 0;
}


function resetLayout() {
layout = { ...DEFAULT_LAYOUT };
saveLayout();
layoutFloats(true);
}


function placeVersion(current, animate) {
if (!footer) return;
const occupied = new Set();
Object.keys(floats).forEach(name => {
const slot = current[name];
if (slot && isShown(floats[name])) occupied.add(slot);
});
const side = ["right", "left"].find(option => !occupied.has(`bottom-${option}`))
|| (occupied.has("bottom-center") ? "right" : "center");
const width = footer.offsetWidth;
const height = footer.offsetHeight;
const edge = edgeInset();
const x = side === "right" ? window.innerWidth - width - edge : side === "left" ? edge : (window.innerWidth - width) / 2;
const y = window.innerHeight - height - 12;
versionTransform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;


const sideChanged = footer.dataset.side !== side;
footer.dataset.side = side;
if (!sideChanged || !animate || motionPreference.matches || !body.classList.contains("is-ready")) {
if (!versionFade) footer.style.transform = versionTransform;
return;
}


versionFade?.cancel();
versionFade = footer.animate(
[{ opacity: 1, filter: "blur(0px)" }, { opacity: 0, filter: "blur(4px)" }],
{ duration: 220, easing: "cubic-bezier(0.4, 0, 1, 1)", fill: "forwards" }
);
versionFade.onfinish = () => {
footer.style.transform = versionTransform;
versionFade?.cancel();
versionFade = null;
footer.animate(
[{ opacity: 0, filter: "blur(4px)" }, { opacity: 1, filter: "blur(0px)" }],
{ duration: 420, easing: GLASS_EASE }
);
};
}


function placeSlotGhosts(name) {
const el = floats[name];
const height = el.offsetHeight;
const bands = measureBands(layout, name);
SLOT_NAMES.forEach(slot => {
const ghost = slotEls[slot];
if (!ghost) return;
const available = ALLOWED[name].includes(slot);
ghost.classList.toggle("is-available", available);
ghost.classList.toggle("is-target", slot === layout[name]);
if (!available) return;
const width = widthFor(name, slot, layout);
const position = slotPosition(slot, width, height, bands);
ghost.style.width = `${width}px`;
ghost.style.height = `${height}px`;
ghost.style.borderRadius = `${height / 2}px`;
ghost.style.transform = `translate3d(${position.x}px, ${position.y}px, 0)`;
});
}


function nearestSlot(name) {
const el = floats[name];
const spring = springs[name];
const height = el.offsetHeight;
const cx = spring.x + el.offsetWidth / 2;
const cy = spring.y + height / 2;
const bands = measureBands(layout, name);
let best = layout[name];
let bestDistance = Infinity;
ALLOWED[name].forEach(slot => {
const width = widthFor(name, slot, layout);
const position = slotPosition(slot, width, height, bands);
const distance = Math.hypot(position.x + width / 2 - cx, position.y + height / 2 - cy);
if (distance < bestDistance) {
bestDistance = distance;
best = slot;
}
});
return best;
}


function startDrag(event) {
const spring = springs[drag.name];
closeMenu();
hideTip();
drag.started = true;
drag.target = layout[drag.name];
drag.gx = event.clientX - spring.x;
drag.gy = event.clientY - spring.y;
spring.vx = 0;
spring.vy = 0;
drag.el.style.transformOrigin = `${drag.gx.toFixed(1)}px ${drag.gy.toFixed(1)}px`;
try {
drag.el.setPointerCapture(drag.id);
} catch (error) {
drag.captured = false;
}
window.getSelection?.()?.removeAllRanges();
body.classList.add("is-arranging");
drag.el.classList.add("is-dragging");
placeSlotGhosts(drag.name);
}


function moveDrag(event) {
const spring = springs[drag.name];
const elapsed = Math.max(event.timeStamp - drag.lt, 1);
drag.vx = (event.clientX - drag.lx) / elapsed * 1000;
drag.vy = (event.clientY - drag.ly) / elapsed * 1000;
drag.lx = event.clientX;
drag.ly = event.clientY;
drag.lt = event.timeStamp;
spring.x = event.clientX - drag.gx;
spring.y = event.clientY - drag.gy;
applyFloat(drag.name);


const target = nearestSlot(drag.name);
if (target !== drag.target) {
drag.target = target;
SLOT_NAMES.forEach(slot => slotEls[slot]?.classList.toggle("is-target", slot === target));
}
}


function onDragMove(event) {
if (!drag || event.pointerId !== drag.id) return;
if (!drag.started) {
if (Math.hypot(event.clientX - drag.sx, event.clientY - drag.sy) < DRAG_THRESHOLD) return;
startDrag(event);
}
moveDrag(event);
}


function endDrag(event) {
if (!drag || event.pointerId !== drag.id) return;
const finished = drag;
drag = null;
if (!finished.started) return;


suppressClick = true;
window.setTimeout(() => {
suppressClick = false;
}, 0);
if (finished.el.hasPointerCapture?.(finished.id)) finished.el.releasePointerCapture(finished.id);


body.classList.remove("is-arranging");
finished.el.classList.remove("is-dragging");
Object.values(slotEls).forEach(ghost => ghost.classList.remove("is-target"));


const from = layout[finished.name];
const to = event.type === "pointercancel" ? from : finished.target || from;
if (to !== from) {
const other = Object.keys(layout).find(name => name !== finished.name && layout[name] === to);
if (!other) {
layout[finished.name] = to;
} else if (ALLOWED[other].includes(from)) {
layout[other] = from;
layout[finished.name] = to;
}
saveLayout();
}


const spring = springs[finished.name];
spring.vx = clamp(finished.vx, -2400, 2400) * 0.3;
spring.vy = clamp(finished.vy, -2400, 2400) * 0.3;
layoutFloats(true);
}


Object.entries(floats).forEach(([name, el]) => {
el.addEventListener("pointerdown", event => {
if (compactQuery.matches || event.button !== 0 || drag || leaving) return;
if (event.target.closest("input, .model-trigger")) return;
if (name === "dock" && !event.target.closest(".dock__grip")) return;
drag = {
name,
el,
id: event.pointerId,
sx: event.clientX,
sy: event.clientY,
gx: 0,
gy: 0,
lx: event.clientX,
ly: event.clientY,
lt: event.timeStamp,
vx: 0,
vy: 0,
started: false,
captured: true,
target: null
};
if (name === "dock") event.preventDefault();
});


el.addEventListener("dragstart", event => event.preventDefault());


el.addEventListener("click", event => {
if (!suppressClick) return;
event.preventDefault();
event.stopPropagation();
suppressClick = false;
}, true);
});


grip?.addEventListener("dblclick", resetLayout);


function effectiveDevice() {
return compactQuery.matches ? "desktop" : device;
}


function updateRegionTarget(animate = true) {
const side = compactQuery.matches ? 16 : 64;
const availableW = Math.max(0, window.innerWidth - side * 2);
const availableH = Math.max(0, window.innerHeight - areaTop - areaBottom);
const preset = DEVICES[effectiveDevice()];
const width = Math.min(preset.width, availableW);
const height = Math.min(preset.height, availableH);
region.tx = (window.innerWidth - width) / 2;
region.ty = areaTop + (availableH - height) / 2;
region.tw = width;
region.th = height;
if (!animate || !region.ready || motionPreference.matches) {
region.x = region.tx;
region.y = region.ty;
region.w = region.tw;
region.h = region.th;
region.ready = true;
}
if (regionDevice) regionDevice.textContent = preset.label;
requestField();
}


function updateRegionDom() {
const x = region.x;
const y = region.y;
if (regionLabel) {
regionLabel.style.transform = `translate3d(${(x - MARK_OFFSET).toFixed(1)}px, ${(y - MARK_OFFSET - 32).toFixed(1)}px, 0)`;
}
if (regionSize) {
const text = `${Math.round(region.w)} \u00d7 ${Math.round(region.h)}`;
if (regionSize.textContent !== text) regionSize.textContent = text;
}
site.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
site.style.width = `${region.w.toFixed(1)}px`;
site.style.height = `${region.h.toFixed(1)}px`;
}


function makeSprite(color, size) {
const sprite = document.createElement("canvas");
sprite.width = size;
sprite.height = size;
const spriteCtx = sprite.getContext("2d");
spriteCtx.fillStyle = color;
spriteCtx.beginPath();
spriteCtx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
spriteCtx.fill();
return sprite;
}


function resizeField() {
if (!canvas || !ctx) return;
const dpr = Math.min(window.devicePixelRatio || 1, 2);
field.w = window.innerWidth;
field.h = window.innerHeight;
canvas.width = Math.round(field.w * dpr);
canvas.height = Math.round(field.h * dpr);
ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = "high";


const spriteSize = 32;
field.dotSprite = makeSprite("rgb(52, 70, 94)", spriteSize);
field.tintSprite = makeSprite("rgb(78, 152, 226)", spriteSize);
field.spriteScale = spriteSize / (spriteSize - 2);


field.cols = Math.ceil(field.w / DOT_GAP) + 1;
field.rows = Math.ceil(field.h / DOT_GAP) + 1;
field.count = field.cols * field.rows;
field.bx = new Float32Array(field.count);
field.by = new Float32Array(field.count);
field.ox = new Float32Array(field.count);
field.oy = new Float32Array(field.count);
field.lift = new Float32Array(field.count);
const startX = (field.w - (field.cols - 1) * DOT_GAP) / 2;
const startY = (field.h - (field.rows - 1) * DOT_GAP) / 2;
for (let row = 0, i = 0; row < field.rows; row += 1) {
for (let col = 0; col < field.cols; col += 1, i += 1) {
field.bx[i] = startX + col * DOT_GAP;
field.by[i] = startY + row * DOT_GAP;
}
}
}


function requestField() {
if (ctx && !field.frame) field.frame = window.requestAnimationFrame(drawField);
}


function onFieldPointer(event) {
if (event.pointerType === "touch" || motionPreference.matches) return;
field.px = event.clientX;
field.py = event.clientY;
if (field.strength < 0.01) {
field.sx = field.px;
field.sy = field.py;
}
field.strengthTarget = 1;
requestField();
}


function releaseFieldPointer() {
field.strengthTarget = 0;
requestField();
}


function roundedRect(x, y, w, h, r) {
const radius = Math.min(r, w / 2, h / 2);
ctx.beginPath();
ctx.moveTo(x + radius, y);
ctx.arcTo(x + w, y, x + w, y + h, radius);
ctx.arcTo(x + w, y + h, x, y + h, radius);
ctx.arcTo(x, y + h, x, y, radius);
ctx.arcTo(x, y, x + w, y, radius);
ctx.closePath();
}


function drawRegion(left, top, width, height) {
if (width < 4 || height < 4) return;
roundedRect(left, top, width, height, 14);
ctx.globalAlpha = 0.16;
ctx.fillStyle = "rgb(255, 255, 255)";
ctx.fill();
ctx.globalAlpha = 0.5;
ctx.strokeStyle = "rgb(255, 255, 255)";
ctx.lineWidth = 1;
ctx.stroke();


if (compactQuery.matches) return;
const l = left - MARK_OFFSET;
const t = top - MARK_OFFSET;
const r = left + width + MARK_OFFSET;
const b = top + height + MARK_OFFSET;
const arm = 16;
ctx.globalAlpha = 0.62;
ctx.strokeStyle = "rgb(52, 70, 94)";
ctx.lineWidth = 1.6;
ctx.lineCap = "round";
ctx.lineJoin = "round";
ctx.beginPath();
ctx.moveTo(l, t + arm);
ctx.lineTo(l, t);
ctx.lineTo(l + arm, t);
ctx.moveTo(r - arm, t);
ctx.lineTo(r, t);
ctx.lineTo(r, t + arm);
ctx.moveTo(r, b - arm);
ctx.lineTo(r, b);
ctx.lineTo(r - arm, b);
ctx.moveTo(l + arm, b);
ctx.lineTo(l, b);
ctx.lineTo(l, b - arm);
ctx.stroke();
}


function drawField(timestamp) {
field.frame = 0;
if (!field.count) return;
const reduced = motionPreference.matches;
const delta = field.last ? Math.min((timestamp - field.last) / 1000, 0.05) : 1 / 60;
field.last = timestamp;
const ease = rate => (reduced ? 1 : 1 - Math.exp(-delta * rate));
const building = state === "building" && !reduced;
const rise = ease(RISE_RATE);
const fall = ease(FALL_RATE);


field.sx += (field.px - field.sx) * ease(22);
field.sy += (field.py - field.sy) * ease(22);
field.strength += (field.strengthTarget - field.strength) * ease(4);
field.build += ((building ? 1 : 0) - field.build) * ease(2.2);
region.x += (region.tx - region.x) * ease(8);
region.y += (region.ty - region.y) * ease(8);
region.w += (region.tw - region.w) * ease(8);
region.h += (region.th - region.h) * ease(8);
if (!reduced) field.time += delta;


ctx.clearRect(0, 0, field.w, field.h);
drawRegion(region.x, region.y, region.w, region.h);


const strength = reduced ? 0 : field.strength;
const radius2 = POINTER_RADIUS * POINTER_RADIUS;
const left = region.x;
const top = region.y;
const right = region.x + region.w;
const bottom = region.y + region.h;
const cx = field.w / 2;
const clearing = !siteHtml;
const scale = field.spriteScale;
const { bx, by, ox, oy, lift } = field;
let moving = false;


for (let i = 0; i < field.count; i += 1) {
const baseX = bx[i];
const baseY = by[i];
let targetX = 0;
let targetY = 0;
let targetLift = 0;


if (strength > 0.001) {
const dx = baseX - field.sx;
const dy = baseY - field.sy;
const d2 = dx * dx + dy * dy;
if (d2 < radius2 && d2 > 0.01) {
const distance = Math.sqrt(d2);
let falloff = 1 - distance / POINTER_RADIUS;
falloff = falloff * falloff * (3 - 2 * falloff);
targetLift = falloff * strength;
targetX = (dx / distance) * POINTER_PUSH * targetLift;
targetY = (dy / distance) * POINTER_PUSH * targetLift;
}
}


const rate = targetLift > lift[i] ? rise : fall;
ox[i] += (targetX - ox[i]) * rate;
oy[i] += (targetY - oy[i]) * rate;
lift[i] += (targetLift - lift[i]) * rate;
if (!moving && (Math.abs(targetX - ox[i]) > 0.02 || Math.abs(targetY - oy[i]) > 0.02 || Math.abs(targetLift - lift[i]) > 0.002)) {
moving = true;
}


const edge = Math.min(baseX - left, right - baseX, baseY - top, bottom - baseY);
const inside = clamp(edge / 14 + 0.5, 0, 1);
let alpha = 0.14 + 0.2 * inside;


if (clearing) {
const ex = (baseX - cx) / 230;
const ey = (baseY - areaCy) / 78;
const e = ex * ex + ey * ey;
if (e < 1) alpha *= 0.3 + 0.7 * e;
}


if (field.build > 0.002) {
const distance = Math.hypot(baseX - cx, baseY - areaCy);
const wave = 0.5 + 0.5 * Math.sin(distance / 64 - field.time * 2.4);
alpha += 0.12 * wave * wave * wave * wave * field.build * inside;
}


const amount = lift[i];
const radius = DOT_RADIUS * (1 + 0.5 * amount) * scale;
const size = radius * 2;
const x = baseX + ox[i] - radius;
const y = baseY + oy[i] - radius;


ctx.globalAlpha = Math.min(alpha + 0.22 * amount, 0.9);
ctx.drawImage(field.dotSprite, x, y, size, size);
if (amount > 0.002) {
ctx.globalAlpha = 0.55 * amount;
ctx.drawImage(field.tintSprite, x, y, size, size);
}
}


ctx.globalAlpha = 1;
updateRegionDom();


const settled =
!moving &&
Math.abs(field.px - field.sx) < 0.2 &&
Math.abs(field.py - field.sy) < 0.2 &&
Math.abs(field.strengthTarget - field.strength) < 0.002 &&
Math.abs(region.tx - region.x) < 0.2 &&
Math.abs(region.ty - region.y) < 0.2 &&
Math.abs(region.tw - region.w) < 0.2 &&
Math.abs(region.th - region.h) < 0.2 &&
!building &&
field.build < 0.002;


if (settled || reduced) {
field.last = 0;
return;
}
field.frame = window.requestAnimationFrame(drawField);
}


function setDevice(name, animate = true) {
if (!DEVICES[name]) return;
device = name;
body.dataset.device = name;
deviceButtons.forEach(button => {
const active = button.dataset.device === name;
button.classList.toggle("is-active", active);
button.setAttribute("aria-checked", String(active));
button.tabIndex = active ? 0 : -1;
});
moveBead(switchGlass, deviceButtons, deviceButtons.find(button => button.dataset.device === name), animate);
updateRegionTarget(animate);
if (notice?.classList.contains("is-visible")) placeNotice();
}


deviceButtons.forEach((button, buttonIndex) => {
button.addEventListener("click", () => setDevice(button.dataset.device));
button.addEventListener("keydown", event => {
const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1
: event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
if (!step) return;
event.preventDefault();
const next = deviceButtons[(buttonIndex + step + deviceButtons.length) % deviceButtons.length];
setDevice(next.dataset.device);
next.focus();
});
});


function restartShimmer() {
shimmerElements.forEach(element => {
element.classList.remove("is-releasing");
element.getAnimations?.().forEach(animation => {
if (animation.animationName === "status-shimmer") animation.currentTime = 0;
});
});
}


function releaseShimmer() {
window.clearTimeout(releaseTimer);
shimmerElements.forEach(element => element.classList.add("is-releasing"));
releaseTimer = window.setTimeout(() => {
shimmerElements.forEach(element => element.classList.remove("is-releasing"));
}, RELEASE_DURATION);
}


function setChip(text) {
if (!stateChip || !stateText || stateText.textContent === text) return;
const from = stateChip.getBoundingClientRect().width;
chipAnimation?.cancel();
chipAnimation = null;
stateText.textContent = text;
const to = stateChip.getBoundingClientRect().width;
layoutFloats(true);
if (motionPreference.matches || !body.classList.contains("is-ready") || Math.abs(to - from) < 0.5) return;
const growth = stateChip.animate(
[{ width: `${from.toFixed(1)}px` }, { width: `${to.toFixed(1)}px` }],
{ duration: 420, easing: GLASS_EASE }
);
chipAnimation = growth;
growth.onfinish = () => {
if (chipAnimation === growth) chipAnimation = null;
};
stateText.animate(
[{ opacity: 0, filter: "blur(4px)" }, { opacity: 1, filter: "blur(0px)" }],
{ duration: 360, easing: GLASS_EASE }
);
}


function setProjectName(name) {
if (!projectName) return;
const next = name || "Untitled site";
if (projectName.textContent === next) return;
projectName.textContent = next;
layoutFloats(true);
}


function render() {
const building = state === "building";
const label = building ? "Stop" : "Build";
box.classList.toggle("has-value", input.value.trim().length > 0);
box.classList.toggle("is-building", building);
input.readOnly = building;
action.setAttribute("aria-label", label);
action.dataset.tooltip = label;
refreshTip(action);
if (modelTrigger) modelTrigger.disabled = building || leaving;
if (modelTrigger?.disabled && tipTarget === modelTrigger) hideTip();
}


function setMeta(text) {
if (!statusMeta) return;
statusMeta.textContent = text;
statusMeta.classList.toggle("is-visible", Boolean(text));
}


function stopStatus() {
window.clearTimeout(statusTimer);
window.clearTimeout(statusSwapTimer);
window.clearTimeout(liveTimer);
statusTimer = 0;
statusSwapTimer = 0;
liveTimer = 0;
pendingLive = "";
liveMode = false;
}


function swapStatusText(text) {
if (!statusText || !text || statusText.textContent === text) return;
window.clearTimeout(statusSwapTimer);
lastSwapAt = performance.now();
if (motionPreference.matches) {
statusText.textContent = text;
return;
}
statusText.classList.remove("is-entering");
statusText.classList.add("is-leaving");
statusSwapTimer = window.setTimeout(() => {
statusSwapTimer = 0;
if (state !== "building") return;
statusText.textContent = text;
statusText.classList.remove("is-leaving");
statusText.classList.add("is-entering");
restartShimmer();
requestAnimationFrame(() => {
requestAnimationFrame(() => statusText.classList.remove("is-entering"));
});
}, STATUS_SWAP);
}


function scheduleStatus() {
if (statusIndex < currentMessages.length - 1) {
statusTimer = window.setTimeout(advanceStatus, STATUS_STEP);
}
}


function advanceStatus() {
statusTimer = 0;
if (state !== "building" || liveMode) return;
const next = statusIndex + 1;
if (next >= currentMessages.length) return;
statusIndex = next;
swapStatusText(currentMessages[next]);
scheduleStatus();
}


function startStatus(step, messages) {
if (!statusText) return;
stopStatus();
window.clearTimeout(releaseTimer);
currentMessages = messages;
statusIndex = clamp(step, 0, messages.length - 1);
statusText.classList.remove("is-leaving", "is-entering");
statusText.textContent = messages[statusIndex];
lastSwapAt = performance.now();
restartShimmer();
scheduleStatus();
}


function queueLive(text) {
if (state !== "building" || !text) return;
if (text === pendingLive || (!pendingLive && statusText?.textContent === text)) return;
liveMode = true;
window.clearTimeout(statusTimer);
statusTimer = 0;
pendingLive = text;
window.clearTimeout(liveTimer);
const wait = Math.max(0, LIVE_MIN - (performance.now() - lastSwapAt));
liveTimer = window.setTimeout(() => {
liveTimer = 0;
const next = pendingLive;
pendingLive = "";
swapStatusText(next);
}, wait);
}


function setState(next) {
if (!STATE_LABELS[next]) return;
const wasBuilding = state === "building";
if (next !== "building") stopStatus();
if (wasBuilding && next !== "building") releaseShimmer();
state = next;
body.dataset.state = next;
setChip(next === "building" && siteHtml ? "Updating" : STATE_LABELS[next]);
render();
requestField();
}


function splitThoughts(text) {
let thought = "";
let rest = text.replace(/<thought>([\s\S]*?)<\/thought>/gi, (match, inner) => {
thought += inner;
return "";
});
const open = rest.search(/<thought>/i);
if (open !== -1) {
thought += rest.slice(open + 9);
rest = rest.slice(0, open);
}
return { thought, html: rest };
}


function thoughtHeading(text) {
const matches = Array.from(text.matchAll(/\*\*([^*\n]{3,64})\*\*/g));
const last = matches[matches.length - 1]?.[1]?.trim();
return last ? last.replace(/[.:]+$/, "") : "";
}


function formatSize(length) {
return length < 1024 ? `${length} B` : `${(length / 1024).toFixed(1)} KB`;
}


function extractHtml(text) {
let html = splitThoughts(text).html.trim();
const start = html.search(/<!doctype html|<html[\s>]/i);
const end = html.toLowerCase().lastIndexOf("</html>");
if (start !== -1 && end !== -1 && end > start) {
html = html.slice(start, end + 7);
} else {
const fence = html.match(/```(?:html)?\s*([\s\S]*)```/i);
if (fence) html = fence[1].trim();
const innerStart = html.search(/<!doctype html|<html[\s>]/i);
if (innerStart > 0) html = html.slice(innerStart);
const innerEnd = html.toLowerCase().lastIndexOf("</html>");
if (innerEnd !== -1) html = html.slice(0, innerEnd + 7);
}
if (!/<(html|body|div|section|main|header)[\s>]/i.test(html)) return "";
if (!/<html[\s>]/i.test(html)) {
html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body>${html}</body></html>`;
}
return html;
}


function preparePreviewHtml(html) {
const headMatch = html.match(/<head(?:\s[^>]*)?>/i);
if (headMatch) {
const idx = headMatch.index + headMatch[0].length;
return `${html.slice(0, idx)}${PREVIEW_GUARD}${html.slice(idx)}`;
}
const htmlMatch = html.match(/<html(?:\s[^>]*)?>/i);
if (htmlMatch) {
const idx = htmlMatch.index + htmlMatch[0].length;
return `${html.slice(0, idx)}<head>${PREVIEW_GUARD}</head>${html.slice(idx)}`;
}
return `${PREVIEW_GUARD}${html}`;
}


function titleOf(html) {
const match = html.match(/<title[^>]*>([^<]{1,80})<\/title>/i);
if (!match) return "";
const decoder = document.createElement("textarea");
decoder.innerHTML = match[1];
return decoder.value.trim();
}


function buildMessages(prompt) {
if (!siteHtml) {
return [
{ role: "system", content: SYSTEM_PROMPT },
{ role: "user", content: prompt }
];
}
const earlier = history.slice(-6).map((item, position) => `${position + 1}. ${item}`).join("\n");
return [
{ role: "system", content: `${SYSTEM_PROMPT} ${EDIT_RULES}` },
{ role: "user", content: `Earlier requests:\n${earlier}\n\nCurrent website:\n${siteHtml}\n\nChange request:\n${prompt}` }
];
}


function readPayload(text) {
let payload;
try {
payload = JSON.parse(text);
} catch (error) {
throw new ApiError(502, text.slice(0, 200));
}
const code = Number(payload.code);
if (payload.error || (code && code !== 200)) {
throw new ApiError(payload.error?.code || code || 500, payload.error?.message || payload.msg || "");
}
return payload.choices?.[0]?.message?.content || payload.data?.choices?.[0]?.message?.content || "";
}


function readChunk(reader, timeoutMs, signal) {
return new Promise((resolve, reject) => {
if (signal?.aborted) {
reject(new DOMException("Aborted", "AbortError"));
return;
}
const onAbort = () => {
cleanup();
reject(new DOMException("Aborted", "AbortError"));
};
const timer = window.setTimeout(() => {
cleanup();
const err = new Error("timeout");
err.code = "STREAM_TIMEOUT";
reject(err);
}, timeoutMs);
const cleanup = () => {
window.clearTimeout(timer);
signal?.removeEventListener("abort", onAbort);
};
signal?.addEventListener("abort", onAbort, { once: true });
reader.read().then(
result => {
cleanup();
resolve(result);
},
err => {
cleanup();
reject(err);
}
);
});
}


function hasCompleteClosingTag(text) {
return /<\/html>\s*`{0,3}\s*$/i.test(splitThoughts(text).html);
}


async function streamCompletion(messages, effort, signal, onThought, onContent) {
const response = await fetch(API_URL, {
method: "POST",
headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
body: JSON.stringify({ messages, stream: true, include_thoughts: true, reasoning_effort: effort }),
signal
});
if (!response.ok) throw new ApiError(response.status, await response.text().catch(() => ""));
if (!response.body) return readPayload(await response.text());


const reader = response.body.getReader();
const decoder = new TextDecoder();
let buffer = "";
let content = "";
let thoughts = "";
let plain = "";


const handleLine = line => {
const trimmed = line.trim();
if (!trimmed || trimmed.startsWith(":")) return false;
if (!trimmed.startsWith("data:")) {
if (!trimmed.startsWith("event:")) plain += trimmed;
return false;
}
const data = trimmed.slice(5).trim();
if (data === "[DONE]") return true;
let payload;
try {
payload = JSON.parse(data);
} catch (error) {
return false;
}
if (payload.error) throw new ApiError(payload.error.code || 500, payload.error.message);
const choice = (payload.choices ?? payload.data?.choices)?.[0];
const delta = choice?.delta ?? choice?.message ?? {};
const thought = delta.reasoning_content || delta.reasoning || delta.thinking || "";
if (thought) {
thoughts += thought;
onThought(thoughts);
}
const piece = typeof delta.content === "string"
? delta.content
: Array.isArray(delta.content) ? delta.content.map(part => part.text || "").join("") : "";
if (piece) {
content += piece;
onContent(content);
}
return Boolean(choice?.finish_reason);
};


for (;;) {
const waitMs = content && hasCompleteClosingTag(content) ? COMPLETE_IDLE : CHUNK_TIMEOUT;
let chunk;
try {
chunk = await readChunk(reader, waitMs, signal);
} catch (error) {
reader.cancel().catch(() => null);
if (error?.code === "STREAM_TIMEOUT" && content && hasCompleteClosingTag(content)) return content;
throw error;
}
const { value, done } = chunk;
if (done) break;
buffer += decoder.decode(value, { stream: true });
const lines = buffer.split(/\r?\n/);
buffer = lines.pop() || "";
for (const line of lines) {
if (handleLine(line)) {
reader.cancel().catch(() => null);
return content;
}
}
if (buffer.trim() === "data: [DONE]") {
reader.cancel().catch(() => null);
return content;
}
}


buffer += decoder.decode();
if (buffer) handleLine(buffer);
if (!content && plain) return readPayload(plain);
return content;
}


function describeError(error) {
if (error instanceof ApiError) {
if (error.status === 401 || error.status === 403) return "Your API key was rejected. Check it in the model menu.";
if (error.status === 402) return "Your kie.ai account is out of credits.";
if (error.status === 429) return "Too many requests right now. Try again in a moment.";
if (error.status >= 500) return "The model is having trouble right now. Try again shortly.";
return "The request was rejected. Try rephrasing your prompt.";
}
if (error?.code === "STREAM_TIMEOUT") return "The model stopped responding. Press Build to try again.";
if (error instanceof TypeError) return "Couldn't reach the model. Check your connection and try again.";
if (error?.message === "empty") return "The model didn't return a website. Try describing it a little differently.";
return "Something went wrong while building. Try again.";
}


function ensureFrame() {
let frame = site.querySelector(".stage-site__frame");
if (frame) return frame;
frame = document.createElement("iframe");
frame.className = "stage-site__frame";
frame.title = "Website preview";
frame.setAttribute("sandbox", "allow-scripts allow-forms allow-popups allow-modals allow-popups-to-escape-sandbox");
frame.setAttribute("referrerpolicy", "no-referrer");
frame.addEventListener("load", () => {
if (loadingHtml) {
const html = loadingHtml;
window.clearTimeout(revealTimer);
revealTimer = 0;
frameSettled = true;
completeBuild(html);
return;
}
if (!frameSettled) {
frameSettled = true;
return;
}
if (siteHtml) {
frameSettled = false;
frame.srcdoc = preparePreviewHtml(siteHtml);
}
});
site.append(frame);
return frame;
}


function cancelPendingFrame() {
window.clearTimeout(revealTimer);
revealTimer = 0;
if (!loadingHtml) return;
loadingHtml = "";
const frame = site.querySelector(".stage-site__frame");
if (!frame) return;
if (siteHtml) {
frameSettled = false;
frame.srcdoc = preparePreviewHtml(siteHtml);
}
}


function completeBuild(html) {
window.clearTimeout(revealTimer);
revealTimer = 0;
loadingHtml = "";
if (state !== "building") return;
siteHtml = html;
body.classList.add("has-site");
setProjectName(titleOf(html));
input.value = "";
setMeta("");
setState("ready");
updateCopy();
}


function showSite(html) {
const frame = ensureFrame();
window.clearTimeout(revealTimer);
loadingHtml = html;
frameSettled = false;
frame.srcdoc = preparePreviewHtml(html);
revealTimer = window.setTimeout(() => {
revealTimer = 0;
if (loadingHtml === html) completeBuild(html);
}, REVEAL_FALLBACK);
}


function failBuild(message) {
cancelPendingFrame();
setMeta("");
setState(siteHtml ? "ready" : "idle");
showNotice(message);
input.focus();
}


async function requestSite(messages, effort, signal, onThought, onContent) {
let receivedAny = false;
const trackThought = text => {
receivedAny = true;
onThought(text);
};
const trackContent = text => {
receivedAny = true;
onContent(text);
};
try {
return await streamCompletion(messages, effort, signal, trackThought, trackContent);
} catch (error) {
if (signal.aborted) throw error;
if (error instanceof ApiError && error.status === 400 && effort === "xhigh") {
return await streamCompletion(messages, "high", signal, trackThought, trackContent);
}
const transient = !receivedAny && (error instanceof TypeError || error?.code === "STREAM_TIMEOUT" || (error instanceof ApiError && error.status >= 500));
if (!transient) throw error;
await new Promise(resolve => window.setTimeout(resolve, 350));
if (signal.aborted) throw new DOMException("Aborted", "AbortError");
return await streamCompletion(messages, effort, signal, trackThought, trackContent);
}
}


async function generate(prompt) {
const controller = new AbortController();
request = controller;
const effort = levelFor(thinkingId).effort;
const messages = buildMessages(prompt);
const working = siteHtml ? "Applying your changes" : "Writing your site";
const onThought = text => queueLive(thoughtHeading(text));
const onContent = text => {
const parts = splitThoughts(text);
if (parts.thought) queueLive(thoughtHeading(parts.thought));
const size = parts.html.trim().length;
if (!size) return;
queueLive(working);
setMeta(`${formatSize(size)} written`);
};


try {
const raw = await requestSite(messages, effort, controller.signal, onThought, onContent);
if (request !== controller) return;
const html = extractHtml(raw);
if (!html) throw new Error("empty");
history = [...history, prompt].slice(-12);
showSite(html);
} catch (error) {
if (request !== controller || error?.name === "AbortError") return;
failBuild(describeError(error));
} finally {
if (request === controller) request = null;
}
}


function startBuild(step = 0) {
const prompt = input.value.trim();
if (state === "building" || leaving || !prompt) return;
apiKey = normalizeKey(loadText(API_KEY_KEY));
applyKey();
if (!apiKey) {
requestKey();
return;
}
closeMenu();
hideNotice();
setState("building");
setMeta("");
startStatus(siteHtml ? 0 : step, siteHtml ? editMessages : statusMessages);
generate(prompt);
}


function stopBuild() {
if (state !== "building") return;
const active = request;
request = null;
active?.abort();
cancelPendingFrame();
setMeta("");
setState(siteHtml ? "ready" : "idle");
input.focus();
}


function leaveForHome(event) {
if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
if (motionPreference.matches || !soften) return;
event.preventDefault();
if (leaving) return;
leaving = true;
request?.abort();
request = null;
cancelPendingFrame();
closeMenu();
hideTip();
hideNotice();
stopStatus();
render();
const frost = soften.animate([
{ opacity: 0, visibility: "visible", backdropFilter: SOFTEN_CLEAR },
{ opacity: 1, visibility: "visible", backdropFilter: SOFTEN_FROSTED }
], { duration: LEAVE_DURATION, easing: FROST_EASE, fill: "forwards" });
let navigated = false;
const go = () => {
if (navigated) return;
navigated = true;
window.location.assign(homeLink.href);
};
frost.onfinish = go;
window.setTimeout(go, LEAVE_DURATION + 120);
}


function restoreFromHistory(event) {
if (!event.persisted) return;
leaving = false;
soften?.getAnimations().forEach(animation => {
if (!(animation instanceof CSSAnimation)) animation.cancel();
});
apiKey = normalizeKey(loadText(API_KEY_KEY));
applyKey();
if (state === "building" && !request && !loadingHtml) setState(siteHtml ? "ready" : "idle");
render();
layoutFloats(false);
requestField();
}


function readHandoff() {
let saved = null;
try {
saved = JSON.parse(sessionStorage.getItem(HANDOFF_KEY) || "null");
sessionStorage.removeItem(HANDOFF_KEY);
} catch (error) {
saved = null;
}
if (saved?.at && Date.now() - saved.at > 300000) saved = null;
const params = new URLSearchParams(window.location.search);
const hadParams = params.has("prompt") || params.has("model") || params.has("thinking") || params.has("step");
const prompt = String(saved?.prompt || params.get("prompt") || "").trim();
const rawStep = Number.isInteger(saved?.step) ? saved.step : Number.parseInt(params.get("step") || "", 10);
const step = Number.isInteger(rawStep) ? rawStep + 1 : 0;
const rawModel = saved?.model || params.get("model") || "";
const rawThinking = saved?.thinking || params.get("thinking") || "";
if (hadParams) window.history.replaceState(null, "", window.location.pathname);
const model = MODELS.find(item => item.id === rawModel);
const thinking = model?.thinking.includes(rawThinking) ? rawThinking : "";
return { prompt, model: model?.id || "", thinking, step: clamp(step, 0, statusMessages.length - 1) };
}


input.addEventListener("input", render);
input.addEventListener("focus", () => closeMenu());
input.addEventListener("keydown", event => {
if (event.key === "Enter" && !event.isComposing) {
event.preventDefault();
startBuild();
}
});


action.addEventListener("click", () => {
if (state === "building") {
stopBuild();
} else if (input.value.trim()) {
startBuild();
} else {
input.focus();
}
});


keyInput?.addEventListener("input", () => {
apiKey = normalizeKey(keyInput.value);
saveChoice(API_KEY_KEY, apiKey);
modelMenu.classList.remove("is-attention");
applyKey();
});


notice?.addEventListener("click", hideNotice);


modelTrigger?.addEventListener("click", () => {
if (menuOpen) {
closeMenu();
} else {
openMenu();
}
});


modelTrigger?.addEventListener("keydown", event => {
if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
event.preventDefault();
openMenu(true);
});


modelMenu?.addEventListener("keydown", onMenuKey);


modelMenu?.addEventListener("focusout", event => {
if (!menuOpen || !event.relatedTarget) return;
if (modelMenu.contains(event.relatedTarget) || modelTrigger.contains(event.relatedTarget)) return;
closeMenu();
});


modelOptions.forEach(option => {
option.addEventListener("click", () => selectModel(option.dataset.model));
});


thinkingButtons.forEach(button => {
button.addEventListener("click", () => selectThinking(button.dataset.level));
});


document.addEventListener("pointerdown", event => {
tipBlocked = event.target.closest?.("[data-tooltip]") || null;
hideTip();
if (!menuOpen) return;
if (modelMenu.contains(event.target) || modelTrigger.contains(event.target)) return;
closeMenu();
}, true);


document.addEventListener("pointerover", event => {
if (event.pointerType === "touch" || drag?.started) return;
const target = event.target.closest?.("[data-tooltip]");
if (!target) {
if (tipTarget || tipPending) hideTip(false);
return;
}
if (target === tipBlocked) return;
queueTip(target, false);
});


document.addEventListener("pointerout", event => {
const target = event.target.closest?.("[data-tooltip]");
if (!target || target.contains(event.relatedTarget)) return;
if (target === tipBlocked) tipBlocked = null;
if (target === tipTarget || target === tipPending) hideTip(false);
});


document.addEventListener("focusin", event => {
const target = event.target.closest?.("[data-tooltip]");
if (target && target.matches(":focus-visible")) queueTip(target, true);
});


document.addEventListener("focusout", event => {
if (event.target === tipTarget || event.target === tipPending) hideTip(false);
});


document.addEventListener("keydown", event => {
if (event.key === "Escape") {
hideTip();
hideNotice();
}
});


window.addEventListener("storage", event => {
if (event.key === API_KEY_KEY) {
apiKey = normalizeKey(loadText(API_KEY_KEY));
applyKey();
} else if (event.key === MODEL_KEY || event.key === THINKING_KEY) {
modelId = loadChoice(MODEL_KEY, MODELS.map(model => model.id), MODELS[0].id);
thinkingId = loadChoice(THINKING_KEY, currentModel().thinking, currentModel().defaultThinking);
applyModel(false);
layoutFloats(true);
}
});


homeLink?.addEventListener("click", leaveForHome);
window.addEventListener("pageshow", restoreFromHistory);


window.addEventListener("pointermove", event => {
onFieldPointer(event);
onDragMove(event);
}, { passive: true });


window.addEventListener("pointerup", endDrag);
window.addEventListener("pointercancel", endDrag);


window.addEventListener("pointerout", event => {
if (!event.relatedTarget) releaseFieldPointer();
}, { passive: true });


window.addEventListener("blur", () => {
releaseFieldPointer();
closeMenu();
hideTip();
});


window.addEventListener("resize", () => {
hideTip();
body.classList.add("is-instant");
window.clearTimeout(instantTimer);
instantTimer = window.setTimeout(() => body.classList.remove("is-instant"), 160);
resizeField();
layoutFloats(false);
requestField();
}, { passive: true });


compactQuery.addEventListener?.("change", () => {
closeMenu();
layoutFloats(false);
setDevice(device, false);
});


document.fonts?.ready.then(() => {
applyModel(false);
layoutFloats(false);
});


resizeField();
if (statusText) statusText.textContent = statusMessages[0];


const handoff = readHandoff();
if (handoff.model) {
modelId = handoff.model;
saveChoice(MODEL_KEY, modelId);
}
if (handoff.thinking) {
thinkingId = handoff.thinking;
saveChoice(THINKING_KEY, thinkingId);
}
if (handoff.prompt) {
input.value = handoff.prompt;
}


applyModel(false);
applyKey();
layoutFloats(false);
setDevice("desktop", false);
render();


requestAnimationFrame(() => {
body.classList.add("is-ready");
if (handoff.prompt) startBuild(handoff.step);
});


window.GraphiteBuilder = {
setState,
setDevice,
resetLayout,
get state() {
return state;
},
get model() {
return modelId;
},
get thinking() {
return thinkingId;
},
get html() {
return siteHtml;
}
};
})();
