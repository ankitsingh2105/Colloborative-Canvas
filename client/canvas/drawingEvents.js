import { socket } from './socketConnection.js';
import { state } from './state.js';

// pointer down
function startDrawing(e) {
  e.preventDefault();
  let offsetX = e.offsetX / state.canvas.width;
  let offsetY = e.offsetY / state.canvas.height;
  state.isDrawing = true;
  socket.emit("beginPath", { color: state.color, offsetX, offsetY, room: state.roomID, strokeSize: state.strokeSize, playerName: state.playerName });
}

// pointer move
function draw(e) {
  if (!state.isDrawing) return;
  e.preventDefault();
  const offsetX = e.offsetX / state.canvas.width;
  const offsetY = e.offsetY / state.canvas.height;

  socket.emit("draw", {
    offsetX,
    offsetY,
    color: state.color,
    strokeSize: state.strokeSize,
    room: state.roomID,
    playerName: state.playerName
  });
}

// pointer up / out / cancel: stop 
function finishDrawing(e) {
  if (!state.isDrawing) return;
  e.preventDefault();
  state.isDrawing = false;
  socket.emit("stopDrawing", { room: state.roomID });
}

// attach canvas pointer listeners
state.canvas.addEventListener('pointerdown', startDrawing);
state.canvas.addEventListener('pointermove', draw);
state.canvas.addEventListener('pointerup', finishDrawing);
state.canvas.addEventListener('pointerout', finishDrawing);
state.canvas.addEventListener('pointercancel', finishDrawing);

state.undoButton.addEventListener("click", () => {
  if (state.globalUndoStack.length == 0) return;
  socket.emit("undo");
});

state.redoButton.addEventListener("click", () => {
  if (state.globalRedoStack.length == 0) return;
  socket.emit("redo");
});

document.addEventListener("keydown", (e) => {
  const isUndo = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z";
  const isRedo = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y";

  if (isUndo) {
    e.preventDefault();
    if (state.globalUndoStack.length === 0) return;
    socket.emit("undo");
  }

  if (isRedo) {
    e.preventDefault();
    if (state.globalRedoStack.length === 0) return;
    socket.emit("redo");
  }
});


state.clearBtn.addEventListener('click', () => {
  socket.emit("clear");
});

export { startDrawing, draw, finishDrawing };
