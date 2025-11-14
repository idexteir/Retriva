// ======================= IMPORTS =======================
import { supabase } from "./config.js";
import { ensureProfile } from "./auth.js";

let CURRENT_ROLE = "user";
let CURRENT_USER_ID = null;

// ======================= ACCESS CHECK =======================

async function requireAdminOrManager() {
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;

    if (!session) {
        window.location.href = "login.html";
        return;
    }

    CURRENT_USER_ID = session.user.id;

    const profile = await ensureProfile(session.user);
    if (!profile) {
        window.location.href = "login.html";
        return;
    }

    CURRENT_ROLE = profile.role;

    if (CURRENT_ROLE === "user") {
        alert("Access denied.");
        window.location.href = "index.html";
        return;
    }
}

// ======================= LOAD USERS =======================

async function loadUsers() {
    const tbody = document.getElementById("admin-users");
    tbody.innerHTML = "";

    const { data: users, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: true });

    if (error) {
        tbody.innerHTML = `<tr><td colspan="4">Error loading users</td></tr>`;
        return;
    }

    users.forEach(u => {
        const isSelf = u.id === CURRENT_USER_ID;
        const isAdmin = u.role === "admin";

        // ROLE SELECT
        let roleSelect = `<span>${u.role}</span>`;

        if (CURRENT_ROLE === "admin" && !isSelf) {
            roleSelect = `
                <select onchange="updateRole('${u.id}', this.value)">
                    <option value="user" ${u.role === "user" ? "selected" : ""}>User</option>
                    <option value="manager" ${u.role === "manager" ? "selected" : ""}>Manager</option>
                    <option value="admin" ${u.role === "admin" ? "selected" : ""}>Admin</option>
                </select>`;
        } else if (CURRENT_ROLE === "manager" && !isAdmin && !isSelf) {
            roleSelect = `
                <select onchange="updateRole('${u.id}', this.value)">
                    <option value="user" ${u.role === "user" ? "selected" : ""}>User</option>
                    <option value="manager" ${u.role === "manager" ? "selected" : ""}>Manager</option>
                </select>`;
        }

        // BAN TOGGLE
        let banToggle = `<span>-</span>`;
        if (!isSelf) {
            banToggle = `
                <label class="toggle-switch">
                    <input type="checkbox" onchange="toggleBan('${u.id}', this.checked)" ${u.banned_until ? "checked" : ""}>
                    <span class="slider"></span>
                </label>`;
        }

        // DELETE BUTTON
        let deleteBtn = `<span>-</span>`;
        if (!isSelf) {
            deleteBtn = `<span class="delete-btn" onclick="deleteUser('${u.id}')">Delete</span>`;
        }

        tbody.innerHTML += `
            <tr>
                <td>${u.email}</td>
                <td>${roleSelect}</td>
                <td>${u.banned_until ? "Yes" : "No"} ${banToggle}</td>
                <td>${deleteBtn}</td>
            </tr>
        `;
    });
}

// ======================= UPDATE ROLE =======================

window.updateRole = async (id, newRole) => {
    const { error } = await supabase
        .from("users")
        .update({ role: newRole })
        .eq("id", id);

    if (error) {
        alert("Failed to update role");
        return;
    }

    loadUsers();
};

// ======================= BAN USER =======================

window.toggleBan = async (id, isBanned) => {
    const banned_until = isBanned ? new Date().toISOString() : null;

    const { error } = await supabase
        .from("users")
        .update({ banned_until })
        .eq("id", id);

    if (error) {
        alert("Failed to update ban");
        return;
    }

    loadUsers();
};

// ======================= DELETE USER =======================

window.deleteUser = async (id) => {
    if (!confirm("Delete this user permanently?")) return;

    const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", id);

    if (error) {
        alert("Delete failed");
        return;
    }

    loadUsers();
};

// ======================= LOAD LISTINGS =======================

async function loadListings() {
    const tbody = document.getElementById("admin-listings");
    tbody.innerHTML = "";

    const { data: listings, error } = await supabase
        .from("listings")
        .select("id, title, status, users(email)")
        .order("created_at", { ascending: false });

    if (error) {
        tbody.innerHTML = `<tr><td colspan="4">Error loading listings</td></tr>`;
        return;
    }

    listings.forEach(l => {
        tbody.innerHTML += `
            <tr>
                <td>${l.title}</td>
                <td>${l.users?.email ?? "Unknown"}</td>
                <td>${l.status}</td>
                <td>
                    <span class="action-btn" onclick="toggleListing('${l.id}', '${l.status}')">
                        ${l.status === "hidden" ? "Unhide" : "Hide"}
                    </span>
                    <span class="delete-btn" onclick="deleteListing('${l.id}')">Delete</span>
                </td>
            </tr>
        `;
    });
}

// ======================= UPDATE LISTING STATUS =======================

window.toggleListing = async (id, status) => {
    const newStatus = status === "hidden" ? "active" : "hidden";

    const { error } = await supabase
        .from("listings")
        .update({ status: newStatus })
        .eq("id", id);

    if (error) {
        alert("Listing update failed");
        return;
    }

    loadListings();
};

// ======================= DELETE LISTING =======================

window.deleteListing = async (id) => {
    if (!confirm("Delete listing?")) return;

    const { error } = await supabase
        .from("listings")
        .delete()
        .eq("id", id);

    if (error) {
        alert("Delete failed");
        return;
    }

    loadListings();
};

// ======================= INIT =======================

(async () => {
    await requireAdminOrManager();
    await loadUsers();
    await loadListings();
})();
