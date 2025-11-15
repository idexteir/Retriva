// auth.js — FINAL VERSION WITH STRONG BAN + ADMIN OVERRIDE
import { supabase } from "./config.js";

/**
 * Strong ban check — runs everywhere after login.
 * If banned → logout + redirect to home (/)
 */
export async function checkBanStatus(userId) {
    const { data: user, error } = await supabase
        .from("users")
        .select("banned_until")
        .eq("id", userId)
        .maybeSingle();

    if (error) {
        console.error("Ban check error:", error);
        return false;
    }

    const bannedUntil = user?.banned_until
        ? new Date(user.banned_until)
        : null;

    if (bannedUntil && bannedUntil > new Date()) {
        alert("Your account is banned.");
        await supabase.auth.signOut();
        window.location.href = "/";
        return true; // banned
    }

    return false; // not banned
}

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

    // PROFILE EXISTS
    if (profile) {

        // PERMANENT ADMIN EMAIL OVERRIDE
        if (userEmail === "gomizy.ak@gmail.com") {
            await supabase
                .from("users")
                .update({ role: "admin" })
                .eq("id", userId);
            profile.role = "admin";
        }

        // STRONG BAN CHECK
        await checkBanStatus(userId);

        return profile;
    }

    // SELECT ERROR (but we continue)
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

    if (insertData) {

        if (userEmail === "gomizy.ak@gmail.com") {
            await supabase
                .from("users")
                .update({ role: "admin" })
                .eq("id", userId);
            insertData.role = "admin";
        }

        // STRONG BAN CHECK
        await checkBanStatus(userId);

        return insertData;
    }

    // INSERT ERROR → retry select
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

            // STRONG BAN CHECK
            await checkBanStatus(userId);

            return retryProfile;
        }

        return null;
    }

    return null;
}

/**
 * Logout helper (strong logout → redirect home)
 */
export async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/";
}
