// auth.js — FINAL VERSION WITH PERMANENT ADMIN OVERRIDE
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

    // If a profile already exists → enforce admin email override
    if (profile) {

        // PERMANENT ADMIN EMAIL OVERRIDE
        if (userEmail === "gomizy.ak@gmail.com") {
            await supabase
                .from("users")
                .update({ role: "admin" })
                .eq("id", userId);

            profile.role = "admin"; // update local object
        }

        return profile;
    }

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

    // If insert succeeded → enforce admin override
    if (insertData) {

        if (userEmail === "gomizy.ak@gmail.com") {
            await supabase
                .from("users")
                .update({ role: "admin" })
                .eq("id", userId);

            insertData.role = "admin";
        }

        return insertData;
    }

    // If insert failed due to conflict or RLS conflict — try again
    if (insertError) {
        console.error("ensureProfile: insert error →", insertError);

        const { data: retryProfile } = await supabase
            .from("users")
            .select("*")
            .eq("id", userId)
            .maybeSingle();

        if (retryProfile) {

            if (userEmail === "gomizy.ak@gmail.com") {
                await supabase
                    .from("users")
                    .update({ role: "admin" })
                    .eq("id", userId);

                retryProfile.role = "admin";
            }

            return retryProfile;
        }

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
