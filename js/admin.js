import { supabase } from "./config.js";
import { ensureProfile } from "./auth.js";

let CURRENT_ROLE = "user";
let CURRENT_USER_ID = null;

/* -------------------------
   ACCESS CHECK
-------------------------- */
async function requireAdminOrManager() {
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;

    if (!session) {
        window.location.href = "login.html";
        return;
    }

    const user = session.user;
    CURRENT_USER_ID = user.id;

    const profile = await ensureProfile(user);
    if (!profile) {
        alert("Profile not found");
        window.location.href = "login.html";
        return;
    }

    CURRENT_ROLE = profile.role;

    if (CURRENT_ROLE === "user") {
        alert("Access denied");
        window.location.href = "index.html";
        return;
    }
}

/* -------------------------
   LOAD USERS
-------------------------- */
async function loadUsers() {
    const tbody = document.getElementById("admin-users");
    tbody.innerHTML = "<tr><td colspan='4'>Loading...</td></tr>";

    const { data: users, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: true });

    if (error) {
        tbody.innerHTML = "<tr><td colspan='4'>Error loading users</td></tr>";
        return;
    }

    tbody.innerHTML = "";

    users.forEach((u) => {
        const isSelf = u.id === CURRENT_USER_ID;

        /* ------------ ROLE CONTROL ------------ */

        let roleControl = `<span>${u.role}</span>`;

        // Admin can modify ANY role except themselves
        if (CURRENT_ROLE === "admin" && !isSelf) {
            roleControl = `
                <select onchange="updateUserRole('${u.id}', this.value)">
                    <option value="user" ${u.role === "user" ? "selected" : ""}>User</option>
                    <option value="manager" ${u.role === "manager" ? "selected" : ""}>Manager</option>
                    <option value="admin" ${u.role === "admin" ? "selected" : ""}>Admin</option>
                </select>
            `;
        }

        // Manager can modify users & managers, not admins
        if (CURRENT_ROLE === "manager" && u.role !== "admin" && !isSelf) {
            roleControl = `
                <select onchange="updateUserRole('${u.id}', this.value)">
                    <option value="user" ${u.role === "user" ? "selected" : ""}>User</option>
                    <option value="manager" ${u.role === "manager" ? "selected" : ""}>Manager</option>
                </select>
            `;
        }

        /* ------------ BAN CONTROL ------------ */
        const banned = u.banned_until !== null;

        let banControl = isSelf ? "-" : `
            <input 
                type="checkbox" 
                ${banned ? "checked" : ""} 
                onchange="toggleBan('${u.id}', this.checked)">
        `;

        /* ------------ DELETE CONTROL ------------ */
        let deleteControl = "-";

        if (!isSelf) {
            deleteControl = `
                <button class="btn small danger" onclick="deleteUser('${u.id}')">
                    Delete
                </button>`;
        }

        tbody.innerHTML += `
            <tr>
                <td>${u.email}</td>
                <td>${roleControl}</td>
                <td>${banControl}</td>
                <td>${deleteControl}</td>
            </tr>
        `;
    });
}

/* -------------------------
   UPDATE ROLE
-------------------------- */
window.updateUserRole = async (userId, role) => {
    const { error } = await supabase
        .from("users")
        .update({ role })
        .eq("id", userId);

    if (error) {
        console.error(error);
        alert("❌ Error updating role");
        return;
    }

    alert("✔ Role updated");
    loadUsers();
};

/* -------------------------
   BAN / UNBAN
-------------------------- */
window.toggleBan = async (userId, checked) => {
    const banned_until = checked ? "2999-01-01" : null;

    const { error } = await supabase
        .from("users")
        .update({ banned_until })
        .eq("id", userId);

    if (error) {
        console.error(error);
        alert("❌ Error updating ban");
        return;
    }

    loadUsers();
};

/* -------------------------
   DELETE USER (soft delete)
-------------------------- */
window.deleteUser = async (userId) => {
    if (!confirm("Are you sure?")) return;

    const { error } = await supabase
        .from("users")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", userId);

    if (error) {
        console.error(error);
        alert("❌ Error deleting user");
        return;
    }

    loadUsers();
};

/* -------------------------
   LISTINGS
-------------------------- */
async function loadListings() {
    const tbody = document.getElementById("admin-listings");

    const { data: listings, error } = await supabase
        .from("listings")
        .select(`
            id,
            title,
            status,
            users ( email )
        `)
        .order("created_at", { ascending: false });

    if (error) {
        tbody.innerHTML = "<tr><td colspan='4'>Error loading listings</td></tr>";
        return;
    }

    tbody.innerHTML = "";

    listings.forEach((l) => {
        tbody.innerHTML += `
            <tr>
                <td>${l.title}</td>
                <td>${l.users?.email ?? "Unknown"}</td>
                <td>${l.status}</td>
                <td>
                    <button class="btn small warning" onclick="toggleVisibility('${l.id}', '${l.status}')">
                        ${l.status === "hidden" ? "Unhide" : "Hide"}
                    </button>

                    <button class="btn small danger" onclick="deleteListing('${l.id}')">
                        Delete
                    </button>
                </td>
            </tr>
        `;
    });
}

/* Hide/unhide listing */
window.toggleVisibility = async (id, status) => {
    const newStatus = status === "hidden" ? "active" : "hidden";

    const { error } = await supabase
        .from("listings")
        .update({ status: newStatus })
        .eq("id", id);

    if (error) {
        alert("Error updating listing");
        return;
    }

    loadListings();
};

/* Delete listing */
window.deleteListing = async (id) => {
    if (!confirm("Delete listing?")) return;

    const { error } = await supabase.from("listings").delete().eq("id", id);

    if (error) {
        alert("Error deleting");
        return;
    }

    loadListings();
};

/* -------------------------
   INIT
-------------------------- */
(async () => {
    await requireAdminOrManager();
    await loadUsers();
    await loadListings();
})();
