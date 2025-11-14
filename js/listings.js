// FULL FILE — listings.js
import { supabase } from "./config.js";

export async function getAllListings(filter = null) {
    let query = supabase
        .from("listings")
        .select(`
            id,
            title,
            type,
            location_text,
            price_range_text,
            status,
            listing_images(image_url)
        `)
        .eq("status", "active")
        .order("created_at", { ascending: false });

    if (filter && filter !== "all") {
        query = query.eq("type", filter);
    }

    const { data, error } = await query;

    if (error) {
        console.log(error);
        return [];
    }

    return data;
}
