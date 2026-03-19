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

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { escapeHTML, animateValue };
}
