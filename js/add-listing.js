// FULL FILE — add-listing.js
import { supabase } from "./config.js";
import { uploadListingImage } from "./uploader.js";

document.getElementById("addForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("title").value;
    const type = document.getElementById("type").value;
    const location_text = document.getElementById("location").value;
    const description = document.getElementById("description").value;

    const { data: { user } } = await supabase.auth.getUser();

    // Insert listing
    const { data: listing, error } = await supabase
        .from("listings")
        .insert({
            title,
            type,
            location_text,
            description,
            posted_by: user.id
        })
        .select()
        .single();

    if (error) {
        alert("Error creating listing");
        return;
    }

    // Upload images
    const files = document.getElementById("images").files;

    for (const file of files) {
        const url = await uploadListingImage(file, listing.id);

        await supabase.from("listing_images").insert({
            listing_id: listing.id,
            image_url: url
        });
    }

    alert("Listing added successfully!");
    window.location.href = "dashboard.html";
});
