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

    const user = session.user;

    const profile = await ensureProfile(user);
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

async function loadUsers() {
    const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: true });

    const tbody = document.getElementById("admin-users");
    tbody.innerHTML = "";

    if (error) {
        tbody.innerHTML = `<tr><td colspan="4">Error loading users</td></tr>`;
        return;
    }

    data.forEach((u) => {
        let roleControl = "";

        if (CURRENT_ROLE === "admin") {
            roleControl = `
                <select onchange="updateUserRole('${u.id}', this.value)">
                    <option value="user" ${u.role === "user" ? "selected" : ""}>User</option>
                    <option value="manager" ${u.role === "manager" ? "selected" : ""}>Manager</option>
                    <option value="admin" ${u.role === "admin" ? "selected" : ""}>Admin</option>
                </select>
            `;
        } else {
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

async function loadListings() {
    const { data, error } = await supabase
        .from("listings")
        .select(`
            id,
            title,
            type,
            status,
            posted_by,
            users ( email )
        `)
        .order("created_at", { ascending: false });

    const tbody = document.getElementById("admin-listings");
    tbody.innerHTML = "";

    if (error) {
        console.error(error);
        tbody.innerHTML = `<tr><td colspan="4">Error loading listings</td></tr>`;
        return;
    }

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

window.updateUserRole = updateUserRole;

(async () => {
    await requireAdminOrManager();
    await loadUsers();
    await loadListings();
})();
