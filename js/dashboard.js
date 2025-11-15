// js/dashboard.js — CLEAN, SAFE, WITH BAN + NO FLASH
import { supabase } from "./config.js";
import { ensureProfile, checkBanStatus } from "./auth.js";

/* --------------------------------------------------
   LOADER HELPERS
-------------------------------------------------- */
function showLoader() {
    const el = document.getElementById("loading-overlay");
    if (el) el.style.display = "flex";
}

function hideLoader() {
    const el = document.getElementById("loading-overlay");
    if (el) el.style.display = "none";
}

/* --------------------------------------------------
   INIT DASHBOARD
-------------------------------------------------- */
async function initDashboard() {
    showLoader();

    // 1) Check session
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;

    if (!session) {
        window.location.href = "login.html";
        return;
    }

    const user = session.user;

    // 2) STRONG BAN ENFORCEMENT
    await checkBanStatus(user.id);

    // 3) Load/update profile (includes permanent admin override)
    const profile = await ensureProfile(user);

    // 4) Load listings
    await loadListings(profile);

    hideLoader();
}

/* --------------------------------------------------
   LOAD USER LISTINGS
-------------------------------------------------- */
async function loadListings(profile) {
    const { data, error } = await supabase
        .from("listings")
        .select(`
            id,
            title,
            type,
            status,
            listing_images ( image_url )
        `)
        .eq("posted_by", profile.id)
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

    data.forEach(listing => {
        const thumb = listing.listing_images?.[0]?.image_url || "assets/img/no-image.png";
        const isHidden = listing.status === "hidden";

        let actionButtons = `
            <a href="listing.html?id=${listing.id}" class="btn small primary">View</a>
            <button class="btn small danger" onclick="deleteListing('${listing.id}')">Delete</button>
        `;

        // Admin + Manager ONLY → Show Hide / Unhide button
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

/* --------------------------------------------------
   HIDE / UNHIDE LISTING — Admin/Manager ONLY
-------------------------------------------------- */
window.toggleListingStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "active" ? "hidden" : "active";

    if (!confirm(`Set this listing to "${newStatus}"?`)) return;

    await supabase.from("listings").update({ status: newStatus }).eq("id", id);

    location.reload();
};

/* --------------------------------------------------
   DELETE LISTING (DB + STORAGE)
-------------------------------------------------- */
window.deleteListing = async (id) => {
    if (!confirm("Are you sure you want to DELETE this listing permanently?")) return;

    // Delete storage files
    const { data: files } = await supabase.storage
        .from("listing-images")
        .list(id);

    if (files && files.length > 0) {
        const paths = files.map(f => `${id}/${f.name}`);
        await supabase.storage.from("listing-images").remove(paths);
    }

    // Delete DB rows
    await supabase.from("listing_images").delete().eq("listing_id", id);
    await supabase.from("listings").delete().eq("id", id);

    location.reload();
};

/* --------------------------------------------------
   EXECUTE DASHBOARD INIT
-------------------------------------------------- */
initDashboard();
