// js/header.js
import { supabase } from "./config.js";

async function renderHeader() {
    const header = document.getElementById("app-header");

    const { data } = await supabase.auth.getSession();
    const user = data?.session?.user;

    let role = user?.app_metadata?.role || "user";

    header.innerHTML = `
        <nav class="navbar">
            <div class="nav-left">
                <a class="logo" href="index.html">Retriva</a>
                <a href="index.html">Home</a>
                <a href="dashboard.html">Dashboard</a>
                ${role === "admin" ? `<a href="admin.html">Admin</a>` : ""}
            </div>
            <div class="nav-right">
                ${user ? `
                    <span class="user-email">${user.email}</span>
                    <button id="logout-btn" class="btn small">Logout</button>
                ` : `
                    <a href="login.html" class="btn small">Login</a>
                `}
            </div>
        </nav>
    `;

    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.onclick = async () => {
            await supabase.auth.signOut();
            window.location.href = "login.html";
        };
    }
}

renderHeader();
