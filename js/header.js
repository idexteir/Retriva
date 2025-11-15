// js/header.js (FINAL VERSION)
import { supabase } from "./config.js";
import { ensureProfile, checkBanStatus } from "./auth.js";

async function renderHeader() {
    const header = document.getElementById("app-header");

    // Load session
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;

    // If no session → show public header
    if (!session) {
        header.innerHTML = `
            <nav class="navbar">
                <div class="nav-left">
                    <a class="logo" href="index.html">Retriva</a>
                    <a href="index.html">Home</a>
                </div>
                <div class="nav-right">
                    <a href="login.html" class="btn small">Login</a>
                </div>
            </nav>
        `;
        return;
    }

    const user = session.user;

    // Protect banned users instantly
    await checkBanStatus(user.id);

    // Load profile (includes permanent admin enforcement)
    const profile = await ensureProfile(user);
    const role = profile?.role || "user";

    // Logged-in header
    header.innerHTML = `
        <nav class="navbar">
            <div class="nav-left">
                <a class="logo" href="index.html">Retriva</a>
                <a href="index.html">Home</a>
                <a href="dashboard.html">Dashboard</a>

                ${role === "admin" ? `<a href="admin.html">Admin</a>` : ""}
            </div>

            <div class="nav-right">
                <span class="user-email">${user.email}</span>
                <button id="logout-btn" class="btn small">Logout</button>
            </div>
        </nav>
    `;

    // Logout handler → always redirect to Home, not Login
    const logoutBtn = document.getElementById("logout-btn");
    logoutBtn.onclick = async () => {
        await supabase.auth.signOut();
        window.location.href = "index.html"; // cleaner UX
    };
}

renderHeader();
