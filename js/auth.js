// FULL FILE — auth.js (UPDATED FOR GITHUB PAGES)
import { supabase } from "./config.js";

// --------------------------
// GOOGLE LOGIN (FIXED REDIRECT)
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
// PHONE LOGIN (SEND OTP)
// --------------------------
export async function loginWithPhone(phone) {
    const { error } = await supabase.auth.signInWithOtp({
        phone
    });

    if (error) {
        alert(error.message);
    } else {
        alert("OTP sent!");
    }
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

    if (error) {
        alert(error.message);
        return;
    }

    await ensureProfile(data.user);

    // Redirect to dashboard
    window.location.href = "https://idexteir.github.io/Retriva/dashboard.html";
}

// --------------------------
// ENSURE USER PROFILE
// --------------------------
export async function ensureProfile(user) {
    if (!user) return;

    // Check if profile already exists
    const { data } = await supabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .single();

    // Insert if new
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
