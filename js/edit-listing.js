// FULL FILE — edit-listing.js
import { supabase } from "./config.js";

const params = new URLSearchParams(window.location.search);
const id = params.get("id");

async function loadListing() {
    const { data } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id)
        .single();

    document.getElementById("title").value = data.title;
    document.getElementById("type").value = data.type;
    document.getElementById("location").value = data.location_text;
    document.getElementById("description").value = data.description;
}

loadListing();

document.getElementById("editForm").onsubmit = async (e) => {
    e.preventDefault();

    const { data } = await supabase
        .from("listings")
        .update({
            title: document.getElementById("title").value,
            type: document.getElementById("type").value,
            location_text: document.getElementById("location").value,
            description: document.getElementById("description").value
        })
        .eq("id", id)
        .select();

    const files = document.getElementById("images").files;

    for (let file of files) {
        const filename = `${id}/${Date.now()}-${file.name}`;

        const { data: upload } = await supabase.storage
            .from("listing-images")
            .upload(filename, file);

        const publicURL = supabase.storage
            .from("listing-images")
            .getPublicUrl(filename).data.publicUrl;

        await supabase.from("listing_images").insert({
            listing_id: id,
            image_url: publicURL
        });
    }

    alert("Listing updated!");
    window.location.href = "dashboard.html";
};
