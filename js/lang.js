// FULL FILE — lang.js
import { supabase } from "./config.js";

const DEFAULT_LANG = "en";

// Load saved language or detect
export function getLanguage() {
    return localStorage.getItem("lang") || DEFAULT_LANG;
}

// Switch language
export function setLanguage(lang) {
    localStorage.setItem("lang", lang);
    applyLanguage(lang);
}

// Apply translations
export async function applyLanguage(lang = getLanguage()) {
    const url = `./translations/${lang}.json`;
    const res = await fetch(url);
    const translations = await res.json();

    // Update text for all elements with data-i18n=""
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (translations[key]) el.innerHTML = translations[key];
    });

    // RTL/LTR switch
    if (lang === "ar") {
        document.documentElement.setAttribute("dir", "rtl");
        document.body.style.fontFamily = "'Tajawal', sans-serif";
    } else {
        document.documentElement.setAttribute("dir", "ltr");
        document.body.style.fontFamily = "'Inter', sans-serif";
    }
}

// Initialize translation system
document.addEventListener("DOMContentLoaded", () => {
    applyLanguage();
});

// Helper for HTML toggle button
window.setLanguage = setLanguage;
