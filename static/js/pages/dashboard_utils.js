/**
 * Shared dashboard utilities.
 */

/**
 * Escapes HTML special characters to prevent XSS.
 */
function escapeHTML(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Animates a numerical value from start to end over a duration.
 * @param {string} id - The ID of the element to update.
 * @param {number} start - The starting value.
 * @param {number} end - The ending value.
 * @param {number} duration - The duration of the animation in ms.
 * @param {string} suffix - Optional suffix (e.g., '%').
 * @param {number} decimals - Number of decimal places to show.
 */
function animateValue(id, start, end, duration, suffix = "", decimals = 0) {
    const obj = document.getElementById(id);
    if (!obj) return;

    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const current = (progress * (end - start) + start).toFixed(decimals);
        obj.innerHTML = current + suffix;
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            obj.innerHTML = end.toFixed(decimals) + suffix;
        }
    };
    window.requestAnimationFrame(step);
}

function clampNumber(value, min = 0, max = 100) {
    const num = Number(value);
    if (!Number.isFinite(num)) return min;
    return Math.max(min, Math.min(max, num));
}

function formatHeuristicScore(value, options = {}) {
    const { suffix = "%", empty = "--", min = 5, max = 95, plusAtMax = true } = options;
    const num = Number(value);
    if (!Number.isFinite(num)) return empty;
    const rounded = Math.round(clampNumber(num, min, max));
    return plusAtMax && rounded >= max ? `${max}+${suffix}` : `${rounded}${suffix}`;
}

function clampHeuristicScore(value, min = 5, max = 95) {
    return Math.round(clampNumber(value, min, max));
}

function clampVisualPercent(value, options = {}) {
    const { min = 2, max = 98 } = options;
    return clampNumber(value, min, max);
}

function formatDeterministicShare(value, denominator, options = {}) {
    const { suffix = "%", empty = "--" } = options;
    const num = Number(value);
    if (!Number.isFinite(num)) return empty;
    const rounded = Math.round(clampNumber(num, 0, 100));
    const count = Number(denominator);
    return Number.isFinite(count) && count > 0 ? `${rounded}${suffix} of ${count.toLocaleString()}` : `${rounded}${suffix}`;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { escapeHTML, animateValue, clampNumber, formatHeuristicScore, clampHeuristicScore, clampVisualPercent, formatDeterministicShare };
}
