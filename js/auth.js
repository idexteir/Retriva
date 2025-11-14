// FULL FILE — auth.js
import { supabase } from "./config.js";

// --------------------------
// GOOGLE LOGIN
// --------------------------
export async function loginWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo: window.location.origin + "/dashboard.html"
        }
    });

    if (error) alert(error.message);
}

// --------------------------
// PHONE LOGIN (SEND OTP)
// --------------------------
export async function loginWithPhone(phone) {
    const { error } = await supabase.auth.signInWithOtp({
        phone
    });
    if (error) alert(error.message);
}

// --------------------------
// VERIFY OTP
// --------------------------
export async function verifyOTP(phone, token) {
    const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: "sms"
    });

    if (error) { alert(error.message); return; }

    await ensureProfile(data.user);
    window.location.href = "dashboard.html";
}

// --------------------------
// ENSURE USER PROFILE
// --------------------------
export async function ensureProfile(user) {
    if (!user) return;

    const { data } = await supabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .single();

    if (!data) {
        await supabase.from("users").insert({
            id: user.id,
            email: user.email,
            phone: user.phone,
            role: "user",
            status: "active"
        });
    }
}
