const colors = [
  { hex: "#fec600", name: "暖黄" },
  { hex: "#ff6a13", name: "橙" },
  { hex: "#0086d6", name: "青" },
  { hex: "#becf00", name: "苹果绿" },
  { hex: "#5e43b7", name: "紫" },
  { hex: "#482960", name: "绀紫" },
  { hex: "#00b1b7", name: "松石绿" },
  { hex: "#f5547c", name: "桃红" },
  { hex: "#9d2235", name: "胭脂红" },
  { hex: "#3f8e43", name: "圣诞绿" },
];

const components = {
  c1: { id: "c1", number: "H3", name: "H3", height: 4, closure: "bottom" },
  c2: { id: "c2", number: "H1", name: "H1", height: 0.8, closure: "open" },
  c3: { id: "c3", number: "H2", name: "H2", height: 2.2, closure: "open" },
  c4: { id: "c4", number: "H4", name: "H4", height: 8, closure: "top" },
};

const componentTabOrder = ["c2", "c3", "c1", "c4"];

const defaultState = {
  version: 2,
  order: ["c4", "c2", "c3", "c1"],
  activeId: "c1",
  lighting: false,
  colors: {
    c1: "#ff6a13",
    c2: "#fec600",
    c3: "#00b1b7",
    c4: "#5e43b7",
  },
};

let state = loadState();

const lampPreview = document.querySelector("#lampPreview");
const swatchGrid = document.querySelector("#swatchGrid");
const segmentTabs = document.querySelector("#segmentTabs");
const activeSegmentLabel = document.querySelector("#activeSegmentLabel");
const lightingToggle = document.querySelector("#toggleLighting");
const toast = document.querySelector("#toast");

function loadState() {
  const saved = window.localStorage.getItem("lamp-configurator-state");
  if (!saved) return structuredClone(defaultState);

  try {
    const parsed = JSON.parse(saved);
    if (parsed.version !== defaultState.version) return structuredClone(defaultState);
    return {
      ...structuredClone(defaultState),
      ...parsed,
      colors: { ...defaultState.colors, ...parsed.colors },
    };
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  window.localStorage.setItem("lamp-configurator-state", JSON.stringify(state));
}

function formatCm(value) {
  return Number.isInteger(value) ? `${value}cm` : `${value.toFixed(1)}cm`;
}

function getColorName(hex) {
  return colors.find((item) => item.hex === hex)?.name ?? hex;
}

function canSwap(a, b) {
  const pair = [a, b].sort().join("-");
  return pair === "c1-c4" || pair === "c2-c3";
}

function swapComponents(idA, idB) {
  if (!canSwap(idA, idB)) return;
  const order = [...state.order];
  const indexA = order.indexOf(idA);
  const indexB = order.indexOf(idB);
  order[indexA] = idB;
  order[indexB] = idA;
  state.order = order;
  saveState();
  render();
}

function setActive(id) {
  state.activeId = id;
  saveState();
  render();
}

function setColor(hex) {
  state.colors[state.activeId] = hex;
  saveState();
  render();
}

function renderLamp() {
  lampPreview.style.setProperty("--top-color", state.colors[state.order[0]]);
  const scale = lampPreview.offsetWidth / 8 || 22;
  lampPreview.innerHTML = state.order.map((id, index) => {
    const component = components[id];
    const color = state.colors[id];
    const height = component.height * scale;
    const isTop = index === 0;
    const isBottom = index === state.order.length - 1;
    const closureLabel = isTop ? "带顶" : isBottom ? "带底" : "不带顶和底圆环";

    return `
      <button
        class="segment ${isTop ? "is-top" : ""} ${isBottom ? "is-bottom" : ""} ${state.activeId === id ? "active" : ""}"
        style="--segment-color: ${color}; --segment-glow: ${color}; height: ${height}px; z-index: ${state.order.length - index};"
        type="button"
        aria-label="${component.name}，${formatCm(component.height)}，${getColorName(color)}，${closureLabel}"
        data-id="${id}"
      >
        <span class="segment-label">${component.name} ${formatCm(component.height)}</span>
      </button>
    `;
  }).join("");

  lampPreview.querySelectorAll(".segment").forEach((segment) => {
    segment.addEventListener("click", () => setActive(segment.dataset.id));
  });
}

function renderSegmentTabs() {
  segmentTabs.innerHTML = componentTabOrder.map((id) => {
    const component = components[id];
    return `
    <button class="segment-tab ${state.activeId === component.id ? "active" : ""}" type="button" data-id="${component.id}">
      ${component.name}
    </button>
  `;
  }).join("");

  segmentTabs.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => setActive(button.dataset.id));
  });
}

function renderSwatches() {
  const activeColor = state.colors[state.activeId];
  swatchGrid.innerHTML = colors.map((color) => `
    <button class="swatch-button ${activeColor === color.hex ? "active" : ""}" type="button" data-color="${color.hex}" aria-label="${color.name} ${color.hex}">
      <span class="swatch-chip" style="--swatch: ${color.hex};"></span>
      <span>${color.name}</span>
    </button>
  `).join("");

  swatchGrid.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => setColor(button.dataset.color));
  });
}

function renderActiveLabel() {
  const component = components[state.activeId];
  const color = state.colors[state.activeId];
  activeSegmentLabel.textContent = `当前：${component.name} · ${getColorName(color)}`;
}

function renderLightingMode() {
  document.body.classList.toggle("lighting-view", state.lighting);
  lightingToggle.classList.toggle("active", state.lighting);
  lightingToggle.setAttribute("aria-pressed", String(state.lighting));
}

function render() {
  renderLightingMode();
  renderLamp();
  renderSegmentTabs();
  renderSwatches();
  renderActiveLabel();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2200);
}

document.querySelector("#swapCaps").addEventListener("click", () => {
  swapComponents("c1", "c4");
  showToast("已交换 H3 和 H4，顶底方向同步互换。");
});

document.querySelector("#swapRings").addEventListener("click", () => {
  swapComponents("c2", "c3");
  showToast("已交换 H1 和 H2。");
});

lightingToggle.addEventListener("click", () => {
  state.lighting = !state.lighting;
  saveState();
  render();
  showToast(state.lighting ? "Lighting 视图已开启。" : "Lighting 视图已关闭。");
});

document.querySelector("#saveConfig").addEventListener("click", () => {
  saveState();
  const summary = state.order
    .map((id) => `${components[id].name}:${getColorName(state.colors[id])}`)
    .join(" / ");
  showToast(`配置已保存：${summary}`);
});

document.querySelector("#resetConfig").addEventListener("click", () => {
  state = structuredClone(defaultState);
  saveState();
  render();
  showToast("已重置为默认组合。");
});

let resizeFrame = 0;
window.addEventListener("resize", () => {
  window.cancelAnimationFrame(resizeFrame);
  resizeFrame = window.requestAnimationFrame(renderLamp);
});

render();
