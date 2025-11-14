// FULL FILE — auth.js (corrected)
import { supabase } from "./config.js";

// --------------------------
// GOOGLE LOGIN
// --------------------------
export async function loginWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo: "https://idexteir.github.io/Retriva/dashboard.html"
        }
    });

    if (error) alert(error.message);
}

// --------------------------
// PHONE LOGIN
// --------------------------
export async function loginWithPhone(phone) {
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) alert(error.message);
    else alert("OTP sent!");
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

    if (error) return alert(error.message);

    await ensureProfile(data.user);
    window.location.href = "dashboard.html";
}

// --------------------------
// ENSURE USER PROFILE EXISTS
// --------------------------
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
            phone: user.phone,
            role: "user",
            status: "active"
        });
    }
}
