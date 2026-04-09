// 1. Wait for the browser to finish loading the page
document.addEventListener('DOMContentLoaded', () => {
    
    // 2. Select the button we created in the HTML
    const toggleBtn = document.getElementById('theme-toggle');

    // 3. Add an event listener to "listen" for the click
    toggleBtn.addEventListener('click', () => {
        
        // 4. Toggle the 'dark-theme' class on the body
        document.body.classList.toggle('dark-theme');
        
        // 5. Change the icon based on the mode
        if (document.body.classList.contains('dark-theme')) {
            toggleBtn.textContent = '☀️'; // Sun icon for Dark Mode
        } else {
            toggleBtn.textContent = '🌙'; // Moon icon for Light Mode
        }
    });
});

window.addEventListener("load", () => {
    const loader = document.getElementById("loader-wrapper");
    
    // Add the hidden class to fade it out
    loader.classList.add("loader-hidden");
});

function playGame(userChoice) {
    const choices = ['🪨', '📄', '✂️'];
    const computerChoice = choices[Math.floor(Math.random() * 3)];
    
    // Update the text on the screen
    document.getElementById('user-display').innerText = `You: ${userChoice}`;
    document.getElementById('computer-display').innerText = `Computer: ${computerChoice}`;
    
    const status = document.getElementById('game-status');

    // Logic to see who won
    if (userChoice === computerChoice) {
        status.innerText = "IT'S A TIE! 🤝";
        status.style.color = "gray";
    } else if (
        (userChoice === '🪨' && computerChoice === '✂️') ||
        (userChoice === '📄' && computerChoice === '🪨') ||
        (userChoice === '✂️' && computerChoice === '📄')
    ) {
        status.innerText = "YOU WIN! 🎉";
        status.style.color = "#2ecc71"; // Green
    } else {
        status.innerText = "COMPUTER WINS! 🤖";
        status.style.color = "#e74c3c"; // Red
    }
}

// 1. Run this immediately when the page loads
const currentTheme = localStorage.getItem('theme');
const body = document.body;

if (currentTheme === 'dark') {
    body.classList.add('dark-mode');
}

// 2. Your toggle function
function toggleTheme() {
    body.classList.toggle('dark-mode');
    
    // Check if the class is there and save the result
    if (body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark');
    } else {
        localStorage.setItem('theme', 'light');
    }
}

// Attach this to your button
document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

const canvas = document.getElementById("snakeCanvas");
const ctx = canvas.getContext("2d");
const snakeStatus = document.getElementById("snake-status");

let box = 20; 
let score = 0;
let d = ""; 
let snake = [{ x: 9 * box, y: 10 * box }];
let food = {
    x: Math.floor(Math.random() * 19 + 1) * box,
    y: Math.floor(Math.random() * 19 + 1) * box
};

// Key listeners
document.addEventListener("keydown", direction);

function direction(event) {
    if(event.keyCode == 37 && d != "RIGHT") d = "LEFT";
    else if(event.keyCode == 38 && d != "DOWN") d = "UP";
    else if(event.keyCode == 39 && d != "LEFT") d = "RIGHT";
    else if(event.keyCode == 40 && d != "UP") d = "DOWN";
}

function collision(head, array) {
    for(let i = 0; i < array.length; i++) {
        if(head.x == array[i].x && head.y == array[i].y) return true;
    }
    return false;
}

function resetSnake() {
    snake = [{ x: 9 * box, y: 10 * box }];
    d = ""; 
    score = 0;
    snakeStatus.innerText = "Flowers: 0";
    food = {
        x: Math.floor(Math.random() * 19 + 1) * box,
        y: Math.floor(Math.random() * 19 + 1) * box
    };
}

function draw() {
    // Background
    ctx.fillStyle = "#ffe4e1";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Lavender Snake
    for(let i = 0; i < snake.length; i++) {
        ctx.fillStyle = (i == 0) ? "#D8BFD8" : "#E6E6FA"; 
        ctx.fillRect(snake[i].x, snake[i].y, box - 2, box - 2); 
        
        ctx.strokeStyle = "#ffffff";
        ctx.strokeRect(snake[i].x, snake[i].y, box - 2, box - 2);
    }

    // Draw Flower
    ctx.font = "20px Arial";
    ctx.fillText("🌷", food.x, food.y + box - 2);

    // Movement
    let snakeX = snake[0].x;
    let snakeY = snake[0].y;

    if( d == "LEFT") snakeX -= box;
    if( d == "UP") snakeY -= box;
    if( d == "RIGHT") snakeX += box;
    if( d == "DOWN") snakeY += box;

    // Food Collision
    if(snakeX == food.x && snakeY == food.y) {
        score++;
        snakeStatus.innerText = "Flowers: " + score;
        food = {
            x: Math.floor(Math.random() * 19 + 1) * box,
            y: Math.floor(Math.random() * 19 + 1) * box
        };
    } else {
        if (d !== "") snake.pop();
    }

    let newHead = { x: snakeX, y: snakeY };

    // Wall/Self Collision - Auto Reset
    if(d !== "" && (snakeX < 0 || snakeX >= canvas.width || snakeY < 0 || snakeY >= canvas.height || collision(newHead, snake))) {
        resetSnake();
        return;
    }

    if (d !== "") snake.unshift(newHead);
}

let game = setInterval(draw, 100);