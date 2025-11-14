// FULL FILE — listings.js
import { supabase } from "./config.js";

export async function getAllListings(filter = "all") {
    let query = supabase
        .from("listings")
        .select("*, listing_images(image_url)")
        .eq("status", "active")
        .order("created_at", { ascending: false });

    if (filter !== "all") {
        query = query.eq("type", filter);
    }

    const { data, error } = await query;
    if (error) return [];
    return data;
}
