
import { supabase } from "./config.js";
import { ensureProfile } from "./auth.js";

let CURRENT_ROLE = "user";

async function requireAdminOrManager() {
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;

    if (!session) {
        window.location.href = "login.html";
        return;
    }

    const profile = await ensureProfile(session.user);
    if (!profile) {
        alert("Profile not found.");
        window.location.href = "login.html";
        return;
    }

    CURRENT_ROLE = profile.role;

    if (profile.role === "user") {
        alert("Access denied.");
        window.location.href = "index.html";
        return;
    }
}

// ================= USERS =================
async function loadUsers() {
    const tbody = document.getElementById("admin-users");
    tbody.innerHTML = "<tr><td colspan='4'>Loading...</td></tr>";

    const { data, error } = await supabase
        .from("users")
        .select("id, email, role, created_at")
        .order("created_at", { ascending: true });

    tbody.innerHTML = "";

    if (error) {
        tbody.innerHTML = `<tr><td colspan="4">Error loading users</td></tr>`;
        return;
    }

    data.forEach((u) => {
        const roleControl = CURRENT_ROLE === "admin"
            ? `<select onchange=\"updateUserRole('${u.id}',this.value)\">
                    <option value='user' ${u.role === "user" ? "selected" : ""}>User</option>
                    <option value='manager' ${u.role === "manager" ? "selected" : ""}>Manager</option>
                    <option value='admin' ${u.role === "admin" ? "selected" : ""}>Admin</option>
               </select>`
            : `<span>${u.role}</span>`;

        const deleteBtn = CURRENT_ROLE === "admin"
            ? `<button class='btn danger small' onclick="deleteUser('${u.id}')">Delete</button>`
            : "";

        tbody.innerHTML += `
            <tr>
                <td>${u.email}</td>
                <td>${roleControl}</td>
                <td>${new Date(u.created_at).toLocaleDateString()}</td>
                <td><div style="display:flex; gap:8px;">${deleteBtn}</div></td>
            </tr>
        `;
    });
}

window.updateUserRole = async (uid, newRole) => {
    const { error } = await supabase.from("users").update({ role: newRole }).eq("id", uid);

    if (error) {
        alert("Error updating role");
        console.error(error);
        return;
    }

    alert("Role updated");
    loadUsers();
};

window.deleteUser = async (uid) => {
    if (!confirm("Delete this user?")) return;

    await supabase.from("users").delete().eq("id", uid);
    loadUsers();
};

// ================ LISTINGS =================
async function loadListings() {
    const tbody = document.getElementById("admin-listings");
    tbody.innerHTML = "<tr><td colspan='5'>Loading...</td></tr>";

    const { data, error } = await supabase
        .from("listings")
        .select(`id, title, status, posted_by, listing_images (image_url), users(email)`) 
        .order("created_at", { ascending: false });

    tbody.innerHTML = "";

    if (error) {
        tbody.innerHTML = `<tr><td colspan='5'>Error loading listings</td></tr>`;
        return;
    }

    data.forEach((l) => {
        const thumb = l.listing_images?.length ? l.listing_images[0].image_url : "assets/img/no-image.png";
        const owner = l.users?.email ?? "Unknown";

        const toggleBtn = `<button class='btn warning small' onclick="toggleListing('${l.id}','${l.status}')">${l.status === "active" ? "Hide" : "Unhide"}</button>`;
        const deleteBtn = `<button class='btn danger small' onclick="deleteListing('${l.id}')">Delete</button>`;

        tbody.innerHTML += `
            <tr>
                <td><img src='${thumb}' class='thumb'></td>
                <td>${l.title}</td>
                <td>${owner}</td>
                <td>${l.status}</td>
                <td><div style="display:flex; gap:8px;">${toggleBtn}${deleteBtn}</div></td>
            </tr>
        `;
    });
}

window.toggleListing = async (id, status) => {
    const newStatus = status === "active" ? "hidden" : "active";
    await supabase.from("listings").update({ status: newStatus }).eq("id", id);
    loadListings();
};

window.deleteListing = async (id) => {
    if (!confirm("Delete this listing?")) return;

    await supabase.from("listings").delete().eq("id", id);
    loadListings();
};

// INIT
(async () => {
    await requireAdminOrManager();
    await loadUsers();
    await loadListings();
})();
