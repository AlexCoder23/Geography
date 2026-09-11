let quiz = null;

let currentQuestion = 0;

let selectedAnswer = null;

let score = 0;

let answerChecked = false;

function getTestId() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const value =
        params.get("s");


    if (!value) {

        return 11;

    }


    const id =
        Number(value);


    if (!Number.isInteger(id)) {

        return 11;

    }


    return id;

}

async function loadQuiz() {

    const testId =
        getTestId();


    try {

        const response =
            await fetch(
                `./${testId}.json`
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        quiz =
            await response.json();


        initializeQuiz();

    }

    catch (error) {

        console.error(
            "Ошибка загрузки теста:",
            error
        );


        showError();

    }

}

function initializeQuiz() {

    if (
        !quiz ||
        !Array.isArray(quiz.questions) ||
        quiz.questions.length === 0
    ) {

        showError();

        return;

    }


    document.title =
        `GeoLearn • ${quiz.title}`;


    const backLink =
        document.getElementById(
            "back-link"
        );


    backLink.href =
        `./index1.html?s=${quiz.lesson_id}`;


    showQuestion();

}

function showQuestion() {

    const question =
        quiz.questions[
            currentQuestion
        ];


    selectedAnswer = null;

    answerChecked = false;

    document.getElementById(
        "question-counter"
    ).innerHTML = `

        Вопрос
        <b>${currentQuestion + 1}</b>
        из
        <b>${quiz.questions.length}</b>

    `;

    const percent =
        Math.round(
            currentQuestion /
            quiz.questions.length *
            100
        );


    document.getElementById(
        "quiz-progress"
    ).style.width =
        `${percent}%`;

    document.getElementById(
        "question"
    ).textContent =
        question.question;

    const answersContainer =
        document.getElementById(
            "answers"
        );


    answersContainer.innerHTML = "";


    question.answers.forEach(
        (answer, index) => {

            const label =
                document.createElement(
                    "label"
                );


            label.className =
                "answer";


            label.dataset.index =
                index;


            label.innerHTML = `

                <input
                    type="radio"
                    name="answer"
                    value="${index}"
                >

                <span>
                    ${answer}
                </span>

            `;


            label.addEventListener(
                "click",
                () => {

                    selectAnswer(
                        index
                    );

                }
            );


            answersContainer.appendChild(
                label
            );

        }
    );

    const button =
        document.getElementById(
            "answer-button"
        );


    button.disabled = true;

    button.textContent =
        "Ответить →";


    updateScore();

}

function selectAnswer(index) {

    if (answerChecked) {
        return;
    }


    selectedAnswer = index;


    const answers =
        document.querySelectorAll(
            ".answer"
        );


    answers.forEach(
        answer => {

            answer.classList.remove(
                "selected"
            );

        }
    );


    const selected =
        document.querySelector(
            `.answer[data-index="${index}"]`
        );


    if (selected) {

        selected.classList.add(
            "selected"
        );

        selected.querySelector(
            "input"
        ).checked = true;

    }


    document.getElementById(
        "answer-button"
    ).disabled = false;

}

function checkAnswer() {

    if (
        selectedAnswer === null ||
        answerChecked
    ) {

        return;

    }


    answerChecked = true;


    const question =
        quiz.questions[
            currentQuestion
        ];


    const correctAnswer =
        question.correct;


    const answers =
        document.querySelectorAll(
            ".answer"
        );

    answers.forEach(
        answer => {

            const index =
                Number(
                    answer.dataset.index
                );


            if (
                index ===
                correctAnswer
            ) {

                answer.classList.add(
                    "correct"
                );

            }


            if (
                index ===
                selectedAnswer &&
                index !== correctAnswer
            ) {

                answer.classList.add(
                    "wrong"
                );

            }

        }
    );

    if (
        selectedAnswer ===
        correctAnswer
    ) {

        score++;

    }


    updateScore();


    const button =
        document.getElementById(
            "answer-button"
        );


    if (
        currentQuestion <
        quiz.questions.length - 1
    ) {

        button.textContent =
            "Следующий вопрос →";

    } else {

        button.textContent =
            "Завершить тест";

    }

}

function nextQuestion() {

    if (!answerChecked) {

        checkAnswer();

        return;

    }


    if (
        currentQuestion <
        quiz.questions.length - 1
    ) {

        currentQuestion++;

        showQuestion();

    } else {

        finishQuiz();

    }

}

function finishQuiz() {

    const total =
        quiz.questions.length;


    const percent =
        Math.round(
            score / total * 100
        );


    document.getElementById(
        "quiz-content"
    ).style.display =
        "none";


    document.querySelector(
        ".quiz-header"
    ).style.display =
        "none";


    document.querySelector(
        ".progress"
    ).style.display =
        "none";


    const result =
        document.getElementById(
            "result"
        );


    result.style.display =
        "block";


    document.getElementById(
        "result-text"
    ).innerHTML = `

        Вы ответили правильно на
        <strong>${score}</strong>
        из
        <strong>${total}</strong>
        вопросов.

        <br><br>

        Результат:
        <strong>${percent}%</strong>

    `;


    saveTestResult(
        quiz.lesson_id,
        score,
        total,
        percent
    );

}

function saveTestResult(
    lessonId,
    score,
    total,
    percent
) {

    const STORAGE_KEY =
        "geolearn_progress";


    let progress;


    try {

        progress =
            JSON.parse(
                localStorage.getItem(
                    STORAGE_KEY
                )
            ) || {};

    }

    catch {

        progress = {};

    }


    if (!progress.lessons) {

        progress.lessons = {};

    }


    if (!progress.tests) {

        progress.tests = {};

    }

    progress.tests[lessonId] = {

        score: score,

        total: total,

        percent: percent,

        completed: true,

        date: new Date().toISOString()

    };

    const passingScore =
        quiz.passing_score ?? 70;


    if (
        percent >= passingScore
    ) {

        progress.lessons[
            lessonId
        ] = true;

    }


    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(progress)
    );

    if (
        typeof updateModuleProgress ===
        "function"
    ) {

        updateModuleProgress(
            quiz.module_id
        );

    }

}

function retryQuiz() {

    currentQuestion = 0;

    selectedAnswer = null;

    score = 0;

    answerChecked = false;


    document.getElementById(
        "quiz-content"
    ).style.display =
        "block";


    document.querySelector(
        ".quiz-header"
    ).style.display =
        "flex";


    document.querySelector(
        ".progress"
    ).style.display =
        "block";


    document.getElementById(
        "result"
    ).style.display =
        "none";


    showQuestion();

}

function showError() {

    document.getElementById(
        "quiz-content"
    ).innerHTML = `

        <div class="info-card">

            <strong>
                ⚠ Не удалось загрузить тест
            </strong>

            <p>

                Проверьте параметр
                <code>?s=</code>
                и наличие JSON-файла.

            </p>

        </div>

    `;

}

function updateScore() {

    document.getElementById(
        "quiz-score"
    ).textContent =
        `${score} правильных`;

}

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadQuiz();


        document.getElementById(
            "answer-button"
        ).addEventListener(
            "click",
            nextQuestion
        );


        document.getElementById(
            "retry-button"
        ).addEventListener(
            "click",
            retryQuiz
        );


        document.getElementById(
            "lesson-button"
        ).addEventListener(
            "click",
            () => {

                window.location.href =
                    `./index1.html?s=${getTestId()}`;

            }
        );

    }
);

