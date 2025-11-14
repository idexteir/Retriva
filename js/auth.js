// js/auth.js
import { supabase } from "./config.js";

export async function ensureProfile(user) {
    if (!user) return;

    const { data: exists } = await supabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

    if (!exists) {
        await supabase.from("users").insert({
            id: user.id,
            email: user.email,
            role: "user",
            status: "active"
        });
    }
}
