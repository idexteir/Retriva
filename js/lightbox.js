// FULL FILE — lightbox.js

let currentIndex = 0;
let images = [];

export function initLightbox(imageUrls) {
    images = imageUrls;
}

export function openLightbox(index) {
    currentIndex = index;

    const overlay = document.createElement("div");
    overlay.className = "lightbox-overlay";
    overlay.id = "lightboxOverlay";

    overlay.innerHTML = `
        <div class="lightbox-content">
            <img src="${images[index]}" class="lightbox-img" id="lightboxImg">

            <span class="lb-close" id="lbClose">&times;</span>
            <span class="lb-arrow lb-left" id="lbPrev">&#10094;</span>
            <span class="lb-arrow lb-right" id="lbNext">&#10095;</span>
        </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById("lbClose").onclick = closeLightbox;
    document.getElementById("lbPrev").onclick = () => changeImage(-1);
    document.getElementById("lbNext").onclick = () => changeImage(1);

    // Close by clicking outside
    overlay.onclick = (e) => {
        if (e.target.id === "lightboxOverlay") closeLightbox();
    };

    // Keyboard support
    document.onkeydown = (e) => {
        if (e.key === "Escape") closeLightbox();
        if (e.key === "ArrowLeft") changeImage(-1);
        if (e.key === "ArrowRight") changeImage(1);
    };

    // Toggle zoom
    document.getElementById("lightboxImg").onclick = () => {
        document.getElementById("lightboxImg").classList.toggle("zoomed");
    };
}

function changeImage(step) {
    currentIndex += step;

    if (currentIndex < 0) currentIndex = images.length - 1;
    if (currentIndex >= images.length) currentIndex = 0;

    const img = document.getElementById("lightboxImg");
    img.style.opacity = 0;

    setTimeout(() => {
        img.src = images[currentIndex];
        img.style.opacity = 1;
    }, 150);
}

export function closeLightbox() {
    const overlay = document.getElementById("lightboxOverlay");
    if (overlay) overlay.remove();
    document.onkeydown = null;
}
