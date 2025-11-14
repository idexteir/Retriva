// js/admin.js
import { supabase } from "./config.js";


// ---------------------------------------------------------
// LOAD ALL USERS
// ---------------------------------------------------------
async function loadUsers() {
    const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

    const tbody = document.getElementById("admin-users");
    tbody.innerHTML = "";

    if (error) {
        tbody.innerHTML = "<tr><td colspan='4'>Error loading users</td></tr>";
        console.error(error);
        return;
    }

    data.forEach(u => {
        tbody.innerHTML += `
            <tr>
                <td>${u.email}</td>
                <td>
                    <select onchange="changeUserRole('${u.id}', this.value)">
                        <option value="user" ${u.role === "user" ? "selected" : ""}>User</option>
                        <option value="manager" ${u.role === "manager" ? "selected" : ""}>Manager</option>
                        <option value="admin" ${u.role === "admin" ? "selected" : ""}>Admin</option>
                    </select>
                </td>
                <td>${u.status}</td>
            </tr>
        `;
    });
}


// ---------------------------------------------------------
// CHANGE USER ROLE
// ---------------------------------------------------------
window.changeUserRole = async (id, newRole) => {
    const ok = confirm(`Change this user's role to "${newRole}"?`);
    if (!ok) return;

    const { error } = await supabase
        .from("users")
        .update({ role: newRole })
        .eq("id", id);

    if (error) {
        alert("Error updating role.");
        console.error(error);
    } else {
        alert("Role updated.");
    }
};


// ---------------------------------------------------------
// LOAD ALL LISTINGS (with owner's email)
// ---------------------------------------------------------
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
        tbody.innerHTML = "<tr><td colspan='4'>Error loading listings</td></tr>";
        console.error(error);
        return;
    }

    data.forEach(l => {
        tbody.innerHTML += `
            <tr>
                <td>${l.title}</td>
                <td>${l.users?.email || "Unknown"}</td>
                <td>${l.status}</td>
                <td>
                    <button class="btn small danger" onclick="adminDeleteListing('${l.id}')">
                        Delete
                    </button>
                </td>
            </tr>
        `;
    });
}


// ---------------------------------------------------------
// ADMIN DELETE ANY LISTING (DB + Storage)
// ---------------------------------------------------------
window.adminDeleteListing = async (id) => {
    const ok = confirm("Admin: permanently delete this listing?");
    if (!ok) return;

    // delete storage images first
    const { data: files } = await supabase.storage
        .from("listing-images")
        .list(id);

    if (files && files.length > 0) {
        const paths = files.map(f => `${id}/${f.name}`);
        await supabase.storage.from("listing-images").remove(paths);
    }

    // delete image records
    await supabase
        .from("listing_images")
        .delete()
        .eq("listing_id", id);

    // delete listing
    await supabase
        .from("listings")
        .delete()
        .eq("id", id);

    loadListings();
};


// ---------------------------------------------------------
// INIT
// ---------------------------------------------------------
loadUsers();
loadListings();
