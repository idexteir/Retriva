// auth.js — FINAL FIXED VERSION

import { supabase } from "./config.js";

/**
 * Ensures the user has a corresponding row in the "users" table.
 * Safe for OAuth (Google), repeated logins, and RLS.
 */
export async function ensureProfile(authUser) {
    if (!authUser) return null;

    const userId = authUser.id;
    const userEmail = authUser.email;

    // STEP 1 — Try to load existing profile
    let { data: profile, error: selectError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

    // If profile exists, return it
    if (profile) return profile;

    // If select error is something else, log it (but continue)
    if (selectError) {
        console.warn("ensureProfile: select error →", selectError);
    }

    // STEP 2 — Insert missing profile (safe under RLS)
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

    // If insert succeeded
    if (insertData) return insertData;

    // If insert failed due to conflict or RLS conflict — try or return null
    if (insertError) {
        console.error("ensureProfile: insert error →", insertError);

        // Try one more SELECT
        const { data: retryProfile } = await supabase
            .from("users")
            .select("*")
            .eq("id", userId)
            .maybeSingle();

        if (retryProfile) return retryProfile;

        // Still nothing — return null (admin.js will redirect)
        return null;
    }

    return null;
}

/**
 * Logout helper
 */
export async function logout() {
    await supabase.auth.signOut();
    window.location.href = "login.html";
}
