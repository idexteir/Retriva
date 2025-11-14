// ======================= IMPORTS =======================
import { supabase } from "./config.js";
import { ensureProfile } from "./auth.js";
import { AdminDebug } from "./adminDebugTool.js";

let CURRENT_ROLE = "user";
let CURRENT_USER_ID = null;

// ======================= ACCESS CHECK =======================

async function requireAdminOrManager() {
    AdminDebug.log("RequireAdminOrManager → start", {});

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    AdminDebug.log("Session Data", { sessionData, sessionError });

    const session = sessionData?.session;

    if (!session) {
        AdminDebug.error("Session Missing", "Redirecting to login");
        window.location.href = "login.html";
        return;
    }

    CURRENT_USER_ID = session.user.id;

    AdminDebug.log("Session User", {
        id: session.user.id,
        email: session.user.email,
        metadata: session.user.user_metadata
    });

    const profile = await ensureProfile(session.user);

    AdminDebug.log("Loaded Profile", profile);

    if (!profile) {
        AdminDebug.error("Profile Missing", "Redirect to login");
        alert("Profile not found.");
        window.location.href = "login.html";
        return;
    }

    CURRENT_ROLE = profile.role;

    AdminDebug.log("Profile Role Resolved", { CURRENT_ROLE });

    if (CURRENT_ROLE === "user") {
        AdminDebug.error("Access Denied", "User tried to access admin");
        alert("Access denied.");
        window.location.href = "index.html";
        return;
    }
}

// ======================= LOAD USERS =======================

async function loadUsers() {
    AdminDebug.log("LoadUsers → start", {});

    const tbody = document.getElementById("admin-users");
    tbody.innerHTML = "";

    const { data: users, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: true });

    AdminDebug.inspectResponse("LoadUsers → Supabase result", { data: users, error });

    if (error) {
        tbody.innerHTML = `<tr><td colspan="4">Error loading users</td></tr>`;
        AdminDebug.error("LoadUsers Failed", error);
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
        } else if (CURRENT_ROLE === "manager") {
            if (!isAdmin && !isSelf) {
                roleSelect = `
                    <select onchange="updateRole('${u.id}', this.value)">
                        <option value="user" ${u.role === "user" ? "selected" : ""}>User</option>
                        <option value="manager" ${u.role === "manager" ? "selected" : ""}>Manager</option>
                    </select>`;
            }
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

    AdminDebug.log("LoadUsers → Completed", {});
}

// ======================= UPDATE ROLE =======================

window.updateRole = async (id, newRole) => {
    AdminDebug.inspectRequest("UpdateRole", { id, newRole });

    const result = await supabase
        .from("users")
        .update({ role: newRole })
        .eq("id", id);

    AdminDebug.inspectResponse("UpdateRole → Result", result);

    if (result.error) {
        alert("Failed to update role");
        return;
    }

    loadUsers();
};

// ======================= BAN USER =======================

window.toggleBan = async (id, isBanned) => {
    const banned_until = isBanned ? new Date().toISOString() : null;

    AdminDebug.inspectRequest("ToggleBan", { id, banned_until });

    const result = await supabase
        .from("users")
        .update({ banned_until })
        .eq("id", id);

    AdminDebug.inspectResponse("ToggleBan → Result", result);

    if (result.error) {
        alert("Failed to update ban");
        return;
    }

    loadUsers();
};

// ======================= DELETE USER =======================

window.deleteUser = async (id) => {
    AdminDebug.inspectRequest("DeleteUser", { id });

    if (!confirm("Delete this user permanently?")) return;

    const result = await supabase
        .from("users")
        .delete()
        .eq("id", id);

    AdminDebug.inspectResponse("DeleteUser → Result", result);

    if (result.error) {
        alert("Delete failed");
        return;
    }

    loadUsers();
};

// ======================= LOAD LISTINGS =======================

async function loadListings() {
    AdminDebug.log("LoadListings → start", {});

    const tbody = document.getElementById("admin-listings");
    tbody.innerHTML = "";

    const result = await supabase
        .from("listings")
        .select("id, title, status, users(email)")
        .order("created_at", { ascending: false });

    AdminDebug.inspectResponse("LoadListings → Result", result);

    const { data: listings, error } = result;

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

    AdminDebug.log("LoadListings → Completed", {});
}

// ======================= UPDATE LISTING STATUS =======================

window.toggleListing = async (id, status) => {
    const newStatus = status === "hidden" ? "active" : "hidden";

    AdminDebug.inspectRequest("ToggleListing", { id, newStatus });

    const result = await supabase
        .from("listings")
        .update({ status: newStatus })
        .eq("id", id);

    AdminDebug.inspectResponse("ToggleListing → Result", result);

    if (result.error) {
        alert("Listing update failed");
        return;
    }

    loadListings();
};

// ======================= DELETE LISTING =======================

window.deleteListing = async (id) => {
    AdminDebug.inspectRequest("DeleteListing", { id });

    if (!confirm("Delete listing?")) return;

    const result = await supabase
        .from("listings")
        .delete()
        .eq("id", id);

    AdminDebug.inspectResponse("DeleteListing → Result", result);

    if (result.error) {
        alert("Delete failed");
        return;
    }

    loadListings();
};

// ======================= INIT =======================

(async () => {
    AdminDebug.log("Admin.js init", {});
    await requireAdminOrManager();
    await loadUsers();
    await loadListings();
})();
