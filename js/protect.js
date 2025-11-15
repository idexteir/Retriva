// protect.js — FINAL VERSION WITH STRONG BAN + CLEAN ROUTING
import { supabase } from "./config.js";
import { checkBanStatus } from "./auth.js";

// Loader safety (in case header.js hasn't loaded yet)
function hideLoader() {
    const overlay = document.getElementById("loading-overlay");
    if (overlay) overlay.style.display = "none";
}

/**
 * Basic login requirement — used in most protected pages.
 */
export async function requireLogin() {
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;

    if (!session) {
        window.location.href = "login.html";
        return;
    }

    // STRONG BAN ENFORCEMENT
    await checkBanStatus(session.user.id);

    hideLoader();
}

/**
 * Manager or Admin Access
 */
export async function requireManager() {
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;

    if (!session) {
        window.location.href = "login.html";
        return;
    }

    await checkBanStatus(session.user.id);

    const { data } = await supabase
        .from("users")
        .select("role")
        .eq("id", session.user.id)
        .single();

    if (data.role !== "manager" && data.role !== "admin") {
        alert("Access denied");
        window.location.href = "/";
        return;
    }

    hideLoader();
}

/**
 * Admin Access Only
 */
export async function requireAdmin() {
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;

    if (!session) {
        window.location.href = "login.html";
        return;
    }

    await checkBanStatus(session.user.id);

    const { data } = await supabase
        .from("users")
        .select("role")
        .eq("id", session.user.id)
        .single();

    if (data.role !== "admin") {
        alert("Admin only");
        window.location.href = "/";
        return;
    }

    hideLoader();
}
