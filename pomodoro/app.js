// Timer state
let timeLeft = 25 * 60; // 25 minutes in seconds
let isRunning = false;
let mode = 'work';
let timer = null;
let workDuration = 25;
let breakDuration = 5;

// Task state
let tasks = [];
let newTask = '';

// DOM Elements
const timerDisplay = document.querySelector('.timer-display');
const startButton = document.querySelector('button[onclick="startTimer()"]');
const pauseButton = document.querySelector('button[onclick="pauseTimer()"]');
const resetButton = document.querySelector('button[onclick="resetTimer()"]');
const workModeButton = document.querySelector('button[onclick="setMode(\'work\')"]');
const breakModeButton = document.querySelector('button[onclick="setMode(\'break\')"]');
const taskInput = document.querySelector('.task-input input');
const tasksList = document.querySelector('.tasks-list');
const workDurationInput = document.querySelector('input[type="number"]:first-of-type');
const breakDurationInput = document.querySelector('input[type="number"]:last-of-type');

// Load saved data
function loadSavedData() {
    const savedTasks = localStorage.getItem('pomodoroTasks');
    const savedSettings = localStorage.getItem('pomodoroSettings');
    
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
        renderTasks();
    }
    
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        workDuration = settings.workDuration;
        breakDuration = settings.breakDuration;
        timeLeft = settings.workDuration * 60;
        workDurationInput.value = workDuration;
        breakDurationInput.value = breakDuration;
        updateTimerDisplay();
    }
}

// Save data
function saveData() {
    localStorage.setItem('pomodoroTasks', JSON.stringify(tasks));
    localStorage.setItem('pomodoroSettings', JSON.stringify({
        workDuration,
        breakDuration
    }));
}

// Timer functions
function startTimer() {
    if (!isRunning) {
        isRunning = true;
        startButton.disabled = true;
        pauseButton.disabled = false;
        timer = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
                updateTimerDisplay();
            } else {
                handleTimerComplete();
            }
        }, 1000);
    }
}

function pauseTimer() {
    isRunning = false;
    startButton.disabled = false;
    pauseButton.disabled = true;
    clearInterval(timer);
}

function resetTimer() {
    pauseTimer();
    timeLeft = mode === 'work' ? workDuration * 60 : breakDuration * 60;
    updateTimerDisplay();
}

function setMode(newMode) {
    mode = newMode;
    workModeButton.classList.toggle('active', mode === 'work');
    breakModeButton.classList.toggle('active', mode === 'break');
    resetTimer();
}

function handleTimerComplete() {
    pauseTimer();
    playNotification();
    
    if (mode === 'work') {
        mode = 'break';
        timeLeft = breakDuration * 60;
    } else {
        mode = 'work';
        timeLeft = workDuration * 60;
    }
    
    updateTimerDisplay();
    startTimer();
}

function updateSettings() {
    workDuration = parseInt(workDurationInput.value);
    breakDuration = parseInt(breakDurationInput.value);
    
    if (mode === 'work') {
        timeLeft = workDuration * 60;
    } else {
        timeLeft = breakDuration * 60;
    }
    
    updateTimerDisplay();
    resetTimer();
}

// Task functions
function addTask() {
    const taskText = taskInput.value.trim();
    if (taskText) {
        tasks.push({
            id: Date.now(),
            text: taskText,
            completed: false
        });
        taskInput.value = '';
        renderTasks();
        saveData();
    }
}

function toggleTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        renderTasks();
        saveData();
    }
}

function deleteTask(taskId) {
    tasks = tasks.filter(t => t.id !== taskId);
    renderTasks();
    saveData();
}

function renderTasks() {
    tasksList.innerHTML = tasks.map(task => `
        <li class="task-item ${task.completed ? 'completed' : ''}">
            <span class="task-text">${task.text}</span>
            <div class="task-actions">
                <button onclick="toggleTask(${task.id})">
                    ${task.completed ? 'Undo' : 'Complete'}
                </button>
                <button class="delete-button" onclick="deleteTask(${task.id})">
                    Delete
                </button>
            </div>
        </li>
    `).join('');
}

// Utility functions
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function updateTimerDisplay() {
    timerDisplay.textContent = formatTime(timeLeft);
}

function playNotification() {
    if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification('Pomodoro Timer', {
                    body: `${mode === 'work' ? 'Work' : 'Break'} session complete!`,
                    icon: '/favicon.ico'
                });
            }
        });
    }
    
    // Play sound
    const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU');
    audio.play().catch(() => {
        // Ignore errors if audio can't be played
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadSavedData();
    
    // Add task on Enter key
    taskInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });
    
    // Update settings when inputs change
    workDurationInput.addEventListener('change', updateSettings);
    breakDurationInput.addEventListener('change', updateSettings);
}); 