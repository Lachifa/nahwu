import * as pdfjsLib from "./pdfjs/pdf.mjs";
pdfjsLib.GlobalWorkerOptions.workerSrc = "./pdfjs/pdf.worker.mjs";

const container = document.getElementById("pdf-container");
let finished = false;

/* =========================
   BANK SOAL QUIZ
========================= */
const quizData = {
    "quiz-1-2": {
        title: "Quiz BAB 1 – Kalam",
        totalQuestions: 3,
        passPercent: 70,
        questions: [
            {
                question: "Apa pengertian kalam menurut nahwu?",
                options: [
                    "Lafazh yang tersusun dan bermakna lengkap",
                    "Huruf hijaiyah",
                    "Isim dan fi'il",
                    "Kata kerja Arab"
                ],
                answer: 0
            },
            {
                question: "Berapa syarat kalam menurut ulama nahwu?",
                options: ["2", "3", "4", "5"],
                answer: 2
            },
            {
                question: "Kalam harus bermakna, maksudnya?",
                options: [
                    "Bisa dipahami",
                    "Berbahasa Arab",
                    "Mengandung fi'il",
                    "Mengandung huruf hijaiyah"
                ],
                answer: 0
            },
            {
                question: "Apakah satu kata bisa disebut kalam?",
                options: ["Bisa", "Tidak bisa"],
                answer: 1
            },
            {
                question: "Contoh kalam yang benar adalah?",
                options: [
                    "قلم",
                    "كتبَ زيدٌ",
                    "في",
                    "من"
                ],
                answer: 1
            },
            {
                question: "Kalam terdiri dari?",
                options: [
                    "Isim saja",
                    "Fi'il saja",
                    "Huruf saja",
                    "Isim, fi'il, atau huruf"
                ],
                answer: 3
            },
            {
                question: "Makna lengkap artinya?",
                options: [
                    "Ada subjek dan predikat",
                    "Bisa dibaca",
                    "Ada harakat",
                    "Ditulis Arab"
                ],
                answer: 0
            }
        ]
    }
};

let activeQuizQuestions = {};

/* =========================
   UTIL
========================= */
function shuffleArray(array) {
    return array
        .map(v => ({ v, r: Math.random() }))
        .sort((a, b) => a.r - b.r)
        .map(o => o.v);
}

/* =========================
   LOAD PDF
========================= */
async function loadPDF(url) {
    container.innerHTML = "";
    container.scrollTop = 0;
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

    container.addEventListener("scroll", checkScroll);
}

/* =========================
   CEK SCROLL MATERI
========================= */
function checkScroll() {
    if (finished) return;

    if (container.scrollTop + container.clientHeight >= container.scrollHeight - 5) {
        finished = true;

        const activeItem = document.querySelector(".sub-item.active");
        if (!activeItem) return;

        activeItem.querySelector(".status").textContent = "✔";

        const id = activeItem.dataset.id;
        let done = JSON.parse(localStorage.getItem("materiDone")) || [];

        if (id && !done.includes(id)) {
            done.push(id);
            localStorage.setItem("materiDone", JSON.stringify(done));
        }
    }
}

/* =========================
   QUIZ RENDER
========================= */
function renderQuiz(quizId) {
    const quiz = quizData[quizId];
    if (!quiz) return;

    const selected = shuffleArray(quiz.questions).slice(0, quiz.totalQuestions);
    activeQuizQuestions[quizId] = selected;

    container.innerHTML = `
        <h2>${quiz.title}</h2>
        <p><b>Syarat lulus:</b> ${quiz.passPercent}%</p>
        <form id="quiz-form">
            ${selected.map((q, i) => `
                <div class="quiz-question">
                    <p><b>${i + 1}. ${q.question}</b></p>
                    ${q.options.map((opt, j) => `
                        <label>
                            <input type="radio" name="q${i}" value="${j}">
                            ${opt}
                        </label><br>
                    `).join("")}
                    <div class="feedback" id="fb-${i}"></div>
                </div>
                <hr>
            `).join("")}
            <button type="submit">Cek Jawaban</button>
        </form>
        <div id="quiz-result"></div>
    `;

    document.getElementById("quiz-form").addEventListener("submit", e => {
        e.preventDefault();
        checkQuiz(quizId);
    });
}

/* =========================
   CEK QUIZ + 70%
========================= */
function checkQuiz(quizId) {
    const quiz = quizData[quizId];
    const questions = activeQuizQuestions[quizId];
    let correct = 0;

    questions.forEach((q, i) => {
        const selected = document.querySelector(`input[name="q${i}"]:checked`);
        const feedback = document.getElementById(`fb-${i}`);

        if (!selected) {
            feedback.textContent = "⚠️ Belum dijawab";
            feedback.style.color = "orange";
            return;
        }

        if (parseInt(selected.value) === q.answer) {
            feedback.textContent = "✔ Benar";
            feedback.style.color = "green";
            correct++;
        } else {
            feedback.textContent = "✖ Salah";
            feedback.style.color = "red";
        }
    });

    const percent = Math.round((correct / questions.length) * 100);
    const result = document.getElementById("quiz-result");

    if (percent >= quiz.passPercent) {
        result.innerHTML = `<p style="color:green"><b>LULUS 🎉 (${percent}%)</b></p>`;
        markQuizDone(quizId);
    } else {
        result.innerHTML = `<p style="color:red"><b>Belum lulus (${percent}%)</b><br>Minimal ${quiz.passPercent}%</p>`;
    }
}

/* =========================
   TANDAI QUIZ SELESAI
========================= */
function markQuizDone(quizId) {
    const activeItem = document.querySelector(".sub-item.active");
    activeItem.querySelector(".status").textContent = "✔";

    let done = JSON.parse(localStorage.getItem("materiDone")) || [];
    if (!done.includes(quizId)) {
        done.push(quizId);
        localStorage.setItem("materiDone", JSON.stringify(done));
    }
}

/* =========================
   RESTORE CHECKLIST
========================= */
function restoreChecklist() {
    const done = JSON.parse(localStorage.getItem("materiDone")) || [];

    document.querySelectorAll(".sub-item").forEach(item => {
        const id = item.dataset.id || item.dataset.quiz;
        if (done.includes(id)) {
            item.querySelector(".status").textContent = "✔";
        }
    });
}

/* =========================
   TOGGLE SUB ITEM
========================= */
window.toggleStatus = function(el) {
    document.querySelectorAll(".sub-item").forEach(i => i.classList.remove("active"));
    el.classList.add("active");

    const statusSpan = el.querySelector(".status");
    const title = el.textContent.replace(statusSpan.textContent, "").trim();
    document.getElementById("sub-title").textContent = title;

    container.innerHTML = "";
    container.removeEventListener("scroll", checkScroll);

    if (el.dataset.pdf) {
        loadPDF(el.dataset.pdf);
    } else if (el.dataset.quiz) {
        renderQuiz(el.dataset.quiz);
    }
};

/* =========================
   TOGGLE BAB
========================= */
document.querySelectorAll(".toggle").forEach(btn => {
    btn.addEventListener("click", () => {
        const list = btn.parentElement.nextElementSibling;
        list.style.display = list.style.display === "none" ? "block" : "none";
        btn.textContent = list.style.display === "none" ? "▼" : "▲";
    });
});

document.addEventListener("DOMContentLoaded", () => {
    restoreChecklist();
    const initialPDF = document.querySelector(".sub-item.active")?.dataset.pdf;
    if (initialPDF) loadPDF(initialPDF);
});
