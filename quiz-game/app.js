// State
let questions = [];
let currentQuestion = 0;
let score = 0;
let showResults = false;
let loading = true;
let selectedAnswer = null;
let showFeedback = false;

// DOM Elements
const quizContainer = document.querySelector('.quiz-container');
const questionContainer = document.querySelector('.question-container');
const optionsGrid = document.querySelector('.options-grid');
const nextButton = document.querySelector('.next-button');
const scoreDisplay = document.querySelector('.score-display');
const resultsContainer = document.querySelector('.results-container');


async function fetchQuestions() {
    try {
        const response = await fetch('https://opentdb.com/api.php?amount=10&type=multiple');
        const data = await response.json();
        

        questions = data.results.map(question => {
            const answers = [...question.incorrect_answers, question.correct_answer];
            return {
                ...question,
                answers: shuffleArray(answers)
            };
        });
        
        selectedAnswer = null;
        loading = false;
        renderQuiz();
    } catch (error) {
        console.error('Error fetching questions:', error);
        loading = false;
        renderQuiz();
    }
}


function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function handleAnswerSelect(answer) {
    if (showFeedback) return;
    
    selectedAnswer = answer;
    showFeedback = true;
    
    if (answer === questions[currentQuestion].correct_answer) {
        score++;
    }
    
    renderQuiz();
}

function handleNextQuestion() {
    if (currentQuestion < questions.length - 1) {
        currentQuestion++;
        selectedAnswer = null;
        showFeedback = false;
    } else {
        showResults = true;
        // Save high score to localStorage
        const highScores = JSON.parse(localStorage.getItem('quizHighScores') || '[]');
        highScores.push(score);
        highScores.sort((a, b) => b - a);
        highScores.splice(5); // Keep only top 5 scores
        localStorage.setItem('quizHighScores', JSON.stringify(highScores));
    }
    
    renderQuiz();
}

function handleRestart() {
    currentQuestion = 0;
    score = 0;
    showResults = false;
    selectedAnswer = null;
    showFeedback = false;
    fetchQuestions();
}

// Render functions
function renderQuiz() {
    if (loading) {
        quizContainer.innerHTML = '<div class="loading">Loading questions...</div>';
        return;
    }

    if (showResults) {
        const highScores = JSON.parse(localStorage.getItem('quizHighScores') || '[]');
        quizContainer.innerHTML = `
            <div class="results-container">
                <h2>Quiz Complete!</h2>
                <div class="final-score">
                    Your Score: ${score} / ${questions.length}
                </div>
                <div class="high-scores">
                    <h3>High Scores</h3>
                    ${highScores.map(score => `<div>${score} / ${questions.length}</div>`).join('')}
                </div>
                <button class="restart-button" onclick="handleRestart()">
                    Play Again
                </button>
            </div>
        `;
        return;
    }

    const currentQ = questions[currentQuestion];
    
    quizContainer.innerHTML = `
        <div class="quiz-header">
            <h1>Interactive Quiz</h1>
            <div class="score-display">
                Question ${currentQuestion + 1} of ${questions.length}
            </div>
        </div>
        
        <div class="question-container">
            <div class="question">
                ${currentQ.question}
            </div>
            
            <div class="options-grid">
                ${currentQ.answers.map((answer, index) => `
                    <button
                        class="option-button ${
                            showFeedback
                                ? answer === currentQ.correct_answer
                                    ? 'correct'
                                    : selectedAnswer === answer
                                    ? 'incorrect'
                                    : ''
                                : ''
                        }"
                        onclick="handleAnswerSelect('${answer.replace(/'/g, "\\'")}')"
                    >
                        ${answer}
                    </button>
                `).join('')}
            </div>

            ${showFeedback ? `
                <button class="next-button" onclick="handleNextQuestion()">
                    ${currentQuestion === questions.length - 1 ? 'Show Results' : 'Next Question'}
                </button>
            ` : ''}
        </div>
    `;
}

// Initialize quiz
document.addEventListener('DOMContentLoaded', fetchQuestions); 