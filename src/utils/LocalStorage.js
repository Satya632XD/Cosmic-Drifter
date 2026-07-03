// src/utils/LocalStorage.js
export function saveData(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch(e) {}
}
export function loadData(key, defaultVal) {
    try { const d = localStorage.getItem(key); return d ? JSON.parse(d) : defaultVal; } catch(e) { return defaultVal; }
}
