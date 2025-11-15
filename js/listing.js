// js/listing.js
import { supabase } from "./config.js";

// Parse listing ID from URL
const params = new URLSearchParams(window.location.search);
const listingId = params.get("id");
const container = document.getElementById("listing-container");

if (!listingId) {
    container.innerHTML = "<p>Listing ID not found.</p>";
    throw new Error("Missing listing ID in URL");
}

loadListing();

async function loadListing() {
    container.innerHTML = "<p>Loading listing...</p>";

    // Get current user (if logged in)
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;
    const userId = session?.user?.id || null;

    // -------------------------------
    // Fetch listing
    // -------------------------------
    const { data, error } = await supabase
        .from("listings")
        .select(`
            id,
            title,
            type,
            description,
            status,
            posted_by,
            location_text,
            price_range_text,
            specs,
            listing_images ( image_url )
        `)
        .eq("id", listingId)
        .maybeSingle();

    // Failure
    if (error || !data) {
        container.innerHTML = "<p>Listing not found.</p>";
        console.error(error);
        return;
    }

    // -------------------------------
    // Access control (hidden listings)
    // -------------------------------
    const isAdmin =
        session?.user?.email === "gomizy.ak@gmail.com"; // permanent override

    const isOwner = userId && userId === data.posted_by;

    if (data.status === "hidden" && !isAdmin && !isOwner) {
        container.innerHTML = "<p>This listing is hidden.</p>";
        return;
    }

    // -------------------------------
    // Build Page
    // -------------------------------
    const mainImg =
        data.listing_images?.[0]?.image_url || "assets/img/no-image.png";

    // Format specs (support string or JSON)
    let specsFormatted = "No specs available.";
    try {
        if (data.specs) {
            if (typeof data.specs === "string") {
                specsFormatted = data.specs;
            } else {
                specsFormatted = JSON.stringify(data.specs, null, 2);
            }
        }
    } catch {
        specsFormatted = "Unable to display specs.";
    }

    container.innerHTML = `
        <div class="gallery">
            ${data.listing_images
                ?.map(
                    (img) =>
                        `<img class="gallery-img" src="${img.image_url}" />`
                )
                .join("") || `<img class="gallery-img" src="${mainImg}">`}
        </div>

        <div class="listing-info">
            <h1>${data.title}</h1>
            <p class="listing-type">${data.type}</p>

            <div class="description">
                <h3>Description</h3>
                <p>${data.description || "No description provided."}</p>
            </div>

            <div class="description">
                <h3>Location</h3>
                <p>${data.location_text || "Not specified"}</p>
            </div>

            <div class="description">
                <h3>Price Range</h3>
                <p>${data.price_range_text || "Not specified"}</p>
            </div>

            <div class="description">
                <h3>Specs</h3>
                <pre>${specsFormatted}</pre>
            </div>
        </div>
    `;
}
