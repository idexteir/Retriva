import { supabase } from "./config.js";

// get listing ID from URL
const params = new URLSearchParams(window.location.search);
const listingId = params.get("id");

const container = document.getElementById("listing-container");

if (!listingId) {
    container.innerHTML = "<p>Listing ID not found.</p>";
    throw new Error("Missing listing ID in URL");
}

loadListing();

async function loadListing() {
    container.innerHTML = "<p>Loading...</p>";

    const { data, error } = await supabase
        .from("listings")
        .select(`
            id,
            title,
            type,
            description,
            status,
            location_text,
            price_range_text,
            specs,
            listing_images ( image_url )
        `)
        .eq("id", listingId)
        .single();

    if (error || !data) {
        console.error(error);
        container.innerHTML = "<p>Failed to load listing.</p>";
        return;
    }

    const img = data.listing_images?.[0]?.image_url || "assets/img/no-image.png";

    container.innerHTML = `
        <div class="listing-header">
            <img src="${img}" class="listing-main-img" />
        </div>

        <div class="listing-body">
            <h1>${data.title}</h1>
            <p class="listing-type">${data.type}</p>

            <div class="listing-section">
                <h3>Description</h3>
                <p>${data.description || "No description provided."}</p>
            </div>

            <div class="listing-section">
                <h3>Location</h3>
                <p>${data.location_text || "Not specified"}</p>
            </div>

            <div class="listing-section">
                <h3>Price Range</h3>
                <p>${data.price_range_text || "Not specified"}</p>
            </div>

            <div class="listing-section">
                <h3>Specs</h3>
                <pre>${data.specs || "No Specs"}</pre>
            </div>
        </div>
    `;
}
