// js/admin.js
import { supabase } from "./config.js";
import { ensureProfile } from "./auth.js";

// ---------------------------------------------------------
// ENSURE ADMIN IS LOGGED IN + PROFILE EXISTS
// ---------------------------------------------------------
async function initAdmin() {
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;

    if (!session) {
        window.location.href = "login.html";
        return;
    }

    const user = session.user;
    await ensureProfile(user); // ensure entry in users table
}

await initAdmin();

// ---------------------------------------------------------
// LOAD ALL USERS
// ---------------------------------------------------------
async function loadUsers() {
    const { data: users, error } = await supabase
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

    users.forEach(u => {
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
        alert("Role updated successfully.");
        loadUsers();
    }
};

// ---------------------------------------------------------
// LOAD ALL LISTINGS WITH OWNER EMAIL (via foreign key)
// ---------------------------------------------------------
async function loadListings() {
    const { data: listings, error } = await supabase
        .from("listings")
        .select(`
            id,
            title,
            status,
            posted_by,
            users:users!fk_listings_posted_by ( email )
        `)
        .order("created_at", { ascending: false });

    // If the FK name is wrong, fallback to the second relationship
    if (error) {
        console.warn("Trying fallback relationship because:", error.message);

        const { data: fallback, error: error2 } = await supabase
            .from("listings")
            .select(`
                id,
                title,
                status,
                posted_by,
                users:users!listings_posted_by_fkey ( email )
            `)
            .order("created_at", { ascending: false });

        if (error2) {
            document.getElementById("admin-listings").innerHTML =
                "<tr><td colspan='4'>Error loading listings</td></tr>";

            console.error("Both FK joins failed:", error2);
            return;
        }

        renderListings(fallback);
        return;
    }

    renderListings(listings);
}

function renderListings(listings) {
    const tbody = document.getElementById("admin-listings");
    tbody.innerHTML = "";

    listings.forEach(l => {
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
// ADMIN DELETE LISTING (DB + STORAGE)
// ---------------------------------------------------------
window.adminDeleteListing = async (id) => {
    const ok = confirm("Admin: permanently DELETE this listing?");
    if (!ok) return;

    // 1) Delete images from storage
    const { data: files } = await supabase.storage
        .from("listing-images")
        .list(id);

    if (files && files.length > 0) {
        const paths = files.map(f => `${id}/${f.name}`);
        await supabase.storage.from("listing-images").remove(paths);
    }

    // 2) Delete image rows
    await supabase
        .from("listing_images")
        .delete()
        .eq("listing_id", id);

    // 3) Delete the listing
    await supabase
        .from("listings")
        .delete()
        .eq("id", id);

    alert("Listing deleted.");
    loadListings();
};

// ---------------------------------------------------------
// INIT PAGE LOAD
// ---------------------------------------------------------
loadUsers();
loadListings();
