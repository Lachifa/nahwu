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
   AKUN & LOCAL STORAGE
========================= */
function getCurrentUser() {
    return localStorage.getItem("currentUser") || "guest";
}

function userKey(key) {
    return `${getCurrentUser()}_${key}`;
}


/* =========================
   BANK SOAL QUIZ
========================= */
const quizData = {
    "quiz-1-2": {
        title: "Quiz BAB 1 – Kalam",
        totalQuestions: 3,
        passPercent: 50,
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
        let done = JSON.parse(
    localStorage.getItem(userKey("materiDone"))
) || [];

if (id && !done.includes(id)) {
    done.push(id);
    localStorage.setItem(
        userKey("materiDone"),
        JSON.stringify(done)
    );
}
    }
}

window.startQuiz = function (quizId) {
    const saved = localStorage.getItem(
        userKey(`quizResult_${quizId}`)
    );

    if (saved) {
        showQuizResult(JSON.parse(saved));
        return;
    }

    const quiz = quizData[quizId];

    const selected = shuffleArray([...quiz.questions])
        .slice(0, quiz.totalQuestions);

    quizState = {
        quizId,
        questions: selected,
        currentIndex: 0,
        answers: new Array(selected.length).fill(null)
    };

    renderQuizQuestion();
};



function showQuizResult(result) {
    container.innerHTML = `
        <div class="quiz-wrapper">
            <div class="quiz-card">
                <h2>Hasil Quiz</h2>
                <p>Benar: ${result.correct} / ${result.total}</p>
                <p>Nilai: <b>${result.percent}%</b></p>

                ${
                    result.passed
                        ? `<p style="color:green"><b>LULUS 🎉</b></p>`
                        : `<p style="color:red"><b>Belum Lulus</b></p>`
                }

                <button onclick="resetQuiz('${result.quizId}')">
                    Ulangi Quiz
                </button>
            </div>
        </div>
    `;
}



/* =========================
   RENDER 1 QUESTION
========================= */
function renderQuizQuestion() {
    const { questions, currentIndex, answers } = quizState;
    const q = questions[currentIndex];

    container.innerHTML = `
        <div class="quiz-wrapper">
            <div class="quiz-card">

                <p class="quiz-progress">
                    Soal ${currentIndex + 1} dari ${questions.length}
                </p>

                <h3>${q.question}</h3>

                <div class="quiz-options">
                    ${q.options.map((opt, i) => `
                        <label class="quiz-option">
                            <input type="radio" name="quiz"
                                value="${i}"
                                ${answers[currentIndex] === i ? "checked" : ""}>
                            ${opt}
                        </label>
                    `).join("")}
                </div>

                <div class="quiz-nav">
                    ${
                        currentIndex < questions.length - 1
                            ? `<button id="nextBtn" disabled>Next</button>`
                            : `<button id="submitBtn" disabled>Cek Jawaban</button>`
                    }
                </div>

            </div>
        </div>
    `;

    setupQuizListeners();
}

/* =========================
   QUIZ LISTENER
========================= */
function setupQuizListeners() {
    const radios = document.querySelectorAll("input[name='quiz']");
    const btn = document.getElementById("nextBtn") || document.getElementById("submitBtn");

    radios.forEach(radio => {
        radio.addEventListener("change", () => {
            quizState.answers[quizState.currentIndex] = parseInt(radio.value);
            btn.disabled = false;
        });
    });

    if (btn.id === "nextBtn") {
        btn.onclick = () => {
            quizState.currentIndex++;
            renderQuizQuestion();
        };
    } else {
        btn.onclick = submitQuiz;
    }
}

/* =========================
   SUBMIT QUIZ
========================= */
function submitQuiz() {
    const quiz = quizData[quizState.quizId];
    let correct = 0;

    quizState.questions.forEach((q, i) => {
        if (
            quizState.answers[i] !== null &&
            quizState.answers[i] === q.answer
        ) {
            correct++;
        }
    });

    const total = quizState.questions.length;
    const percent = Math.round((correct / total) * 100);
    const passed = percent >= quiz.passPercent;

    const result = {
        quizId: quizState.quizId,
        correct,
        total,
        percent,
        passed
    };

    localStorage.setItem(
        userKey(`quizResult_${quizState.quizId}`),
        JSON.stringify(result)
    );

    showQuizResult(result);

    if (passed) {
        markQuizDone(quizState.quizId);
    }
}



window.resetQuiz = function (quizId) {
    // hapus hasil quiz
    localStorage.removeItem(
        userKey(`quizResult_${quizId}`)
    );

    // hapus checklist quiz
    let done = JSON.parse(
        localStorage.getItem(userKey("materiDone"))
    ) || [];

    done = done.filter(id => id !== quizId);

    localStorage.setItem(
        userKey("materiDone"),
        JSON.stringify(done)
    );

    // reset state
    quizState = {
        quizId: null,
        questions: [],
        currentIndex: 0,
        answers: []
    };

    // mulai ulang (acak ulang)
    startQuiz(quizId);
};




/* =========================
   MARK QUIZ DONE
========================= */
function markQuizDone(quizId) {
    const activeItem = document.querySelector(".sub-item.active");
    activeItem.querySelector(".status").textContent = "✔";

   let done = JSON.parse(
    localStorage.getItem(userKey("materiDone"))
) || [];

if (!done.includes(quizId)) {
    done.push(quizId);
    localStorage.setItem(
        userKey("materiDone"),
        JSON.stringify(done)
    );
}

}

/* =========================
   RESTORE CHECKLIST
========================= */
function restoreChecklist() {
    const done = JSON.parse(
    localStorage.getItem(userKey("materiDone"))
) || [];

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
