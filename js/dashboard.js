// js/dashboard.js
import { supabase } from "./config.js";
import { ensureProfile } from "./auth.js";

async function loadListings() {
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;

    if (!session) {
        window.location.href = "login.html";
        return;
    }

    const user = session.user;
    await ensureProfile(user);

    const { data, error } = await supabase
        .from("listings")
        .select(`
            id,
            title,
            type,
            status,
            listing_images ( image_url )
        `)
        .eq("posted_by", user.id)
        .order("created_at", { ascending: false });

    const tbody = document.getElementById("dashboard-listings");
    tbody.innerHTML = "";

    if (error) {
        tbody.innerHTML = `<tr><td colspan="5">Error loading listings</td></tr>`;
        return;
    }

    data.forEach(listing => {
        const thumb = listing.listing_images?.length
            ? listing.listing_images[0].image_url
            : "assets/img/no-image.png";

        tbody.innerHTML += `
            <tr>
                <td><img src="${thumb}" class="thumb"></td>
                <td>${listing.title}</td>
                <td>${listing.type}</td>
                <td>${listing.status}</td>
window.deleteListing = async (id) => {
    if (!confirm("Delete this listing?")) return;

    await supabase.from("listings").delete().eq("id", id);

    location.reload();
};

            </tr>
        `;
    });
}

loadListings();
