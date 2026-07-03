// src/utils/MathUtils.js
export function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }
export function lerp(a,b,t) { return a + (b-a)*t; }
export function randomRange(min,max) { return Math.random()*(max-min)+min; }
