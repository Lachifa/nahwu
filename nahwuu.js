/*************************************************
 * PDF.js SETUP
 *************************************************/
import * as pdfjsLib from "./pdfjs/pdf.mjs";
pdfjsLib.GlobalWorkerOptions.workerSrc = "./pdfjs/pdf.worker.mjs";

const container = document.getElementById("pdf-container");
let finished = false;

/*************************************************
 * 🔐 AKUN & LOCAL STORAGE
 *************************************************/
function getCurrentUser() {
    return localStorage.getItem("currentUser");
}

function userKey(key) {
    const user = getCurrentUser();
    return `${user}_${key}`;
}

/*************************************************
 * 📄 LOAD PDF
 *************************************************/
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

/*************************************************
 * 📚 PROGRESS MATERI
 *************************************************/
function checkScroll() {
    if (finished) return;

    const bottom = container.scrollTop + container.clientHeight;
    const full = container.scrollHeight;

    if (bottom >= full - 5) {
        finished = true;

        const activeItem = document.querySelector(".sub-item.active");
        if (!activeItem || !activeItem.dataset.id) return;

        const id = activeItem.dataset.id;
        markMateriDone(id);

        activeItem.querySelector(".status").textContent = "✔";
    }
}

function markMateriDone(id) {
    let done = JSON.parse(
        localStorage.getItem(userKey("materiDone"))
    ) || [];

    if (!done.includes(id)) {
        done.push(id);
        localStorage.setItem(
            userKey("materiDone"),
            JSON.stringify(done)
        );
    }
}

function restoreChecklist() {
    const done = JSON.parse(
        localStorage.getItem(userKey("materiDone"))
    ) || [];

    document.querySelectorAll(".sub-item").forEach(item => {
        const id = item.dataset.id;
        const status = item.querySelector(".status");
        if (!status) return;

        status.textContent = done.includes(id) ? "✔" : "✖";
    });
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
 * ▶️ START QUIZ
 *************************************************/
function startQuiz(quizId) {
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

    container.innerHTML = `
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
        if (currentQuiz.answers[i] === q.answer) {
            correct++;
        }
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
    container.innerHTML = `
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

/*************************************************
 * 📌 SIDEBAR CLICK HANDLER
 *************************************************/
window.toggleStatus = function (el) {
    document.querySelectorAll(".sub-item").forEach(i =>
        i.classList.remove("active")
    );
    el.classList.add("active");

    const title = document.getElementById("sub-title");
    if (title) {
        title.textContent = el.textContent.trim();
    }

    if (el.dataset.pdf) {
        loadPDF(el.dataset.pdf);
    }

    if (el.dataset.quiz) {
        startQuiz(el.dataset.quiz);
    }
};

/*************************************************
 * 🔁 INIT
 *************************************************/
document.addEventListener("DOMContentLoaded", () => {
    restoreChecklist();

    const first = document.querySelector(".sub-item.active");
    if (first && first.dataset.pdf) {
        loadPDF(first.dataset.pdf);
    }
});
