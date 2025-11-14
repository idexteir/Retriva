import { supabase } from "./config.js";
import { ensureProfile } from "./auth.js";

let CURRENT_ROLE = "user";
let CAN_BAN = false;
let CURRENT_USER_ID = null;

// ------------------------------
// REQUIRE ADMIN OR MANAGER
// ------------------------------

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

    CURRENT_ROLE = profile.role;
    CAN_BAN = profile.can_ban_users;

    if (profile.role === "user") {
        alert("Access denied.");
        window.location.href = "index.html";
    }
}

// ------------------------------
// USERS TABLE
// ------------------------------

async function loadUsers() {
    const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at");

    const tbody = document.getElementById("admin-users");
    tbody.innerHTML = "";

    if (error) {
        tbody.innerHTML = `<tr><td colspan="5">Error loading users</td></tr>`;
        return;
    }

    data.forEach(u => {
        const isAdmin = u.role === "admin";
        const isSelf = u.id === CURRENT_USER_ID;

        // ----- ROLE SELECT -----
        let roleHTML = `<span>${u.role}</span>`;
        if (CURRENT_ROLE === "admin" && !isSelf) {
            roleHTML = `
                <select onchange="updateUserRole('${u.id}', this.value)">
                  <option value="user" ${u.role === "user" ? "selected" : ""}>User</option>
                  <option value="manager" ${u.role === "manager" ? "selected" : ""}>Manager</option>
                  <option value="admin" ${u.role === "admin" ? "selected" : ""}>Admin</option>
                </select>`;
        }

        // ----- BAN BUTTONS -----
        let banButtons = "";
        if (isSelf || isAdmin) {
            banButtons = `<span>---</span>`;
        } else {
            banButtons = `
                <button class="btn danger small" onclick="banUser('${u.id}')">Ban</button>
                ${u.banned_until ? `<button class="btn small" onclick="unbanUser('${u.id}')">Unban</button>` : ""}
            `;
        }

        // ----- PERMISSION TOGGLE -----
        let perm = `<span>${u.can_ban_users ? "Yes" : "No"}</span>`;
        if (CURRENT_ROLE === "admin" && !isAdmin && !isSelf) {
            perm = `
              <label class="toggle-label">
                <input type="checkbox" onchange="toggleBanPermission('${u.id}', this.checked)" 
                    ${u.can_ban_users ? "checked" : ""}>
                Can ban users
              </label>
            `;
        }

        tbody.innerHTML += `
            <tr>
                <td>${u.email}</td>
                <td>${roleHTML}</td>
                <td>${u.banned_until ? "BANNED" : "Active"}</td>
                <td>${banButtons}</td>
                <td>${perm}</td>
            </tr>
        `;
    });
}

// Update Role
window.updateUserRole = async (userId, newRole) => {
    const { error } = await supabase
        .from("users")
        .update({ role: newRole })
        .eq("id", userId);

    if (error) {
        console.error(error);
        alert("Error updating role");
        return;
    }
    loadUsers();
};

// Toggle ban permission
window.toggleBanPermission = async (userId, allowed) => {
    const { error } = await supabase
        .from("users")
        .update({ can_ban_users: allowed })
        .eq("id", userId);

    if (error) {
        console.error(error);
        alert("Failed to update permission");
        return;
    }
    loadUsers();
};

// Ban user (RPC)
window.banUser = async userId => {
    const { error } = await supabase.rpc("ban_user", {
        target_user: userId,
    });

    if (error) {
        console.error(error);
        alert("Failed to ban user");
        return;
    }
    alert("User banned");
    loadUsers();
};

// Unban user (RPC)
window.unbanUser = async userId => {
    const { error } = await supabase.rpc("unban_user", {
        target_user: userId,
    });

    if (error) {
        console.error(error);
        alert("Failed to unban user");
        return;
    }
    alert("User unbanned");
    loadUsers();
};

// ------------------------------
// LISTINGS TABLE
// ------------------------------

async function loadListings() {
    const { data, error } = await supabase
        .from("listings")
        .select(`
            id,
            title,
            type,
            status,
            posted_by,
            listing_images(image_url),
            users(email)
        `)
        .order("created_at", { ascending: false });

    const tbody = document.getElementById("admin-listings");
    tbody.innerHTML = "";

    if (error) {
        tbody.innerHTML = `<tr><td colspan="5">Error loading listings</td></tr>`;
        return;
    }

    data.forEach(l => {
        const thumb = l.listing_images?.[0]?.image_url || "assets/img/no-image.png";

        tbody.innerHTML += `
            <tr>
                <td><img src="${thumb}" class="thumb" /></td>
                <td>${l.title}</td>
                <td>${l.users?.email ?? "Unknown"}</td>
                <td>${l.status}</td>
                <td class="action-cell">
                    <button class="btn small warning" onclick="toggleListingStatus('${l.id}', '${l.status}')">
                        ${l.status === "active" ? "Hide" : "Unhide"}
                    </button>
                    <button class="btn small danger" onclick="deleteListing('${l.id}')">
                        Delete
                    </button>
                </td>
            </tr>
        `;
    });
}

window.toggleListingStatus = async (id, status) => {
    const newStatus = status === "active" ? "hidden" : "active";

    const { error } = await supabase
        .from("listings")
        .update({ status: newStatus })
        .eq("id", id);

    if (error) {
        alert("Failed to update listing");
        return;
    }
    loadListings();
};

window.deleteListing = async id => {
    if (!confirm("Delete listing?")) return;

    const { error } = await supabase.from("listings").delete().eq("id", id);

    if (error) {
        alert("Failed to delete listing");
        return;
    }
    loadListings();
};

// ------------------------------
// INIT
// ------------------------------

(async () => {
    await requireAdminOrManager();
    await loadUsers();
    await loadListings();
})();
