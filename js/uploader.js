// FULL FILE — uploader.js
import { supabase } from "./config.js";

export async function uploadListingImage(file, listingId) {
    const filePath = `${listingId}/${Date.now()}-${file.name}`;

    const { data, error } = await supabase.storage
        .from("listing-images")
        .upload(filePath, file);

    if (error) {
        console.log(error);
        return null;
    }

    // Generate public URL
    const { data: { publicUrl } } =
        supabase.storage.from("listing-images").getPublicUrl(filePath);

    return publicUrl;
}
