// auth.js — FINAL VERSION WITH BAN CHECK

import { supabase } from "./config.js";

export async function ensureProfile(authUser) {
    if (!authUser) return null;

    const userId = authUser.id;
    const userEmail = authUser.email;

    let { data: profile, error: selectError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

    if (profile) return profile;

    if (selectError) {
        console.warn("ensureProfile: select error →", selectError);
    }

    const { data: insertData, error: insertError } = await supabase
        .from("users")
        .insert({
            id: userId,
            email: userEmail,
            role: "user",
            status: "active",
            name: authUser.user_metadata?.full_name || "",
            avatar_url: authUser.user_metadata?.avatar_url || null,
        })
        .select()
        .maybeSingle();

    if (insertData) return insertData;

    if (insertError) {
        console.error("ensureProfile: insert error →", insertError);
        const { data: retryProfile } = await supabase
            .from("users")
            .select("*")
            .eq("id", userId)
            .maybeSingle();

        if (retryProfile) return retryProfile;
        return null;
    }

    return null;
}

// 🔥 NEW — CHECK BAN STATUS
export async function checkBanStatus(userId) {
    const { data, error } = await supabase
        .from("users")
        .select("banned_until")
        .eq("id", userId)
        .maybeSingle();

    if (error) {
        console.error("checkBanStatus error:", error);
        return;
    }

    if (data?.banned_until && new Date(data.banned_until) > new Date()) {
        alert("Your account has been banned.");
        await supabase.auth.signOut();
        window.location.href = "login.html";
    }
}

export async function logout() {
    await supabase.auth.signOut();
    window.location.href = "login.html";
}
