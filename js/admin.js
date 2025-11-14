// admin.js — FINAL RESTORED VERSION
import { supabase } from "./config.js";
import { ensureProfile } from "./auth.js";

let CURRENT_ROLE = "user";

/**
 * Check if user is admin or manager before entering admin page
 */
async function requireAdminOrManager() {
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;

    if (!session) {
        window.location.href = "login.html";
        return;
    }

    const authUser = session.user;

    // Ensure profile exists
    const profile = await ensureProfile(authUser);

    if (!profile) {
        alert("Profile not found.");
        window.location.href = "login.html";
        return;
    }

    CURRENT_ROLE = profile.role;

    // USER cannot enter admin page
    if (profile.role === "user") {
        alert("Access denied.");
        window.location.href = "index.html";
        return;
    }
}

/**
 * Load all users (ADMIN ONLY)
 */
async function loadUsers() {
    const tbody = document.getElementById("admin-users");
    tbody.innerHTML = `<tr><td colspan="3">Loading...</td></tr>`;

    const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: true });

    if (error) {
        console.error(error);
        tbody.innerHTML = `<tr><td colspan="3">Error loading users</td></tr>`;
        return;
    }

    tbody.innerHTML = "";

    data.forEach((u) => {
        let roleControl = "";

        // Admin can change roles
        if (CURRENT_ROLE === "admin") {
            roleControl = `
                <select onchange="updateUserRole('${u.id}', this.value)">
                    <option value="user" ${u.role === "user" ? "selected" : ""}>User</option>
                    <option value="manager" ${u.role === "manager" ? "selected" : ""}>Manager</option>
                    <option value="admin" ${u.role === "admin" ? "selected" : ""}>Admin</option>
                </select>
            `;
        }
        // Manager can only see roles
        else {
            roleControl = `<span>${u.role}</span>`;
        }

        tbody.innerHTML += `
            <tr>
                <td>${u.email}</td>
                <td>${roleControl}</td>
                <td>${u.status}</td>
            </tr>
        `;
    });
}

/**
 * Update user role (ADMIN ONLY)
 */
async function updateUserRole(userId, newRole) {
    const { error } = await supabase
        .from("users")
        .update({ role: newRole })
        .eq("id", userId);

    if (error) {
        console.error(error);
        alert("Error updating role.");
        return;
    }

    alert("Role updated.");
    loadUsers();
}

/**
 * Load all listings (ADMIN + MANAGER)
 */
async function loadListings() {
    const tbody = document.getElementById("admin-listings");
    tbody.innerHTML = `<tr><td colspan="3">Loading...</td></tr>`;

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

    if (error) {
        console.error(error);
        tbody.innerHTML = `<tr><td colspan="3">Error loading listings</td></tr>`;
        return;
    }

    tbody.innerHTML = "";

    data.forEach((l) => {
        const ownerEmail = l.users?.email ?? "Unknown";

        tbody.innerHTML += `
            <tr>
                <td>${l.title}</td>
                <td>${ownerEmail}</td>
                <td>${l.status}</td>
            </tr>
        `;
    });
}

// Expose role update function to window
window.updateUserRole = updateUserRole;

// Initialize admin page
(async () => {
    await requireAdminOrManager();
    await loadUsers();
    await loadListings();
})();
