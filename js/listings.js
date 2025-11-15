// js/listings.js

import { supabase } from "./config.js";
import { ensureProfile } from "./auth.js";

const grid = document.getElementById("listing-grid");
const filters = document.querySelectorAll(".filter-btn");


// --------------------------------------------------
// OPTIONAL PROFILE SYNC (non-blocking for visitors)
// --------------------------------------------------
(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session) {
        await ensureProfile(sessionData.session.user);
    }
})();


// --------------------------------------------------
// INITIAL LOAD
// --------------------------------------------------
loadListings("all");

filters.forEach(btn => {
    btn.addEventListener("click", () => {
        filters.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        const type = btn.dataset.type;
        loadListings(type);
    });
});


// --------------------------------------------------
// LOAD LISTINGS (Public + Admin Override)
// --------------------------------------------------
async function loadListings(filterType) {
    grid.innerHTML = `<p>Loading...</p>`;

    // Determine viewer
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user || null;
    const isAdmin = user && user.email === "gomizy.ak@gmail.com"; // permanent override

    let query = supabase
        .from("listings")
        .select(`
            id,
            title,
            type,
            status,
            listing_images ( image_url )
        `);

    // Public users → only active
    if (!isAdmin) {
        query = query.eq("status", "active");
    }

    // Filter by type
    if (filterType !== "all") {
        query = query.eq("type", filterType);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
        grid.innerHTML = "<p>Error loading listings.</p>";
        console.error(error);
        return;
    }

    if (!data || data.length === 0) {
        grid.innerHTML = "<p>No listings found.</p>";
        return;
    }

    grid.innerHTML = "";

    data.forEach(item => {
        const img = item.listing_images?.[0]?.image_url || "assets/img/no-image.png";

        grid.innerHTML += `
            <div class="card" onclick="location.href='listing.html?id=${item.id}'">
                <img src="${img}" class="card-img" />
                <div class="card-body">
                    <h3 class="card-title">${item.title}</h3>
                    <p class="card-type">${item.type}</p>
                </div>
            </div>
        `;
    });
}
