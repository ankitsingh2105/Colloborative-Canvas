import { socket } from './socket.js';

// === Canvas Setup ===
const canvas = document.getElementById('playgroundCanvas');
const ctx = canvas.getContext('2d');
const clearBtn = document.getElementById('clearBtn');
const eraserBtn = document.getElementById('eraserBtn');
const strokeSlider = document.getElementById('strokeSize');
const colorPalette = document.getElementById('colorPalette');
console.log(":: ", colorPalette);

// === Socket Setup ===
const params = new URLSearchParams(window.location.search);
const roomID = params.get("room") || "defaultRoom";
const username = params.get("user") || "Anonymous";

// === Canvas Resize ===
function resizeCanvas() {
  canvas.width = window.innerWidth <= 400 ? 400 : 600;
  canvas.height = 450;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// === Drawing State ===
let isDrawing = false;
let color = '#a855f7';
let strokeSize = 2;

// === Color Palette ===
const colors = ['#a855f7', '#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#000000'];

colors.forEach(c => {
  const div = document.createElement('div');
  div.className = 'color-circle';
  div.style.backgroundColor = c;
  div.addEventListener('click', () => {
    color = c;
  });
  colorPalette.appendChild(div);
});

// === Drawing Functions ===
function startDrawing(e) {
  isDrawing = true;
  ctx.beginPath();
  ctx.moveTo(e.offsetX, e.offsetY);
  ctx.lineWidth = strokeSize;
  ctx.strokeStyle = color;
  socket.emit("beginPath", { room: roomID, strokeSize });
}

function draw(e) {
  if (!isDrawing) return;
  ctx.lineWidth = strokeSize;
  ctx.lineCap = 'round';
  ctx.strokeStyle = color;
  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.stroke();

  socket.emit("draw", {
    room: roomID,
    offsetX: e.offsetX,
    offsetY: e.offsetY,
    color,
    strokeSize
  });
}

function finishDrawing() {
  if (!isDrawing) return;
  isDrawing = false;
  ctx.closePath();
  socket.emit("stopDrawing", { room: roomID });
}

// === Button Actions ===
eraserBtn.addEventListener('click', () => {
  color = 'white';
});

clearBtn.addEventListener('click', () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  socket.emit("clear", { room: roomID, width: canvas.width, height: canvas.height });
});

strokeSlider.addEventListener('input', e => {
  strokeSize = e.target.value;
});

// === Mouse Events ===
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mouseup', finishDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseleave', finishDrawing);

// === Socket Events ===
socket.on("beginPath", ({ strokeSize }) => {
  ctx.beginPath();
  ctx.lineWidth = strokeSize;
});

socket.on("draw", ({ offsetX, offsetY, color, strokeSize }) => {
  ctx.lineWidth = strokeSize;
  ctx.strokeStyle = color;
  ctx.lineTo(offsetX, offsetY);
  ctx.stroke();
});

socket.on("stopDrawing", () => {
  ctx.closePath();
});

socket.on("clear", ({ width, height }) => {
  ctx.clearRect(0, 0, width, height);
});
