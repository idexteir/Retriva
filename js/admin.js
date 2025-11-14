// FULL FILE — admin.js
import { supabase } from "./config.js";
import { requireAdmin } from "./protect.js";

requireAdmin();

const usersTable = document.getElementById("usersTable");

// Load data on page start
document.addEventListener("DOMContentLoaded", () => {
    loadStats();
    loadUsers();
});

// Load statistics cards
async function loadStats() {
    const [{ count: users }, { count: managers }, { count: listings }] = await Promise.all([
        supabase.from("users").select("*", { count: "exact", head: true }),
        supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "manager"),
        supabase.from("listings").select("*", { count: "exact", head: true })
    ]);

    document.getElementById("totalUsers").innerText = users;
    document.getElementById("totalManagers").innerText = managers;
    document.getElementById("totalListings").innerText = listings;
}

// Load all users
async function loadUsers() {
    const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        alert("Failed to load users");
        return;
    }

    usersTable.innerHTML = "";

    data.forEach(user => {
        usersTable.innerHTML += `
            <tr>
                <td>${user.name || "—"}</td>
                <td>${user.email || user.phone || "—"}</td>
                <td>${user.role}</td>
                <td>${user.status}</td>

                <td>
                    ${user.role !== "admin" ? `
                        <a href="#" onclick="promote('${user.id}')">Promote</a> |
                        <a href="#" onclick="demote('${user.id}')">Demote</a> |
                    ` : ""}

                    ${user.status === "active" ? `
                        <a href="#" onclick="blockUser('${user.id}')">Block</a>
                    ` : `
                        <a href="#" onclick="unblockUser('${user.id}')">Unblock</a>
                    `}
                </td>
            </tr>
        `;
    });
}

window.promote = async (id) => {
    await supabase
        .from("users")
        .update({ role: "manager" })
        .eq("id", id);

    loadUsers();
};

window.demote = async (id) => {
    await supabase
        .from("users")
        .update({ role: "user" })
        .eq("id", id);

    loadUsers();
};

window.blockUser = async (id) => {
    await supabase
        .from("users")
        .update({ status: "blocked" })
        .eq("id", id);

    loadUsers();
};

window.unblockUser = async (id) => {
    await supabase
        .from("users")
        .update({ status: "active" })
        .eq("id", id);

    loadUsers();
};

window.logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "login.html";
};
