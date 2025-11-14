// FULL FILE — add-listing.js
import { supabase } from "./config.js";

const form = document.getElementById("addForm");

form.onsubmit = async (e) => {
    e.preventDefault();

    // Get logged-in user
    const { data: session } = await supabase.auth.getSession();
    const user = session?.session?.user;

    if (!user) {
        alert("You must be logged in.");
        window.location.href = "login.html";
        return;
    }

    const title = document.getElementById("title").value;
    const type = document.getElementById("type").value;
    const location = document.getElementById("location").value;
    const desc = document.getElementById("description").value;
    const files = document.getElementById("images").files;

    // Insert listing into DB
    const { data: listing, error: listError } = await supabase
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

    if (listError) {
        console.error(listError);
        alert("Error adding listing");
        return;
    }

    const listingId = listing.id;

    // Upload images
    for (let file of files) {
        const filename = `${listingId}/${Date.now()}-${file.name}`;

        const { error: uploadError } = await supabase.storage
            .from("listing-images")
            .upload(filename, file);

        if (uploadError) {
            console.error(uploadError);
            alert("Upload blocked — fix storage policies.");
            return;
        }

        const publicURL = supabase.storage
            .from("listing-images")
            .getPublicUrl(filename).data.publicUrl;

        await supabase.from("listing_images").insert({
            listing_id: listingId,
            image_url: publicURL
        });
    }

    alert("Listing added successfully!");
    window.location.href = "dashboard.html";
};
