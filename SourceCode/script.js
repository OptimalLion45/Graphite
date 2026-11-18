(() => {
const input = document.querySelector(".prompt-box__input");
const placeholder = document.querySelector(".prompt-box__placeholder");
const box = document.querySelector(".prompt-box");
const action = document.querySelector(".prompt-box__action");
const statusText = document.querySelector(".prompt-box__status-text");
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
const logoBtn = document.querySelector(".logo-btn");
const stage = document.querySelector(".builder-entry");
const lensWrap = document.querySelector(".tagline-wrap");
const lensText = lensWrap?.querySelector(":scope > .tagline");
const taglineWordElements = Array.from(lensText?.querySelectorAll(".tagline__word") ?? []);
const cloneWordElements = Array.from(lensWrap?.querySelectorAll(".tagline-lens__view .tagline__word") ?? []);
const lensGlass = lensWrap?.querySelector(".tagline-lens__glass");
const lensRing = lensWrap?.querySelector(".tagline-lens__ring");
const soften = document.querySelector(".soften");
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const lensQuery = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 601px)");
const uaData = navigator.userAgentData;
const userAgent = navigator.userAgent;
const chromeBrand = uaData?.brands?.some(item => item.brand === "Google Chrome");
const isChrome = typeof chromeBrand === "boolean"
? chromeBrand
: /Chrome\/\d+/.test(userAgent) && !/Edg\/|OPR\/|Brave\//.test(userAgent);
const isDesktop = uaData
? !uaData.mobile && !/Android|iOS/i.test(uaData.platform || "")
: !/Android|iPhone|iPad|Mobile/i.test(userAgent);
const supportsLensPath = CSS.supports("clip-path", 'path(evenodd, "M0 0H10V10H0Z")');
const isChromeDesktop = isChrome && isDesktop && supportsLensPath;


if (!input || !placeholder || !box || !action) return;


const phrases = [
"What can Graphite build for you?",
"What should we build for you today?",
"What do you have in mind?",
"Describe your next website\u2026",
"A landing page, dashboard, or portfolio?",
"Tell Graphite what to create\u2026",
"Build something clean and modern\u2026",
"A personal site, product page, or tool?",
"What are we making today?",
"Sketch the idea. Graphite will build it."
];


const statusMessages = [
"Getting you set up",
"Creating your workspace",
"Reading your description",
"Planning the layout",
"Preparing your canvas",
"Almost ready"
];


const THINKING_LEVELS = [
{ id: "low", short: "Low", label: "Low" },
{ id: "med", short: "Med", label: "Medium" },
{ id: "high", short: "High", label: "High" },
{ id: "xhigh", short: "XHigh", label: "Extra high" }
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


const BUILDER_URL = "builder.html";
const HANDOFF_KEY = "graphite:handoff";
const MODEL_KEY = "graphite:model";
const THINKING_KEY = "graphite:thinking";
const API_KEY_KEY = "graphite:api-key";
const HANDOFF_DELAY = 2400;
const LEAVE_DURATION = 460;
const RELEASE_DURATION = 650;
const MENU_GAP = 10;
const TIP_DELAY = 500;
const TIP_WARM = 600;
const TIP_GAP = 8;
const LENS_ZOOM = 0.14;
const LENS_PAD = 0.2;
const LENS_MIN_RATIO = 1.45;
const LENS_LEAD = 520;
const LENS_TRAIL = 260;
const WORD_SPREAD = 0.22;
const WORD_CLEARANCE = 0.08;
const POP_DURATION = 340;
const POP_REST_SCALE = 0.94;
const REFRESH_OUT = 420;
const REFRESH_IN = 680;
const STATUS_STEP = 2800;
const STATUS_SWAP = 420;
const SOFTEN_CLEAR = "blur(0px) saturate(100%)";
const SOFTEN_FROSTED = "blur(14px) saturate(115%)";
const GLASS_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const FROST_EASE = "cubic-bezier(0.4, 0, 0.6, 1)";
const CLEAR_EASE = "cubic-bezier(0.4, 0, 0.2, 1)";


const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const lerp = (from, to, t) => from + (to - from) * t;
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
const easeInOutSine = t => -(Math.cos(Math.PI * t) - 1) / 2;
const px = value => value.toFixed(2);
const normalizeKey = value => String(value || "").trim().replace(/^Bearer\s+/i, "").trim();


let index = 0;
let timer = 0;
let swapTimer = 0;
let swapVersion = 0;
let locked = false;
let building = false;
let refreshing = false;
let leaving = false;
let fontsReady = false;
let loadFinished = !soften || motionPreference.matches;
let statusIndex = 0;
let statusTimer = 0;
let statusSwapTimer = 0;
let releaseTimer = 0;
let handoffTimer = 0;
let leaveFallbackTimer = 0;
let modelId = loadChoice(MODEL_KEY, MODELS.map(model => model.id), MODELS[0].id);
let thinkingId = loadChoice(THINKING_KEY, currentModel().thinking, currentModel().defaultThinking);
let apiKey = normalizeKey(loadText(API_KEY_KEY));
let menuOpen = false;
let tipTarget = null;
let tipPending = null;
let tipBlocked = null;
let tipTimer = 0;
let tipHiddenAt = 0;


const lens = {
state: "idle",
ready: false,
pending: false,
frame: 0,
last: 0,
px: 0,
py: 0,
pointerSeen: false,
rect: null,
words: [],
word: -1,
em: 16,
lineH: 0,
baseH: 0,
popStart: 0,
popFrom: null,
left: { value: 0, velocity: 0, target: 0, k: LENS_LEAD },
right: { value: 0, velocity: 0, target: 0, k: LENS_LEAD },
form: { value: 0, velocity: 0, target: 0, k: 240 }
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
{ duration: 240, easing: GLASS_EASE }
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


function selectModel(id) {
if (!MODELS.some(model => model.id === id) || id === modelId) return;
modelId = id;
saveChoice(MODEL_KEY, id);
if (!currentModel().thinking.includes(thinkingId)) thinkingId = currentModel().defaultThinking;
applyModel(true);
}


function selectThinking(id) {
if (!currentModel().thinking.includes(id) || id === thinkingId) return;
thinkingId = id;
saveChoice(THINKING_KEY, id);
applyModel(true);
}


function positionMenu() {
if (!modelTrigger || !modelMenu) return;
const anchor = box.getBoundingClientRect();
const trigger = modelTrigger.getBoundingClientRect();
const width = modelMenu.offsetWidth;
const height = modelMenu.offsetHeight;
const spaceBelow = window.innerHeight - anchor.bottom;
const below = spaceBelow >= height + MENU_GAP + 12 || spaceBelow >= anchor.top;
const left = clamp(anchor.right - width, 12, window.innerWidth - width - 12);
const top = below ? anchor.bottom + MENU_GAP : anchor.top - height - MENU_GAP;
modelMenu.dataset.side = below ? "below" : "above";
modelMenu.style.transformOrigin = `${(trigger.left + trigger.width / 2 - left).toFixed(1)}px ${below ? 0 : height}px`;
modelMenu.style.transform = `translate3d(${left.toFixed(1)}px, ${top.toFixed(1)}px, 0)`;
}


function openMenu(focusFirst = false) {
if (!modelTrigger || !modelMenu || menuOpen || modelTrigger.disabled) return;
menuOpen = true;
hideTip();
apiKey = normalizeKey(loadText(API_KEY_KEY));
applyModel(false);
applyKey();
positionMenu();
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
if (target.disabled) return false;
if (menuOpen && target === modelTrigger) return false;
return !leaving && !refreshing;
}


function placeTip(target) {
const rect = target.getBoundingClientRect();
const width = tooltip.offsetWidth;
const height = tooltip.offsetHeight;
const above = rect.top - height - TIP_GAP >= 8;
const left = clamp(rect.left + rect.width / 2 - width / 2, 8, window.innerWidth - width - 8);
const top = above ? rect.top - height - TIP_GAP : rect.bottom + TIP_GAP;
tooltip.dataset.side = above ? "above" : "below";
tooltip.style.transform = `translate3d(${left.toFixed(1)}px, ${top.toFixed(1)}px, 0)`;
}


function showTip(target) {
tipTimer = 0;
tipPending = null;
if (!canTip(target)) return;
tipTarget = target;
tooltip.textContent = target.dataset.tooltip;
placeTip(target);
tooltip.classList.add("is-visible");
}


function hideTip() {
window.clearTimeout(tipTimer);
tipTimer = 0;
tipPending = null;
if (tipTarget) tipHiddenAt = performance.now();
tipTarget = null;
tooltip?.classList.remove("is-visible");
}


function queueTip(target, immediate) {
if (target === tipTarget || target === tipPending) return;
const warm = Boolean(tipTarget) || performance.now() - tipHiddenAt < TIP_WARM;
hideTip();
if (immediate || warm) {
showTip(target);
return;
}
tipPending = target;
tipTimer = window.setTimeout(() => showTip(target), TIP_DELAY);
}


function refreshTip(target) {
if (tipTarget !== target) return;
tooltip.textContent = target.dataset.tooltip;
placeTip(target);
}


function pickNext() {
if (phrases.length < 2) return 0;
let next = Math.floor(Math.random() * phrases.length);
if (next === index) next = (next + 1) % phrases.length;
return next;
}


function resetPlaceholder() {
window.clearTimeout(swapTimer);
swapTimer = 0;
swapVersion += 1;
locked = false;
placeholder.classList.remove("is-leaving", "is-entering");
placeholder.textContent = phrases[0];
index = 0;
}


function setPhrase(next) {
if (locked || refreshing) return;
locked = true;
const version = ++swapVersion;
placeholder.classList.remove("is-entering");
placeholder.classList.add("is-leaving");


swapTimer = window.setTimeout(() => {
if (version !== swapVersion) return;
placeholder.textContent = phrases[next];
placeholder.classList.remove("is-leaving");
placeholder.classList.add("is-entering");
requestAnimationFrame(() => {
requestAnimationFrame(() => {
if (version !== swapVersion) return;
placeholder.classList.remove("is-entering");
index = next;
locked = false;
swapTimer = 0;
});
});
}, 700);
}


function cycle() {
if (box.classList.contains("has-value") || document.activeElement === input || building || refreshing) return;
setPhrase(pickNext());
}


function startCycle() {
stopCycle();
timer = window.setInterval(cycle, 9000);
}


function stopCycle() {
if (timer) {
window.clearInterval(timer);
timer = 0;
}
}


function restartShimmer() {
statusText?.getAnimations?.().forEach(animation => {
if (animation.animationName === "status-shimmer") animation.currentTime = 0;
});
}


function releaseShimmer() {
if (!statusText) return;
window.clearTimeout(releaseTimer);
statusText.classList.add("is-releasing");
releaseTimer = window.setTimeout(() => statusText.classList.remove("is-releasing"), RELEASE_DURATION);
}


function stopStatus() {
window.clearTimeout(statusTimer);
window.clearTimeout(statusSwapTimer);
statusTimer = 0;
statusSwapTimer = 0;
}


function scheduleStatus() {
if (statusIndex < statusMessages.length - 1) {
statusTimer = window.setTimeout(advanceStatus, STATUS_STEP);
}
}


function advanceStatus() {
statusTimer = 0;
if (!building || !statusText) return;
const next = statusIndex + 1;
if (next >= statusMessages.length) return;


if (motionPreference.matches) {
statusIndex = next;
statusText.textContent = statusMessages[next];
scheduleStatus();
return;
}


statusText.classList.remove("is-entering");
statusText.classList.add("is-leaving");


statusSwapTimer = window.setTimeout(() => {
statusSwapTimer = 0;
if (!building) return;
statusIndex = next;
statusText.textContent = statusMessages[next];
statusText.classList.remove("is-leaving");
statusText.classList.add("is-entering");
restartShimmer();
requestAnimationFrame(() => {
requestAnimationFrame(() => {
if (!building) return;
statusText.classList.remove("is-entering");
});
});
scheduleStatus();
}, STATUS_SWAP);
}


function startStatus() {
if (!statusText) return;
stopStatus();
window.clearTimeout(releaseTimer);
statusIndex = 0;
statusText.classList.remove("is-leaving", "is-entering", "is-releasing");
statusText.textContent = statusMessages[0];
restartShimmer();
scheduleStatus();
}


function render() {
const hasValue = input.value.trim().length > 0;
const label = building ? "Stop" : "Build";
box.classList.toggle("has-value", hasValue);
box.classList.toggle("is-building", building);
input.readOnly = building;
action.setAttribute("aria-label", label);
action.dataset.tooltip = label;
refreshTip(action);
if (modelTrigger) modelTrigger.disabled = building || leaving;
if (modelTrigger?.disabled && tipTarget === modelTrigger) hideTip();
}


function cancelHandoff() {
window.clearTimeout(handoffTimer);
window.clearTimeout(leaveFallbackTimer);
handoffTimer = 0;
leaveFallbackTimer = 0;
}


function builderUrl(prompt, step) {
const payload = { prompt, step, model: modelId, thinking: thinkingId, at: Date.now() };
let stored = false;
try {
sessionStorage.setItem(HANDOFF_KEY, JSON.stringify(payload));
stored = sessionStorage.getItem(HANDOFF_KEY) !== null;
} catch (error) {
stored = false;
}
if (stored && window.location.protocol !== "file:") return BUILDER_URL;
const params = new URLSearchParams({
prompt,
step: String(step),
model: modelId,
thinking: thinkingId
});
return `${BUILDER_URL}?${params.toString()}`;
}


function leaveForBuilder() {
handoffTimer = 0;
if (!building || leaving || refreshing) return;
leaving = true;
closeMenu();
hideTip();
stopCycle();
haltLens();
render();


const url = builderUrl(input.value.trim(), statusIndex);
let navigated = false;
const go = () => {
if (navigated) return;
navigated = true;
window.clearTimeout(leaveFallbackTimer);
window.location.assign(url);
};


if (motionPreference.matches || !soften) {
go();
return;
}


const frost = soften.animate([
{ opacity: 0, visibility: "visible", backdropFilter: SOFTEN_CLEAR },
{ opacity: 1, visibility: "visible", backdropFilter: SOFTEN_FROSTED }
], { duration: LEAVE_DURATION, easing: FROST_EASE, fill: "forwards" });


stage?.animate(
[{ transform: "scale(1)" }, { transform: "scale(0.985)" }],
{ duration: LEAVE_DURATION, easing: FROST_EASE, fill: "forwards" }
);


frost.onfinish = go;
leaveFallbackTimer = window.setTimeout(go, LEAVE_DURATION + 120);
}


function startBuild() {
if (building || leaving || !input.value.trim()) return;
apiKey = normalizeKey(loadText(API_KEY_KEY));
applyKey();
if (!apiKey) {
requestKey();
return;
}
closeMenu();
building = true;
stopCycle();
render();
startStatus();
cancelHandoff();
handoffTimer = window.setTimeout(leaveForBuilder, motionPreference.matches ? 600 : HANDOFF_DELAY);
}


function stopBuild() {
if (!building || leaving) return;
building = false;
cancelHandoff();
stopStatus();
releaseShimmer();
render();
input.focus();
}


function measureLens() {
if (!lensWrap || !lensText || !taglineWordElements.length) return;
lens.rect = lensWrap.getBoundingClientRect();
lens.em = parseFloat(getComputedStyle(lensWrap).fontSize) || 16;
lens.lineH = lensText.getBoundingClientRect().height;
lens.baseH = lens.em * 1.4;
lens.words = taglineWordElements.map(element => ({
left: element.offsetLeft,
right: element.offsetLeft + element.offsetWidth
}));
}


function setWordSpacing(activeIndex, lensLeft = 0, lensRight = 0) {
const minSpread = lens.em * WORD_SPREAD;
const clearance = lens.em * WORD_CLEARANCE;
const prev = lens.words[activeIndex - 1];
const next = lens.words[activeIndex + 1];
const before = activeIndex < 0 || !prev ? 0 : Math.max(minSpread, prev.right - lensLeft + clearance);
const after = activeIndex < 0 || !next ? 0 : Math.max(minSpread, lensRight + clearance - next.left);


taglineWordElements.forEach((element, wordIndex) => {
const shift = activeIndex < 0 ? 0 : wordIndex < activeIndex ? -before : wordIndex > activeIndex ? after : 0;
const value = `${px(shift)}px`;
element.style.setProperty("--word-shift", value);
cloneWordElements[wordIndex]?.style.setProperty("--word-shift", value);
});
}


function restoreWordSpacing() {
setWordSpacing(-1);
}


function inZone(x, y) {
if (!lens.rect) return false;
const rect = lens.rect;
return x > rect.left - lens.em * 0.4 &&
x < rect.right + lens.em * 0.4 &&
y > rect.top - lens.em * 0.25 &&
y < rect.bottom + lens.em * 0.25;
}


function pickWord(x) {
if (!lens.words.length) return -1;
for (let i = 0; i < lens.words.length - 1; i += 1) {
const edge = (lens.words[i].right + lens.words[i + 1].left) / 2;
const bias = i < lens.word ? -lens.em * 0.16 : lens.em * 0.16;
if (x < edge + bias) return i;
}
return lens.words.length - 1;
}


function targetWord(wordIndex) {
if (wordIndex < 0 || wordIndex === lens.word) return;
const word = lens.words[wordIndex];
if (!word) return;


const padding = lens.em * LENS_PAD + (word.right - word.left) * LENS_ZOOM / 2;
const minWidth = lens.baseH * LENS_MIN_RATIO;
let left = word.left - padding;
let right = word.right + padding;


if (right - left < minWidth) {
const middle = (left + right) / 2;
left = middle - minWidth / 2;
right = middle + minWidth / 2;
}


setWordSpacing(wordIndex, left, right);


const movingForward = wordIndex > lens.word;
lens.left.k = movingForward ? LENS_TRAIL : LENS_LEAD;
lens.right.k = movingForward ? LENS_LEAD : LENS_TRAIL;
lens.left.target = left;
lens.right.target = right;
lens.word = wordIndex;
}


function stepSpring(spring, delta) {
const damping = 2 * Math.sqrt(spring.k);
spring.velocity += (spring.k * (spring.target - spring.value) - damping * spring.velocity) * delta;
spring.value += spring.velocity * delta;
}


function settle(spring, epsilon) {
if (Math.abs(spring.target - spring.value) > epsilon || Math.abs(spring.velocity) > epsilon * 20) return false;
spring.value = spring.target;
spring.velocity = 0;
return true;
}


function capsulePath(left, top, width, height) {
const radius = height / 2;
return `M${px(left + radius)} ${px(top)}H${px(left + width - radius)}A${px(radius)} ${px(radius)} 0 0 1 ${px(left + width - radius)} ${px(top + height)}H${px(left + radius)}A${px(radius)} ${px(radius)} 0 0 1 ${px(left + radius)} ${px(top)}Z`;
}


function formVisual(form) {
return { mag: form, glass: POP_REST_SCALE + (1 - POP_REST_SCALE) * form, opacity: form };
}


function popVisual(t) {
const from = lens.popFrom;
const relax = easeOutCubic(t);
const fade = easeInOutSine(t);
return {
mag: from.mag * (1 - relax),
glass: lerp(from.glass, POP_REST_SCALE, fade),
opacity: from.opacity * (1 - fade)
};
}


function paintLens(visual = formVisual(clamp(lens.form.value, 0, 1))) {
const minWidth = lens.baseH * LENS_MIN_RATIO;
const left = lens.left.value;
const width = Math.max(lens.right.value - left, minWidth);
const restWidth = Math.max(lens.right.target - lens.left.target, minWidth);
const stretch = clamp((width - restWidth) / restWidth, 0, 0.5);
const height = lens.baseH * (1 - stretch * 0.06);
const glass = clamp(visual.glass, 0.5, 1);
const holeW = width * glass;
const holeH = height * glass;
const holeLeft = left + (width - holeW) / 2;
const holeTop = (lens.lineH - holeH) / 2;
const outerW = px(lens.rect.width + 200);
const outerH = px(lens.lineH + 200);


lensWrap.style.setProperty("--lens-x", `${px(left)}px`);
lensWrap.style.setProperty("--lens-w", `${px(width)}px`);
lensWrap.style.setProperty("--lens-h", `${px(height)}px`);
lensWrap.style.setProperty("--lens-s", (1 + clamp(visual.mag, 0, 1) * LENS_ZOOM).toFixed(4));
lensWrap.style.setProperty("--lens-o", clamp(visual.opacity, 0, 1).toFixed(3));
lensWrap.style.setProperty("--lens-g", glass.toFixed(4));
lensText.style.clipPath = `path(evenodd, "M-200 -200H${outerW}V${outerH}H-200Z ${capsulePath(holeLeft, holeTop, holeW, holeH)}")`;
}


function requestLens() {
if (lens.state !== "active" || lens.frame || !lens.ready || motionPreference.matches) return;
lens.frame = window.requestAnimationFrame(tickLens);
}


function tickLens(timestamp) {
const delta = lens.last ? Math.min((timestamp - lens.last) / 1000, 0.05) : 1 / 60;
lens.last = timestamp;
const steps = Math.max(1, Math.ceil(delta * 240));


for (let step = 0; step < steps; step += 1) {
const substep = delta / steps;
stepSpring(lens.left, substep);
stepSpring(lens.right, substep);
stepSpring(lens.form, substep);
}


const done = [
settle(lens.left, 0.05),
settle(lens.right, 0.05),
settle(lens.form, 0.001)
].every(Boolean);


paintLens();
lens.frame = done ? 0 : window.requestAnimationFrame(tickLens);
if (!lens.frame) lens.last = 0;
}


function cancelLensFrame() {
if (lens.frame) {
window.cancelAnimationFrame(lens.frame);
lens.frame = 0;
}
lens.last = 0;
}


function canLens() {
return lens.ready && !refreshing && !leaving && lensQuery.matches && !motionPreference.matches;
}


function formLens() {
if (lens.state !== "idle" || !lens.words.length) return;
lens.state = "active";
lens.word = -1;
targetWord(pickWord(lens.px - lens.rect.left));


for (const spring of [lens.left, lens.right]) {
spring.value = spring.target;
spring.velocity = 0;
}


lens.form.value = 0;
lens.form.velocity = 0;
lens.form.target = 1;
lensWrap.classList.add("is-lensing");
paintLens();
requestLens();
}


function finishPop(allowResume = true) {
cancelLensFrame();
lens.state = "idle";
lens.word = -1;
lens.popFrom = null;
lens.form.value = 0;
lens.form.velocity = 0;
lens.form.target = 0;
lensWrap.classList.remove("is-lensing");
lensText.style.clipPath = "";
lensWrap.style.setProperty("--lens-s", "1");
lensWrap.style.setProperty("--lens-o", "0");
lensWrap.style.setProperty("--lens-g", "1");


const shouldResume = allowResume && lens.pending && canLens() && inZone(lens.px, lens.py);
lens.pending = false;


if (shouldResume) {
formLens();
} else {
restoreWordSpacing();
}
}


function stepPop(timestamp) {
if (!lens.popStart) lens.popStart = timestamp;
const t = clamp((timestamp - lens.popStart) / POP_DURATION, 0, 1);
paintLens(popVisual(t));


if (t < 1) {
lens.frame = window.requestAnimationFrame(stepPop);
return;
}


lens.frame = 0;
finishPop();
}


function popLens() {
if (lens.state !== "active") return;
if (motionPreference.matches) {
finishPop(false);
return;
}


cancelLensFrame();
lens.state = "popping";
lens.pending = false;
lens.popStart = 0;
lens.popFrom = formVisual(clamp(lens.form.value, 0, 1));
restoreWordSpacing();
lens.frame = window.requestAnimationFrame(stepPop);
}


function haltLens() {
if (!lensWrap || !lensText) return;
lens.pending = false;
cancelLensFrame();
if (lens.state !== "idle") finishPop(false);
}


function onLensPointer(x, y) {
lens.px = x;
lens.py = y;
if (!canLens() || !lens.rect) return;
const inside = inZone(x, y);


if (lens.state === "popping") {
lens.pending = inside;
} else if (inside && lens.state === "idle") {
formLens();
} else if (inside && lens.state === "active") {
const nextWord = pickWord(x - lens.rect.left);
if (nextWord !== lens.word) {
targetWord(nextWord);
requestLens();
}
} else if (!inside && lens.state === "active") {
popLens();
}
}


function enableLens() {
if (!lensWrap || !lensText || !lensGlass || !lensRing || !isChromeDesktop || motionPreference.matches) return;
measureLens();
lens.ready = true;
if (lens.pointerSeen) onLensPointer(lens.px, lens.py);
}


function maybeEnableLens() {
if (fontsReady && loadFinished) enableLens();
}


function resetState() {
const wasBuilding = building;
building = false;
cancelHandoff();
stopStatus();
if (wasBuilding) releaseShimmer();
input.value = "";
input.blur();
resetPlaceholder();
render();
}


function finishRefresh() {
refreshing = false;
startCycle();
measureLens();
if (lens.pointerSeen) onLensPointer(lens.px, lens.py);
}


function resetPage() {
if (refreshing || leaving) return;
closeMenu();
hideTip();
if (lens.state === "active") popLens();
refreshing = true;
lens.pending = false;
stopCycle();


if (motionPreference.matches || !soften) {
resetState();
finishRefresh();
return;
}


const total = REFRESH_OUT + REFRESH_IN;
const peak = REFRESH_OUT / total;
let stateReset = false;
const swapState = () => {
if (stateReset) return;
stateReset = true;
resetState();
};


const softening = soften.animate([
{ opacity: 0, visibility: "visible", backdropFilter: SOFTEN_CLEAR, easing: FROST_EASE },
{ opacity: 1, visibility: "visible", backdropFilter: SOFTEN_FROSTED, offset: peak, easing: CLEAR_EASE },
{ opacity: 0, visibility: "visible", backdropFilter: SOFTEN_CLEAR }
], { duration: total });


stage?.animate([
{ transform: "scale(1)", easing: FROST_EASE },
{ transform: "scale(0.985)", offset: peak, easing: CLEAR_EASE },
{ transform: "scale(1)" }
], { duration: total });


window.setTimeout(swapState, REFRESH_OUT);
softening.onfinish = () => {
swapState();
finishRefresh();
};
}


function restoreFromHistory(event) {
if (!event.persisted) return;
leaving = false;
refreshing = false;
soften?.getAnimations().forEach(animation => {
if (!(animation instanceof CSSAnimation)) animation.cancel();
});
stage?.getAnimations().forEach(animation => animation.cancel());
apiKey = normalizeKey(loadText(API_KEY_KEY));
applyKey();
resetState();
finishRefresh();
}


function onResize() {
hideTip();
if (menuOpen) positionMenu();
if (refreshing) return;
measureLens();
if (lens.state !== "active" || !lens.words.length) return;
if (!inZone(lens.px, lens.py)) {
popLens();
return;
}
lens.word = -1;
targetWord(pickWord(lens.px - lens.rect.left));
requestLens();
}


input.addEventListener("input", () => {
render();
if (input.value.trim().length > 0) {
stopCycle();
} else if (document.activeElement !== input) {
startCycle();
}
});


input.addEventListener("focus", () => {
stopCycle();
closeMenu();
});


input.addEventListener("blur", () => {
if (!input.value.trim() && !building && !refreshing && !leaving) startCycle();
});


input.addEventListener("keydown", event => {
if (event.key === "Enter" && !event.isComposing) {
event.preventDefault();
startBuild();
}
});


action.addEventListener("click", () => {
if (building) {
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
if (event.pointerType === "touch") return;
const target = event.target.closest?.("[data-tooltip]");
if (!target) {
if (tipTarget || tipPending) hideTip();
return;
}
if (target === tipBlocked) return;
queueTip(target, false);
});


document.addEventListener("pointerout", event => {
const target = event.target.closest?.("[data-tooltip]");
if (!target || target.contains(event.relatedTarget)) return;
if (target === tipBlocked) tipBlocked = null;
if (target === tipTarget || target === tipPending) hideTip();
});


document.addEventListener("focusin", event => {
const target = event.target.closest?.("[data-tooltip]");
if (target && target.matches(":focus-visible")) queueTip(target, true);
});


document.addEventListener("focusout", event => {
if (event.target === tipTarget || event.target === tipPending) hideTip();
});


document.addEventListener("keydown", event => {
if (event.key === "Escape") hideTip();
});


logoBtn?.addEventListener("click", resetPage);


window.addEventListener("storage", event => {
if (event.key === API_KEY_KEY) {
apiKey = normalizeKey(loadText(API_KEY_KEY));
applyKey();
} else if (event.key === MODEL_KEY || event.key === THINKING_KEY) {
modelId = loadChoice(MODEL_KEY, MODELS.map(model => model.id), MODELS[0].id);
thinkingId = loadChoice(THINKING_KEY, currentModel().thinking, currentModel().defaultThinking);
applyModel(false);
}
});


window.addEventListener("pointermove", event => {
if (event.pointerType !== "mouse") return;
lens.pointerSeen = true;
onLensPointer(event.clientX, event.clientY);
}, { passive: true });


window.addEventListener("pointerout", event => {
if (!event.relatedTarget && lens.state === "active") popLens();
}, { passive: true });


window.addEventListener("resize", onResize, { passive: true });
window.addEventListener("scroll", onResize, { passive: true });
window.addEventListener("pageshow", restoreFromHistory);


document.fonts.ready.then(() => {
fontsReady = true;
measureLens();
maybeEnableLens();
applyModel(false);
});


if (soften && !motionPreference.matches) {
soften.addEventListener("animationend", event => {
if (event.target !== soften || event.animationName !== "soften-reveal") return;
loadFinished = true;
maybeEnableLens();
}, { once: true });
}


document.addEventListener("visibilitychange", () => {
if (!document.hidden) return;
haltLens();
closeMenu();
hideTip();
});


lensQuery.addEventListener?.("change", () => {
if (!lensQuery.matches) {
haltLens();
return;
}
measureLens();
if (lens.pointerSeen) onLensPointer(lens.px, lens.py);
});


motionPreference.addEventListener?.("change", () => {
if (motionPreference.matches) {
lens.ready = false;
haltLens();
} else {
loadFinished = true;
measureLens();
maybeEnableLens();
}
});


placeholder.textContent = phrases[0];
if (statusText) statusText.textContent = statusMessages[0];
applyModel(false);
applyKey();
render();
startCycle();
})();
