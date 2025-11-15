// js/dashboard.js
import { supabase } from "./config.js";
import { ensureProfile } from "./auth.js";

// --------------------------------------------------
// LOAD LISTINGS FOR DASHBOARD
// --------------------------------------------------

async function loadListings() {
    // Get session
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;

    if (!session) {
        window.location.href = "login.html";
        return;
    }

    const user = session.user;

    // Load profile (includes permanent admin logic)
    const profile = await ensureProfile(user);

    // Fetch user's listings
    const { data, error } = await supabase
        .from("listings")
        .select(`
            id,
            title,
            type,
            status,
            listing_images ( image_url )
        `)
        .eq("posted_by", user.id)
        .order("created_at", { ascending: false });

    const tbody = document.getElementById("dashboard-listings");
    tbody.innerHTML = "";

    if (error) {
        tbody.innerHTML = `<tr><td colspan="6">Error loading listings</td></tr>`;
        console.error(error);
        return;
    }

    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6">No listings found</td></tr>`;
        return;
    }

    // Build table rows
    data.forEach(listing => {
        const thumb = listing.listing_images?.length
            ? listing.listing_images[0].image_url
            : "assets/img/no-image.png";

        const isHidden = listing.status === "hidden";

        // Default for all users: View (blue) + Delete (red)
        let actionButtons = `
            <a href="listing.html?id=${listing.id}" class="btn small primary">View</a>
            <button class="btn small danger" onclick="deleteListing('${listing.id}')">Delete</button>
        `;

        // Admin + Manager get hide/unhide
        if (profile.role === "admin" || profile.role === "manager") {
            actionButtons = `
                <a href="listing.html?id=${listing.id}" class="btn small primary">View</a>

                <button class="btn small warning"
                    onclick="toggleListingStatus('${listing.id}', '${listing.status}')">
                    ${isHidden ? "Unhide" : "Hide"}
                </button>

                <button class="btn small danger" onclick="deleteListing('${listing.id}')">Delete</button>
            `;
        }

        tbody.innerHTML += `
            <tr>
                <td><img src="${thumb}" class="thumb"></td>
                <td>${listing.title}</td>
                <td>${listing.type}</td>
                <td>${listing.status}</td>
                <td>${actionButtons}</td>
            </tr>
        `;
    });
}

loadListings();


// --------------------------------------------------
// HIDE / UNHIDE LISTING (only admin/manager allowed)
// --------------------------------------------------

window.toggleListingStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "active" ? "hidden" : "active";

    const ok = confirm(`Are you sure you want to set this listing to "${newStatus}"?`);
    if (!ok) return;

    await supabase
        .from("listings")
        .update({ status: newStatus })
        .eq("id", id);

    location.reload();
};


// --------------------------------------------------
// DELETE LISTING (DB + STORAGE)
// --------------------------------------------------

window.deleteListing = async (id) => {
    const ok = confirm("Are you sure you want to DELETE this listing permanently?");
    if (!ok) return;

    // 1) List all storage files for this listing
    const { data: files } = await supabase.storage
        .from("listing-images")
        .list(id);

    // 2) Delete files
    if (files && files.length > 0) {
        const paths = files.map(f => `${id}/${f.name}`);
        await supabase.storage.from("listing-images").remove(paths);
    }

    // 3) Delete image records
    await supabase
        .from("listing_images")
        .delete()
        .eq("listing_id", id);

    // 4) Delete listing record
    await supabase
        .from("listings")
        .delete()
        .eq("id", id);

    location.reload();
};
