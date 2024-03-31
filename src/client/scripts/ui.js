export let elements = {
    health: {
        display: document.getElementById("health"),
        label: 'SUIT INTEGRITY',
        unit: "%",
        thresholds: [75, 50, 25, 0]
    },
    toolPower: {
        display: document.getElementById("toolPower"),
        label: 'TOOL POWER',
        unit: "%",
        thresholds: [75, 50, 25, 0]
    },
    fps: {
        display: document.getElementById("fps"),
        label: 'SIM PERF',
        unit: "",
        thresholds: [45, 30, 15, 0]
    }
};

export let colors = [
    'lime',
    'yellow',
    'orange',
    'tomato'
]

export function setElement(id, value) {
    elements[id].display.innerHTML = `${elements[id].label}: ${value}${elements[id].unit}`;
    for (let i = 0; i < elements[id].thresholds.length; i++) {
        if (value >= elements[id].thresholds[i]) {
            elements[id].display.style.color = colors[i];
            break;
        }
    }
}