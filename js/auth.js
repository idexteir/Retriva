import { supabase } from "./config.js";

export async function loginWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo: window.location.origin + "/dashboard.html"
        }
    });

    if (error) alert(error.message);
}

export async function loginWithPhone(phone) {
    const { data, error } = await supabase.auth.signInWithOtp({ phone });

    if (error) alert(error.message);
    else alert("OTP sent to your number");
}

export async function verifyOTP(phone, token) {
    const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: "sms",
    });

    if (error) alert(error.message);
    else window.location.href = "dashboard.html";
}

export async function logout() {
    await supabase.auth.signOut();
    window.location.href = "login.html";
}

export async function getCurrentUser() {
    const { data } = await supabase.auth.getUser();
    return data.user;
}
