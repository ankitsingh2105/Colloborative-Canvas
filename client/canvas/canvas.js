import { socket } from './socket.js';

const canvas = document.getElementById('playgroundCanvas');
const ctx = canvas.getContext('2d');
const clearBtn = document.getElementById('clearBtn');
const eraserBtn = document.getElementById('eraserBtn');
const strokeSlider = document.getElementById('strokeSize');
const colorPalette = document.getElementById('colorPalette');
const selectColor = document.getElementById('selectColor');
const roomName = document.getElementById("roomID");
const playersList = document.getElementById("playerList");
const undoButton = document.getElementById("undoBtn");
const redoButton = document.getElementById("redoBtn");

const params = new URLSearchParams(window.location.search);
const roomID = params.get("room") || "defaultRoom";
const playerName = params.get("user") || "defaultName";
roomName.innerText = `RoomID : ${roomID}`

function resizeCanvas() {
  canvas.width = window.innerWidth * (window.innerWidth <= 600 ? 0.95 : 0.7);
  canvas.height = window.innerHeight * (window.innerWidth <= 600 ? 0.5 : 0.7);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();


let isDrawing = false;  // * prevent event trigger on hovers
let color = '#000000';
let strokeSize = 4;
const remotePaths = {};  // * { socketID: { lastX, lastY, color, strokeSize } }
const floatingLabels = {}; // * { socketID: HTMLDivElement }, prevents blinking as all socket are working on save divs
let globalRedoStack = []; 
const globalUndoStack = [];

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
  let offsetX = e.offsetX / canvas.width;
  let offsetY = e.offsetY / canvas.height;
  isDrawing = true;
  socket.emit("beginPath", { color, offsetX, offsetY, room: roomID, strokeSize, playerName });
}

// pointer move
function draw(e) {
  if (!isDrawing) return; // *prevent hover from emitting, cant start without pointer down
  e.preventDefault();
  const offsetX = e.offsetX / canvas.width;
  const offsetY = e.offsetY / canvas.height;

  socket.emit("draw", {
    offsetX,
    offsetY,
    color,
    strokeSize,
    room: roomID,
    playerName
  });
}

// pointer up / out / cancel: stop 
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
  socket.emit("clear");
});

strokeSlider.addEventListener('input', e => { strokeSize = e.target.value; });

canvas.addEventListener('pointerdown', startDrawing);
canvas.addEventListener('pointermove', draw);
canvas.addEventListener('pointerup', finishDrawing);
canvas.addEventListener('pointerout', finishDrawing);
canvas.addEventListener('pointercancel', finishDrawing);

selectColor.addEventListener("input", (e) => {
  color = e.target.value;
})


// Todo : undo redo using key and buttons
undoButton.addEventListener("click", () => {
  if(globalUndoStack.length == 0) return;
  socket.emit("undo");
});

redoButton.addEventListener("click", () => {
  if(globalRedoStack.length == 0) return;
  socket.emit("redo");
});

document.addEventListener("keydown", (e) => {
  if (e.ctrlKey &&  e.key.toLowerCase() === "z") {
    e.preventDefault();
    if(globalUndoStack.length == 0) return;
    socket.emit("undo");
  }
  if (e.ctrlKey && e.key.toLowerCase() === "y") {
    e.preventDefault();
    if(globalRedoStack.length == 0) return;
    socket.emit("redo");
  }
});


// TODO:  socket events 
socket.on("beginPath", ({ socketID, color: c, x, y, strokeSize: s }) => {
  ctx.beginPath();
  x = x * canvas.width;
  y = y * canvas.height;
  ctx.moveTo(x, y);
  ctx.lineWidth = s;
  ctx.lineCap = 'round';
  ctx.strokeStyle = c;
  remotePaths[socketID] = { lastX: x, lastY: y, color: c, strokeSize: s };

  if (!floatingLabels[socketID]) {
    const div = document.createElement("div");
    div.className = "floating-name";
    div.style.position = "absolute";
    div.style.pointerEvents = "none";
    div.style.background = "black";
    div.style.color = "white";
    div.style.padding = "2px 6px";
    div.style.borderRadius = "6px";
    div.style.fontSize = "12px";
    document.body.appendChild(div);
    floatingLabels[socketID] = div;
  }

  // show & position it
  const rect = canvas.getBoundingClientRect();
  const label = floatingLabels[socketID];
  label.style.display = "flex";
  label.style.left = `${rect.left + x + 10}px`;
  label.style.top = `${rect.top + y - 20}px`;
  label.innerText = playerName;
});


