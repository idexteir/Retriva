import { supabase } from "./config.js";
import { ensureProfile } from "./auth.js";

let CURRENT_ROLE = "user";

/**
 * Restrict access
 */
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
        alert("Profile missing");
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

/**
 * USERS SECTION
 */
async function loadUsers() {
    const tbody = document.getElementById("admin-users");
    tbody.innerHTML = "<tr><td colspan='4'>Loading...</td></tr>";

    const { data, error } = await supabase.from("users").select("*");

    if (error) {
        console.error(error);
        tbody.innerHTML = "<tr><td colspan='4'>Error loading users</td></tr>";
        return;
    }

    tbody.innerHTML = "";

    data.forEach((u) => {
        // Role dropdown rules
        let roleControl = "";
        const isAdmin = u.role === "admin";

        if (CURRENT_ROLE === "admin") {
            // Admin cannot demote other admins
            const disabled = isAdmin && u.id !== supabase.auth.getSession()?.session?.user?.id;

            roleControl = `
                <select 
                    onchange="updateUserRole('${u.id}', this.value)"
                    ${disabled ? "disabled" : ""}
                >
                    <option value="user" ${u.role === "user" ? "selected" : ""}>User</option>
                    <option value="manager" ${u.role === "manager" ? "selected" : ""}>Manager</option>
                    <option value="admin" ${u.role === "admin" ? "selected" : ""}>Admin</option>
                </select>
            `;
        }

        if (CURRENT_ROLE === "manager") {
            if (isAdmin) {
                roleControl = `<span>admin</span>`;
            } else {
                roleControl = `
                    <select onchange="updateUserRole('${u.id}', this.value)">
                        <option value="user" ${u.role === "user" ? "selected" : ""}>User</option>
                        <option value="manager" ${u.role === "manager" ? "selected" : ""}>Manager</option>
                    </select>
                `;
            }
        }

        const canBan = CURRENT_ROLE === "admin" || CURRENT_ROLE === "manager";
        const toggleClass = u.banned ? "toggle active" : "toggle";

        tbody.innerHTML += `
            <tr>
                <td>${u.email}</td>
                <td>${roleControl}</td>
                <td>
                    ${
                        canBan && !isAdmin
                            ? `<div class="${toggleClass}" onclick="toggleBan('${u.id}', ${u.banned})">
                                    <div class="toggle-circle"></div>
                               </div>`
                            : "-"
                    }
                </td>
                <td>
                    ${
                        (!isAdmin && (CURRENT_ROLE === "admin" || CURRENT_ROLE === "manager"))
                            ? `<button class="btn danger small" onclick="deleteUser('${u.id}')">Delete</button>`
                            : "-"
                    }
                </td>
            </tr>
        `;
    });
}

/**
 * Update Role
 */
window.updateUserRole = async (id, role) => {
    const { error } = await supabase.from("users").update({ role }).eq("id", id);

    if (error) {
        console.error(error);
        alert("Error: cannot update role");
        return;
    }

    loadUsers();
};

/**
 * Ban toggle
 */
window.toggleBan = async (id, current) => {
    const { error } = await supabase.from("users").update({ banned: !current }).eq("id", id);

    if (error) {
        console.error(error);
        alert("Error toggling ban");
        return;
    }

    loadUsers();
};

/**
 * Delete User
 */
window.deleteUser = async (id) => {
    if (!confirm("Delete this user?")) return;

    const { error } = await supabase.from("users").delete().eq("id", id);

    if (error) {
        console.error(error);
        alert("Error deleting user");
        return;
    }

    loadUsers();
};

/**
 * LISTINGS SECTION
 */
async function loadListings() {
    const tbody = document.getElementById("admin-listings");
    tbody.innerHTML = "<tr><td colspan='5'>Loading...</td></tr>";

    const { data, error } = await supabase
        .from("listings")
        .select("id, title, status, posted_by, users(email)");

    if (error) {
        console.error(error);
        tbody.innerHTML = "<tr><td colspan='5'>Error loading</td></tr>";
        return;
    }

    tbody.innerHTML = "";

    data.forEach((l) => {
        const isHidden = l.status === "hidden";

        tbody.innerHTML += `
            <tr>
                <td>${l.title}</td>
                <td>${l.users?.email ?? "Unknown"}</td>
                <td>${l.status}</td>
                <td>
                    <button class="btn warning small" onclick="toggleListing('${l.id}', '${l.status}')">
                        ${isHidden ? "Unhide" : "Hide"}
                    </button>
                </td>
                <td>
                    <button class="btn danger small" onclick="deleteListing('${l.id}')">Delete</button>
                </td>
            </tr>
        `;
    });
}

window.toggleListing = async (id, status) => {
    const newStatus = status === "hidden" ? "active" : "hidden";

    const { error } = await supabase
        .from("listings")
        .update({ status: newStatus })
        .eq("id", id);

    if (error) {
        console.error(error);
        alert("Error updating listing");
        return;
    }

    loadListings();
};

window.deleteListing = async (id) => {
    if (!confirm("Delete this listing?")) return;

    const { error } = await supabase.from("listings").delete().eq("id", id);

    if (error) {
        console.error(error);
        alert("Error deleting listing");
        return;
    }

    loadListings();
};

/**
 * INIT
 */
(async () => {
    await requireAdminOrManager();
    await loadUsers();
    await loadListings();
})();
