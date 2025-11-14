// FULL FILE — admin.js
import { supabase } from "./config.js";
import { requireAdmin } from "./protect.js";

await requireAdmin();

const tbl = document.getElementById("usersTable");

async function loadUsers() {
    const { data } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

    tbl.innerHTML = "";

    data.forEach(u => {
        tbl.innerHTML += `
            <tr>
                <td>${u.name || "-"}</td>
                <td>${u.email || u.phone}</td>
                <td>${u.role}</td>
                <td>${u.status}</td>
                <td>
                    <button onclick="toggleBlock('${u.id}', '${u.status}')">
                        ${u.status === "active" ? "Block" : "Unblock"}
                    </button>
                    <button onclick="toggleRole('${u.id}', '${u.role}')">
                        ${u.role === "manager" ? "Demote" : "Promote"}
                    </button>
                </td>
            </tr>
        `;
    });
}

window.toggleBlock = async (id, status) => {
    await supabase
        .from("users")
        .update({ status: status === "active" ? "blocked" : "active" })
        .eq("id", id);

    loadUsers();
};

window.toggleRole = async (id, role) => {
    await supabase
        .from("users")
        .update({ role: role === "manager" ? "user" : "manager" })
        .eq("id", id);

    loadUsers();
};

loadUsers();
