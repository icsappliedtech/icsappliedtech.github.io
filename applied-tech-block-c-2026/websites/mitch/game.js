const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// This fills the box with a bright red color immediately
ctx.fillStyle = "red";
ctx.fillRect(0, 0, canvas.width, canvas.height);

console.log("If you see a red box, the code is working!");