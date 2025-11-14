// js/admin.js
import { supabase } from "./config.js";

async function loadUsers() {
    const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

    const tbody = document.getElementById("admin-users");
    tbody.innerHTML = "";

    if (error) {
        tbody.innerHTML = "<tr><td colspan='3'>Error loading users</td></tr>";
        return;
    }

    data.forEach(u => {
        tbody.innerHTML += `
            <tr>
                <td>${u.email}</td>
                <td>${u.role}</td>
                <td>${u.status}</td>
            </tr>
        `;
    });
}

async function loadListings() {
    const { data, error } = await supabase
        .from("listings")
        .select("title, status, posted_by");

    const tbody = document.getElementById("admin-listings");
    tbody.innerHTML = "";

    if (error) {
        tbody.innerHTML = "<tr><td colspan='3'>Error loading listings</td></tr>";
        return;
    }

    data.forEach(l => {
        tbody.innerHTML += `
            <tr>
                <td>${l.title}</td>
                <td>${l.posted_by}</td>
                <td>${l.status}</td>
            </tr>
        `;
    });
}

loadUsers();
loadListings();
