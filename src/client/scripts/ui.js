export let elements = {
  health: {
    // Health of the player
    display: document.getElementById("health"),
    label: "SUIT INTEGRITY",
    unit: "%",
    thresholds: [75, 50, 25, 0],
  },
  toolPower: {
    // Ammunition
    display: document.getElementById("toolPower"),
    label: "TOOL POWER",
    unit: "%",
    thresholds: [75, 50, 25, 0],
  },
  fps: {
    // Framerate
    display: document.getElementById("fps"),
    label: "SIM PERF",
    unit: "",
    thresholds: [45, 30, 15, 0],
  },
  groundDistance: {
    display: document.getElementById("groundDistance"),
    label: "Ground Distance",
    unit: "",
    thresholds: [10, 5, 1, 0.1],
  },
  gameState: {
    display: document.getElementById("gameState"),
    label: "State",
    unit: "",
    thresholds: ["ready", "loading_simulation", "connecting_to_server", "loading", "start"],
  },
  playerCount: {
    display: document.getElementById("playerCount"),
    label: "Connected Players",
    unit: "",
    thresholds: [3, 2, 1, 0],
  },
  renderer: {
    display: document.getElementById("rendererInfo"),
    label: "Renderer",
    unit: "",
    thresholds: ["WebGL", "WebGPU"],
  },
  netId: {
    display: document.getElementById("netId"),
    label: "Network ID",
    unit: "",
    thresholds: [-1],
  },
};

// Colors used for the state of a UI element
export let colors = ["lime", "yellow", "orange", "tomato"];

// Sets a UI element to a value
export function setElement(id, value) {
  elements[id].display.innerHTML = `${elements[id].label}: ${value}${elements[id].unit}`;
  if (elements[id].thresholds[0] < 0) {
    elements[id].display.style.color = "white";
    return;
  }

  for (let i = 0; i < elements[id].thresholds.length; i++) {
    if (value >= elements[id].thresholds[i]) {
      elements[id].display.style.color = colors[i];
      break;
    }
  }
}
