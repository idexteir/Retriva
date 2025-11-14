// FULL FILE — details.js
import { supabase } from "./config.js";

const id = localStorage.getItem("listing-id");

async function loadDetails() {
    const { data } = await supabase
        .from("listings")
        .select("*, listing_images(image_url)")
        .eq("id", id)
        .single();

    document.getElementById("title").innerText = data.title;
    document.getElementById("loc").innerText = data.location_text;
    document.getElementById("desc").innerText = data.description;

    const container = document.getElementById("images");

    const urls = data.listing_images.map(a => a.image_url);
    initLightbox(urls);

    container.innerHTML = "";

    urls.forEach((url, index) => {
        const img = document.createElement("img");
        img.src = url;
        img.onclick = () => openLightbox(index);
        container.appendChild(img);
    });
}

loadDetails();
