// FULL FILE — details.js
import { supabase } from "./config.js";

const id = localStorage.getItem("listing-id");

async function loadDetails() {
    const { data, error } = await supabase
        .from("listings")
        .select("*, listing_images(image_url)")
        .eq("id", id)
        .single();

    if (error) {
        alert("Listing not found.");
        return;
    }

    document.getElementById("title").innerText = data.title;
    document.getElementById("loc").innerText = data.location_text;
    document.getElementById("desc").innerText = data.description || "—";

    // Load gallery
    const gallery = document.getElementById("images");

    gallery.innerHTML = data.listing_images
        .map(img => `<img src="${img.image_url}" />`)
        .join("");
}

loadDetails();
