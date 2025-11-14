// FULL FILE — protect.js
import { supabase } from "./config.js";

export async function requireLogin() {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) window.location.href = "login.html";
}

export async function requireManager() {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) window.location.href = "login.html";

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

    const { data } = await supabase.from("users")
        .select("role")
        .eq("id", session.session.user.id)
        .single();

    if (data.role !== "admin") {
        alert("Admin only");
        window.location.href = "index.html";
    }
}
