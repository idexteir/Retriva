// protect.js — FINAL VERSION WITH BAN ENFORCEMENT

import { supabase } from "./config.js";
import { checkBanStatus } from "./auth.js";

export async function requireLogin() {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
        window.location.href = "login.html";
        return;
    }

    // 🔥 Auto logout if banned
    await checkBanStatus(session.session.user.id);
}

export async function requireManager() {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) window.location.href = "login.html";

    await checkBanStatus(session.session.user.id); // 🔥 enforce ban

    const { data } = await supabase.from("users")
        .select("role")
        .eq("id", session.session.user.id)
        .single();

    if (data.role !== "manager" && data.role !== "admin") {
        alert("Access denied");
        window.location.href = "index.html";
    }
}

export async function requireAdmin() {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) window.location.href = "login.html";

    await checkBanStatus(session.session.user.id); // 🔥 enforce ban

    const { data } = await supabase.from("users")
        .select("role")
        .eq("id", session.session.user.id)
        .single();

    if (data.role !== "admin") {
        alert("Admin only");
        window.location.href = "index.html";
    }
}
