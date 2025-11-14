// js/add-listing.js
import { supabase } from "./config.js";
import { ensureProfile } from "./auth.js";

const form = document.getElementById("add-listing-form");

form.onsubmit = async (e) => {
    e.preventDefault();

    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;

    if (!session) {
        window.location.href = "login.html";
        return;
    }

    const user = session.user;
    await ensureProfile(user);

    const title = document.getElementById("title").value;
    const type = document.getElementById("type").value;
    const description = document.getElementById("description").value;
    const location = document.getElementById("location").value;

    // 1) Insert listing
    const { data: listing, error: listingError } = await supabase
        .from("listings")
        .insert({
            title,
            type,
            description,
            location_text: location,
            posted_by: user.id
        })
        .select()
        .single();

    if (listingError || !listing) {
        alert("Error creating listing");
        return;
    }

    // 2) Upload images (if any)
    const files = document.getElementById("images").files;

    for (let file of files) {
        const filePath = `${listing.id}/${Date.now()}-${file.name}`;

        const { error: uploadError } = await supabase.storage
            .from("listing-images")
            .upload(filePath, file);

        if (uploadError) continue;

        const publicUrl = supabase.storage
            .from("listing-images")
            .getPublicUrl(filePath).data.publicUrl;

        await supabase.from("listing_images").insert({
            listing_id: listing.id,
            image_url: publicUrl
        });
    }

    window.location.href = "dashboard.html";
};
