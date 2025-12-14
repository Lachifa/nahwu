import * as pdfjsLib from "./pdfjs/pdf.mjs";
pdfjsLib.GlobalWorkerOptions.workerSrc = "./pdfjs/pdf.worker.mjs";

const container = document.getElementById("pdf-container");
let finished = false;

// Fungsi load PDF
async function loadPDF(url) {
    container.innerHTML = ""; // kosongkan viewer
    container.scrollTop = 0; //reset posisi scroll
    container.removeEventListener("scroll", checkScroll);
    finished = false;

    const pdf = await pdfjsLib.getDocument(url).promise;

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.3 });

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        container.appendChild(canvas);

        await page.render({ canvasContext: ctx, viewport }).promise;
    }

    // Pasang listener scroll
    container.addEventListener("scroll", checkScroll);
}

// Fungsi cek scroll sampai bawah
function checkScroll() {
    if (finished) return;

    const bottom = container.scrollTop + container.clientHeight;
    const full = container.scrollHeight;

    if (bottom >= full - 5) {
        finished = true;

        const activeItem = document.querySelector(".sub-item.active");
        if (!activeItem) return;

        // ganti tanda ✔
        const status = activeItem.querySelector(".status");
        status.textContent = "✔";

        // ambil ID sub-materi
        const id = activeItem.dataset.id;

        // ambil progress lama
        let done = JSON.parse(localStorage.getItem("materiDone")) || [];

        // simpan kalau belum ada
        if (!done.includes(id)) {
            done.push(id);
            localStorage.setItem("materiDone", JSON.stringify(done));
        }
    }
}

// Fungsi restore
function restoreChecklist() {
    const done = JSON.parse(localStorage.getItem("materiDone")) || [];

    document.querySelectorAll(".sub-item").forEach(item => {
        const id = item.dataset.id;
        const status = item.querySelector(".status");

        if (done.includes(id)) {
            status.textContent = "✔";
        } else {
            status.textContent = "✖";
        }
    });
}


// Fungsi toggle sub-item
window.toggleStatus = function(el) {
    // hapus active dari item lain
    document.querySelectorAll(".sub-item").forEach(i => i.classList.remove("active"));
    el.classList.add("active");

    // update judul sub-materi
    const statusSpan = el.querySelector(".status");
    const name = el.textContent.replace(statusSpan.textContent, "").trim();
    const subTitle = document.getElementById("sub-title");
    if(subTitle) subTitle.textContent = name;

    // load PDF sesuai data-pdf
    const pdfUrl = el.dataset.pdf;
    if(pdfUrl) loadPDF(pdfUrl);
}

// Buka/tutup sub materi
document.querySelectorAll(".toggle").forEach(btn => {
    btn.addEventListener("click", () => {
        const subList = btn.parentElement.nextElementSibling;

        if (subList.style.display === "none") {
            subList.style.display = "block";
            btn.textContent = "▲";
        } else {
            subList.style.display = "none";
            btn.textContent = "▼";
        }
    });
});

document.addEventListener("DOMContentLoaded", () => {
    restoreChecklist();
});


// Load PDF awal
const initialPDF = document.querySelector(".sub-item.active").dataset.pdf;
loadPDF(initialPDF);
