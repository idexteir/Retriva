import { supabase } from "./config.js";

export async function renderHeader() {
    const emailEl = document.getElementById("header-user-email");
    const logoutBtn = document.getElementById("logout-btn");

    // If page does not have a header → avoid crashing
    if (!emailEl || !logoutBtn) return;

    const { data } = await supabase.auth.getUser();
    const user = data?.user;

    if (user) {
        emailEl.textContent = user.email;
        logoutBtn.style.display = "inline-block";

        logoutBtn.onclick = async () => {
            await supabase.auth.signOut();
            window.location.href = "login.html";
        };
    } else {
        emailEl.textContent = "";
        logoutBtn.style.display = "none";
    }
}

renderHeader();
