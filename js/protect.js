// FULL FILE — protect.js
import { supabase } from "./config.js";

// Protect manager pages
export async function requireManager() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

    if (!profile || !["manager", "admin"].includes(profile.role)) {
        alert("Unauthorized");
        window.location.href = "index.html";
    }
}

// Protect admin pages
export async function requireAdmin() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

    if (!profile || profile.role !== "admin") {
        alert("Admin access only");
        window.location.href = "index.html";
    }
}
