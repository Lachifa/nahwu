/* =========================
   PDFJS IMPORT
========================= */
import * as pdfjsLib from "./pdfjs/pdf.mjs";
pdfjsLib.GlobalWorkerOptions.workerSrc = "./pdfjs/pdf.worker.mjs";

/* =========================
   GLOBAL
========================= */
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
                question: "Apa pengertian kalam menurut ilmu nahwu?",
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
                question: "Apakah satu kata bisa disebut kalam?",
                options: ["Bisa", "Tidak bisa"],
                answer: 1
            },
            {
                question: "Contoh kalam yang benar adalah?",
                options: ["قلم", "كتبَ زيدٌ", "في", "من"],
                answer: 1
            },
            {
                question: "Kalam harus bermakna, maksudnya?",
                options: [
                    "Bisa dipahami",
                    "Berbahasa Arab",
                    "Ada harakat",
                    "Ditulis Arab"
                ],
                answer: 0
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

/* =========================
   QUIZ STATE
========================= */
let quizState = {
    quizId: null,
    questions: [],
    currentIndex: 0,
    answers: []
};

/* =========================
   UTIL
========================= */
function shuffleArray(arr) {
    return arr
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

    const status = el.querySelector(".status");
    const title = el.textContent.replace(status.textContent, "").trim();
    document.getElementById("sub-title").textContent = title;

    container.innerHTML = "";
    container.removeEventListener("scroll", checkScroll);

    if (el.dataset.pdf) {
        loadPDF(el.dataset.pdf);
    } else if (el.dataset.quiz) {
        startQuiz(el.dataset.quiz);
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

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", () => {
    restoreChecklist();
    const initial = document.querySelector(".sub-item.active")?.dataset.pdf;
    if (initial) loadPDF(initial);
});

/*************************************************
 * 🔐 AKUN (LOCAL STORAGE PER USER)
 *************************************************/
function getCurrentUser() {
    return localStorage.getItem("currentUser");
}

function userKey(key) {
    const user = getCurrentUser();
    return `${user}_${key}`;
}

/*************************************************
 * 📝 QUIZ BANK
 *************************************************/
const quizBank = {
    "quiz-1-2": {
        questions: [
            {
                question: "Apa yang dimaksud kalam?",
                options: ["Isim", "Ucapan sempurna", "Harf", "Fi'il"],
                answer: 1
            },
            {
                question: "Syarat kalam adalah?",
                options: ["Mufid", "Isim", "Harf", "Majhul"],
                answer: 0
            },
            {
                question: "Minimal kata dalam kalam?",
                options: ["1", "2", "3", "4"],
                answer: 1
            },
            {
                question: "Kalam harus?",
                options: ["Bermakna", "Panjang", "Pendek", "Latin"],
                answer: 0
            }
        ]
    }
};

let currentQuiz = null;
let currentIndex = 0;

/*************************************************
 * 📦 QUIZ CONTAINER (TIDAK GANGGU PDF)
 *************************************************/
function getQuizContainer() {
    let qc = document.getElementById("quiz-container");
    if (!qc) {
        qc = document.createElement("div");
        qc.id = "quiz-container";
        qc.style.maxWidth = "600px";
        qc.style.margin = "40px auto";
        container.appendChild(qc);
    }
    return qc;
}

function clearQuiz() {
    const qc = document.getElementById("quiz-container");
    if (qc) qc.remove();
}

/*************************************************
 * ▶️ START QUIZ
 *************************************************/
function startQuiz(quizId) {
    clearQuiz();

    const saved = localStorage.getItem(
        userKey(`quizResult_${quizId}`)
    );

    if (saved) {
        showQuizResult(quizId, JSON.parse(saved));
    } else {
        renderQuiz(quizId);
    }
}

function renderQuiz(quizId) {
    const quiz = quizBank[quizId];

    const questions = quiz.questions
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

    currentQuiz = {
        id: quizId,
        questions,
        answers: {}
    };

    showQuestion(0);
}

function showQuestion(index) {
    currentIndex = index;
    const q = currentQuiz.questions[index];
    const qc = getQuizContainer();

    qc.innerHTML = `
        <div class="quiz-box">
            <h3>Soal ${index + 1} / ${currentQuiz.questions.length}</h3>
            <p>${q.question}</p>

            ${q.options.map((opt, i) => `
                <label>
                    <input type="radio" name="q" value="${i}">
                    ${opt}
                </label><br>
            `).join("")}

            <button onclick="nextQuestion()">Lanjut</button>
        </div>
    `;
}

window.nextQuestion = function () {
    const selected = document.querySelector("input[name='q']:checked");
    if (!selected) {
        alert("Pilih jawaban dulu ya 💙");
        return;
    }

    currentQuiz.answers[currentIndex] = Number(selected.value);

    if (currentIndex < currentQuiz.questions.length - 1) {
        showQuestion(currentIndex + 1);
    } else {
        submitQuiz();
    }
};

function submitQuiz() {
    let correct = 0;

    currentQuiz.questions.forEach((q, i) => {
        if (currentQuiz.answers[i] === q.answer) correct++;
    });

    const score = Math.round(
        (correct / currentQuiz.questions.length) * 100
    );

    const result = {
        score,
        correct,
        total: currentQuiz.questions.length,
        passed: score >= 70
    };

    localStorage.setItem(
        userKey(`quizResult_${currentQuiz.id}`),
        JSON.stringify(result)
    );

    showQuizResult(currentQuiz.id, result);
}

function showQuizResult(quizId, result) {
    const qc = getQuizContainer();

    qc.innerHTML = `
        <div class="quiz-result">
            <h2>Hasil Quiz</h2>
            <p>Skor: <b>${result.score}%</b></p>
            <p>${result.correct} / ${result.total} benar</p>

            <h3 style="color:${result.passed ? "green" : "red"}">
                ${result.passed ? "LULUS 🎉" : "BELUM LULUS ❌"}
            </h3>

            <button onclick="resetQuiz('${quizId}')">
                🔄 Ulangi Quiz
            </button>
        </div>
    `;
}

window.resetQuiz = function (quizId) {
    localStorage.removeItem(
        userKey(`quizResult_${quizId}`)
    );
    startQuiz(quizId);
};
