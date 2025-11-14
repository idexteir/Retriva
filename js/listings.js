// js/listings.js
import { supabase } from "./config.js";

const grid = document.getElementById("listing-grid");
const filters = document.querySelectorAll(".filter-btn");

// Load all listings on start
loadListings("all");

filters.forEach(btn => {
    btn.addEventListener("click", () => {
        filters.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        const type = btn.dataset.type;
        loadListings(type);
    });
});

async function loadListings(filterType) {
    grid.innerHTML = `<p>Loading...</p>`;

    let query = supabase
        .from("listings")
        .select(`
            id,
            title,
            type,
            status,
            listing_images ( image_url )
        `)
        .eq("status", "active");

    if (filterType !== "all") {
        query = query.eq("type", filterType);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
        grid.innerHTML = "<p>Error loading listings.</p>";
        console.error(error);
        return;
    }

    if (!data.length) {
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