socket.on("draw", ({ socketID, offsetX, offsetY, color, strokeSize, playerName }) => {
  offsetX = offsetX * canvas.width;
  offsetY = offsetY * canvas.height;
  const last = remotePaths[socketID];
  ctx.beginPath();
  ctx.lineWidth = strokeSize;
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.moveTo(last.lastX, last.lastY);
  ctx.lineTo(offsetX, offsetY);
  ctx.stroke();

  // todo : floating name
  const rect = canvas.getBoundingClientRect(); // todo : to get the canvas position on the screen
  const label = floatingLabels[socketID];
  if (label) {
    label.innerText = playerName;
    label.style.left = `${rect.left + offsetX + 10}px`;
    label.style.top = `${rect.top + offsetY - 20}px`;
  }

  // *update the last point for this user
  remotePaths[socketID].lastX = offsetX;
  remotePaths[socketID].lastY = offsetY;
});

socket.on("stopDrawing", ({ socketID, eventActionObject }) => {
  eventActionObject = JSON.parse(eventActionObject);
  console.log("eventActionObject : " , eventActionObject);

  console.log("before new : " ,globalUndoStack)
  globalUndoStack.push(eventActionObject);
  console.log("after new : ", globalUndoStack)
  globalRedoStack = [];

  // clear the lables
  const label = floatingLabels[socketID];
  if (label) {
    label.remove();
    delete floatingLabels[socketID];
  }
  delete remotePaths[socketID];
});

socket.on("clear", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// todo: players socket event

socket.on("user-joined", ({ playersInRoom }) => {
  playersInRoom = JSON.parse(playersInRoom);
  playersList.innerHTML = '';

  playersInRoom.forEach(({ socketID, username, color }) => {
    const li = document.createElement("li");
    li.id = `player-${socketID}`;
    li.style.gap = "10px";
    li.style.fontWeight = "500";

    const circle = document.createElement("div");
    circle.style.width = "20px";
    circle.style.height = "20px";
    circle.style.borderRadius = "100px";
    circle.style.border = "3px solid lightgreen";
    circle.style.backgroundColor = color;

    const name = document.createElement("span");
    name.innerText = username;

    li.appendChild(circle);
    li.appendChild(name);

    playersList.appendChild(li);
  });
});


socket.on("user-disconnected", ({ socketID }) => {
  const li = document.getElementById(`player-${socketID}`);
  if (li) {
    li.remove();
  }
});

socket.on("undo", () => {
  if (globalUndoStack.length === 0) return;

  const stroke = globalUndoStack.pop();
  globalRedoStack.push(stroke);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

   // todo : redraw all strokes in undo stack so overlapping cause no problem
  globalUndoStack.forEach(strokeOp => {
    const points = strokeOp.coordinate_batch_array;

    ctx.strokeStyle = strokeOp.color;
    ctx.lineWidth = strokeOp.strokeSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.moveTo(points[0].offsetX * canvas.width, points[0].offsetY * canvas.height);

    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].offsetX * canvas.width, points[i].offsetY * canvas.height);
    }

    ctx.stroke();
  });
});

socket.on("redo", () => {
  if (globalRedoStack.length === 0) return;

  const stroke = globalRedoStack.pop();
  globalUndoStack.push(stroke);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // todo : redraw all strokes in undo stack so overlapping cause no problem
  globalUndoStack.forEach(strokeOp => {
    const points = strokeOp.coordinate_batch_array;

    ctx.strokeStyle = strokeOp.color;
    ctx.lineWidth = strokeOp.strokeSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.moveTo(points[0].offsetX * canvas.width, points[0].offsetY * canvas.height);

    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].offsetX * canvas.width, points[i].offsetY * canvas.height);
    }

    ctx.stroke();
  });
});
