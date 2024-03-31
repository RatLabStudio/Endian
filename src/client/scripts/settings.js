export let settings = {
    "fov": 70,
    "resolution": 1,
    "post-processing": 1,
    "username": "User"
};
export let settingsKeys = Object.keys(settings);

export function saveAllSettings() {
    for (let i = 0; i < settingsKeys.length; i++) {
        saveSetting(settingsKeys[i], settings[settingsKeys[i]]);
    }
}

export function loadAllSettings() {
    for (let i = 0; i < settingsKeys.length; i++) {
        loadSetting(settingsKeys[i]);
    }
}

export function saveSetting(setting, value) {
    localStorage.setItem(setting, value);
}

export function loadSetting(setting) {
    if (localStorage.getItem(setting) != null) {
        settings[setting] = localStorage.getItem(setting);
    }
}