// js/add-listing.js
import { supabase } from "./config.js";
import { ensureProfile, checkBanStatus } from "./auth.js";

const form = document.getElementById("add-listing-form");

// Optional loader support
function showLoader() {
    const el = document.getElementById("loading-overlay");
    if (el) el.style.display = "flex";
}
function hideLoader() {
    const el = document.getElementById("loading-overlay");
    if (el) el.style.display = "none";
}

form.onsubmit = async (e) => {
    e.preventDefault();
    showLoader();

    // -------------------------------
    // 1) Require user session
    // -------------------------------
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;

    if (!session) {
        window.location.href = "login.html";
        return;
    }

    const user = session.user;

    // -------------------------------
    // 2) Ensure profile + admin override
    // -------------------------------
    const profile = await ensureProfile(user);
    if (!profile) {
        alert("Unable to load your profile.");
        hideLoader();
        return;
    }

    // -------------------------------
    // 3) Ban enforcement
    // -------------------------------
    const banned = await checkBanStatus(user.id);
    if (banned) {
        hideLoader();
        return; // checkBanStatus logs out + redirects
    }

    // -------------------------------
    // 4) Collect form data
    // -------------------------------
    const title = document.getElementById("title").value;
    const type = document.getElementById("type").value;
    const description = document.getElementById("description").value;
    const location = document.getElementById("location").value;

    // -------------------------------
    // 5) Insert listing
    // -------------------------------
    const { data: listing, error: listingError } = await supabase
        .from("listings")
        .insert({
            title,
            type,
            description,
            location_text: location,
            posted_by: user.id,
            status: "active"
        })
        .select()
        .single();

    if (listingError || !listing) {
        console.error(listingError);
        alert("Error creating listing. Please try again.");
        hideLoader();
        return;
    }

    // -------------------------------
    // 6) Upload images (if any)
    // -------------------------------
    const files = document.getElementById("images").files;

    for (let file of files) {
        try {
            const filePath = `${listing.id}/${Date.now()}-${file.name}`;

            const { error: uploadError } = await supabase.storage
                .from("listing-images")
                .upload(filePath, file);

            if (uploadError) {
                console.warn("Upload failed:", uploadError);
                continue;
            }

            const publicUrl = supabase.storage
                .from("listing-images")
                .getPublicUrl(filePath).data.publicUrl;

            await supabase.from("listing_images").insert({
                listing_id: listing.id,
                image_url: publicUrl
            });
        } catch (err) {
            console.error("Unexpected upload error:", err);
        }
    }

    hideLoader();
    window.location.href = "dashboard.html";
};
