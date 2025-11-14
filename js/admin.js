import { supabase } from "./config.js";
import { ensureProfile } from "./auth.js";

let CURRENT_ROLE = "user";

// Helper to get current logged-in user ID
async function getCurrentUserId() {
    const { data: sessionData } = await supabase.auth.getSession();
    return sessionData?.session?.user?.id || null;
}

// ===============================
// ACCESS CHECK
// ===============================
async function requireAdminOrManager() {
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;

    if (!session) {
        window.location.href = "login.html";
        return;
    }

    const user = session.user;
    const profile = await ensureProfile(user);

    if (!profile) {
        alert("Profile not found");
        window.location.href = "login.html";
        return;
    }

    CURRENT_ROLE = profile.role;

    // User cannot enter admin page
    if (profile.role === "user") {
        alert("Access denied");
        window.location.href = "index.html";
        return;
    }
}

// ===============================
// LOAD USERS
// ===============================
async function loadUsers() {
    const currentUserId = await getCurrentUserId();

    const { data: users, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at");

    const tbody = document.getElementById("admin-users");
    tbody.innerHTML = "";

    if (error) {
        tbody.innerHTML = `<tr><td colspan="4">Error loading users</td></tr>`;
        return;
    }

    users.forEach(u => {
        const isSelf = (u.id === currentUserId);

        // =================================
        // ROLE DROPDOWN RULES
        // =================================
        let roleControl = "";

        if (CURRENT_ROLE === "admin") {
            roleControl = `
                <select onchange="updateUserRole('${u.id}', this.value)" ${isSelf ? "disabled" : ""}>
                    <option value="user" ${u.role === "user" ? "selected" : ""}>User</option>
                    <option value="manager" ${u.role === "manager" ? "selected" : ""}>Manager</option>
                    <option value="admin" ${u.role === "admin" ? "selected" : ""}>Admin</option>
                </select>
            `;
        }

        if (CURRENT_ROLE === "manager") {
            // Manager CANNOT modify admins or themself
            const disabled = (isSelf || u.role === "admin") ? "disabled" : "";

            roleControl = `
                <select onchange="updateUserRole('${u.id}', this.value)" ${disabled}>
                    <option value="user" ${u.role === "user" ? "selected" : ""}>User</option>
                    <option value="manager" ${u.role === "manager" ? "selected" : ""}>Manager</option>
                </select>
            `;
        }

        // =================================
        // BAN TOGGLE
        // =================================
        const banned = u.banned_until !== null;

        const banToggle = `
            <label class="ban-toggle">
                <input type="checkbox"
                    ${banned ? "checked" : ""}
                    onchange="toggleBan('${u.id}', this.checked)"
                    ${isSelf ? "disabled" : ""}>
                <span class="slider"></span>
            </label>
        `;

        // =================================
        // DELETE BUTTON
        // =================================

        const deleteDisabled =
            isSelf ||
            (CURRENT_ROLE === "manager" && u.role === "admin");

        const deleteBtn = `
            <button class="btn danger"
                onclick="deleteUser('${u.id}')"
                ${deleteDisabled ? "disabled" : ""}>
                Delete
            </button>
        `;

        // =================================
        // OUTPUT ROW
        // =================================
        tbody.innerHTML += `
            <tr>
                <td>${u.email}</td>
                <td>${roleControl}</td>
                <td>${banToggle}</td>
                <td>${deleteBtn}</td>
            </tr>
        `;
    });
}

// ===============================
// ROLE UPDATE
// ===============================
window.updateUserRole = async (id, newRole) => {
    const { error } = await supabase
        .from("users")
        .update({ role: newRole })
        .eq("id", id);

    if (error) {
        console.error(error);
        alert("Update rejected by RLS policy");
        return;
    }

    loadUsers();
};

// ===============================
// BAN / UNBAN
// ===============================
window.toggleBan = async (id, banned) => {
    const banned_until = banned ? "2099-12-31" : null;

    const { error } = await supabase
        .from("users")
        .update({ banned_until })
        .eq("id", id);

    if (error) {
        console.error(error);
        alert("Cannot update ban status");
        return;
    }

    loadUsers();
};

// ===============================
// DELETE USER
// ===============================
window.deleteUser = async (id) => {
    if (!confirm("Delete this user?")) return;

    const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", id);

    if (error) {
        alert("Delete rejected by RLS");
        console.error(error);
        return;
    }

    loadUsers();
};

// ===============================
// LOAD LISTINGS
// ===============================
async function loadListings() {
    const { data, error } = await supabase
        .from("listings")
        .select(`
            id,
            title,
            status,
            posted_by,
            users ( email )
        `)
        .order("created_at", { ascending: false });

    const tbody = document.getElementById("admin-listings");
    tbody.innerHTML = "";

    if (error) {
        tbody.innerHTML = `<tr><td colspan="5">Error loading listings</td></tr>`;
        return;
    }

    data.forEach(l => {
        const isHidden = l.status === "hidden";

        tbody.innerHTML += `
            <tr>
                <td>${l.title}</td>
                <td>${l.users?.email ?? "Unknown"}</td>
                <td>${l.status}</td>

                <td>
                    <button class="btn warning"
                        onclick="toggleListing('${l.id}', '${l.status}')">
                        ${isHidden ? "Unhide" : "Hide"}
                    </button>
                </td>

                <td>
                    <button class="btn danger"
                        onclick="deleteListing('${l.id}')">
                        Delete
                    </button>
                </td>
            </tr>
        `;
    });
}

// Hide / Unhide listing
window.toggleListing = async (id, status) => {
    const newStatus = status === "hidden" ? "active" : "hidden";

    const { error } = await supabase
        .from("listings")
        .update({ status: newStatus })
        .eq("id", id);

    if (error) {
        alert("Action rejected by RLS");
        return;
    }

    loadListings();
};

// Delete listing
window.deleteListing = async (id) => {
    if (!confirm("Delete this listing?")) return;

    const { error } = await supabase
        .from("listings")
        .delete()
        .eq("id", id);

    if (error) {
        alert("Delete rejected by RLS");
        return;
    }

    loadListings();
};

// ===============================
// INIT
// ===============================
(async () => {
    await requireAdminOrManager();
    await loadUsers();
    await loadListings();
})();
