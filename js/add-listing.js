// FULL FILE — add-listing.js
import { supabase } from "./config.js";

const form = document.getElementById("addForm");

form.onsubmit = async (e) => {
    e.preventDefault();

    const title = document.getElementById("title").value;
    const type = document.getElementById("type").value;
    const location = document.getElementById("location").value;
    const desc = document.getElementById("description").value;

    const { data: { user } } = await supabase.auth.getUser();

    // Insert listing
    const { data: listing } = await supabase
        .from("listings")
        .insert({
            posted_by: user.id,
            title,
            type,
            location_text: location,
            description: desc
        })
        .select()
        .single();

    // Upload images
    const files = document.getElementById("images").files;

    for (let file of files) {
        const filename = `${listing.id}/${Date.now()}-${file.name}`;

        const { data: upload } = await supabase.storage
            .from("listing-images")
            .upload(filename, file);

        const publicURL = supabase.storage
            .from("listing-images")
            .getPublicUrl(filename).data.publicUrl;

        await supabase.from("listing_images").insert({
            listing_id: listing.id,
            image_url: publicURL
        });
    }

    alert("Listing added!");
    window.location.href = "dashboard.html";
};
