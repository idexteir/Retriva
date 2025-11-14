// FULL FILE — edit-listing.js
import { supabase } from "./config.js";
import { uploadListingImage } from "./uploader.js";

// Extract listing ID from URL
const urlParams = new URLSearchParams(window.location.search);
const listingId = urlParams.get("id");

// Load listing data
async function loadListing() {
    const { data, error } = await supabase
        .from("listings")
        .select("*, listing_images(image_url)")
        .eq("id", listingId)
        .single();

    if (error) {
        alert("Failed to load listing.");
        return;
    }

    // Fill form fields
    document.getElementById("title").value = data.title;
    document.getElementById("type").value = data.type;
    document.getElementById("location").value = data.location_text;
    document.getElementById("description").value = data.description || "";

    // Display existing images
    const gallery = document.createElement("div");
    gallery.className = "gallery";
    gallery.style.margin = "20px";

    gallery.innerHTML = data.listing_images
        .map(img => `<img src="${img.image_url}" />`)
        .join("");

    document.querySelector("main").prepend(gallery);
}

loadListing();

// Save changes
document.getElementById("editForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    // Update listing text
    const title = document.getElementById("title").value;
    const type = document.getElementById("type").value;
    const location_text = document.getElementById("location").value;
    const description = document.getElementById("description").value;

    const { error: updateError } = await supabase
        .from("listings")
        .update({
            title,
            type,
            location_text,
            description
        })
        .eq("id", listingId);

    if (updateError) {
        alert("Error updating listing");
        return;
    }

    // Upload new images
    const images = document.getElementById("images").files;

    for (const file of images) {
        const url = await uploadListingImage(file, listingId);

        await supabase.from("listing_images").insert({
            listing_id: listingId,
            image_url: url
        });
    }

    alert("Listing updated successfully!");
    window.location.href = "dashboard.html";
});
