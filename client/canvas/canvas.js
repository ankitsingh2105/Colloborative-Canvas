import { socket } from './socket.js';

// === Canvas Setup ===
const canvas = document.getElementById('playgroundCanvas');
const ctx = canvas.getContext('2d');
const clearBtn = document.getElementById('clearBtn');
const eraserBtn = document.getElementById('eraserBtn');
const strokeSlider = document.getElementById('strokeSize');
const colorPalette = document.getElementById('colorPalette');
const selectColor = document.getElementById('selectColor');
const roomName = document.getElementById("roomID");

const params = new URLSearchParams(window.location.search);
const roomID = params.get("room") || "defaultRoom";
roomName.innerText = `RoomID : ${roomID}`

function resizeCanvas() {
  canvas.width = window.innerWidth <= 400 ? 400 : 700;
  canvas.height = 650;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); 


let isDrawing = false;  // * prevent event trigger on hovers
let color = '#000000';        
let strokeSize = 4;
const remotePaths = {};  // * { socketID: { lastX, lastY, color, strokeSize } }


const colors = ['#a855f7', '#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#000000'];
colors.forEach(c => {
  const div = document.createElement('div');
  div.className = 'color-circle';
  div.style.backgroundColor = c;
  div.addEventListener('click', () => { color = c; });
  colorPalette.appendChild(div);
});


// pointer down
function startDrawing(e) {
  e.preventDefault();
  const x = e.offsetX;
  const y = e.offsetY;
  isDrawing = true;
  socket.emit("beginPath", { color, x, y, room: roomID, strokeSize });
}

// pointer move
function draw(e) {
  if (!isDrawing) return; // *prevent hover from emitting, cant start without pointer down
  e.preventDefault();
  const offsetX = e.offsetX;
  const offsetY = e.offsetY;

  socket.emit("draw", {
    offsetX,
    offsetY,
    color,
    strokeSize,
    room: roomID
  });
}

// pointer up / out/ cancel: stop 
function finishDrawing(e) {
  if (!isDrawing) return;
  e.preventDefault();
  isDrawing = false;
  socket.emit("stopDrawing", { room: roomID });
}


// todo : Eventt listenes
eraserBtn.addEventListener('click', () => { color = 'white'; });

clearBtn.addEventListener('click', () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  socket.emit("clear", { room: roomID, width: canvas.width, height: canvas.height });
});

strokeSlider.addEventListener('input', e => { strokeSize = e.target.value; });

canvas.addEventListener('pointerdown', startDrawing);
canvas.addEventListener('pointermove', draw);
canvas.addEventListener('pointerup', finishDrawing);
canvas.addEventListener('pointerout', finishDrawing);
canvas.addEventListener('pointercancel', finishDrawing);

selectColor.addEventListener("input", (e)=>{
  color = e.target.value;
})



// TODO:  socket events 
socket.on("beginPath", ({ socketID, color: c, x, y, strokeSize: s }) => {
  console.log("recv beginPath:", socketID, x, y, c, s);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineWidth = s;
  ctx.lineCap = 'round';
  ctx.strokeStyle = c;

  remotePaths[socketID] = { lastX: x, lastY: y, color: c, strokeSize: s };
});

socket.on("draw", ({ socketID, offsetX, offsetY, color, strokeSize }) => {
  const last = remotePaths[socketID];
  ctx.beginPath();
  ctx.lineWidth = strokeSize;
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.moveTo(last.lastX, last.lastY);
  ctx.lineTo(offsetX, offsetY);
  ctx.stroke();

  // *update the last point for this user
  remotePaths[socketID].lastX = offsetX;
  remotePaths[socketID].lastY = offsetY;
});

socket.on("stopDrawing", ({ socketID }) => {
  delete remotePaths[socketID];
});
socket.on("clear", ({ width, height }) => {
  ctx.clearRect(0, 0, width, height);
});
