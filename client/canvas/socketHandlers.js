
import { socket } from './socket.js';
import { state } from './state.js';
import { smoothDrawUsingLast3 } from './smoothing.js';

socket.on("beginPath", ({ socketID, color, offsetX, offsetY, strokeSize: s }) => {
  const x = offsetX * state.canvas.width;
  const y = offsetY * state.canvas.height;

  state.ctx.beginPath();
  state.ctx.moveTo(x, y);
  
  // store first point
  state.remotePaths[socketID] = {
    color,
    strokeSize: s,
    points: [{ x, y }]
  };

  // putting in the active stroke map too
  state.activeStroke.set(socketID, [{ offsetX, offsetY, strokeSize, color }]);

  // * floating label
  if (!state.floatingLabels[socketID]) {
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
    state.floatingLabels[socketID] = div;
  }
  const rect = state.canvas.getBoundingClientRect();
  const label = state.floatingLabels[socketID];
  label.style.display = "flex";
  label.style.left = `${rect.left + offsetX + 10}px`;
  label.style.top = `${rect.top + offsetY - 20}px`;
  label.innerText = state.playerName;
});


socket.on("draw", ({ socketID, offsetX, offsetY, color, strokeSize, playerName }) => {
  const x = offsetX * state.canvas.width;
  const y = offsetY * state.canvas.height;

  state.activeStroke.get(socketID).push({ offsetX, offsetY, strokeSize, color });

  const path = state.remotePaths[socketID];
  if (!path) return;

  path.points.push({ x, y });

  // todo: used algo here  
  smoothDrawUsingLast3(state.ctx, path, strokeSize, color);

  const rect = state.canvas.getBoundingClientRect();
  const label = state.floatingLabels[socketID];
  if (label) {
    label.innerText = playerName;
    label.style.left = `${rect.left + x + 10}px`;
    label.style.top = `${rect.top + y - 20}px`;
  }
});


socket.on("stopDrawing", ({ socketID, eventActionObject }) => {
  eventActionObject = JSON.parse(eventActionObject);

  state.globalUndoStack.push(eventActionObject);
  state.globalRedoStack = [];

  const label = state.floatingLabels[socketID];
  if (label) {
    label.remove();
    delete state.floatingLabels[socketID];
  }

  // remove the active stroke entry
  state.activeStroke.delete(socketID);
  delete state.remotePaths[socketID];
});


socket.on("clear", () => {
  state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
});

socket.on("user-joined", ({ playersInRoom }) => {
  playersInRoom = JSON.parse(playersInRoom);
  state.playersList.innerHTML = '';

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

    state.playersList.appendChild(li);
  });
});


socket.on("user-disconnected", ({ socketID }) => {
  const li = document.getElementById(`player-${socketID}`);
  if (li) {
    li.remove();
  }
});


function redrawUndoAndActiveStrokes() {
  state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);

  // redraw all strokes in undo stack
  state.globalUndoStack.forEach(strokeOp => {
    const points = strokeOp.coordinate_batch_array;

    state.ctx.strokeStyle = strokeOp.color;
    state.ctx.lineWidth = strokeOp.strokeSize;
    state.ctx.lineCap = "round";
    state.ctx.lineJoin = "round";

    state.ctx.beginPath();
    state.ctx.moveTo(points[0].offsetX * state.canvas.width, points[0].offsetY * state.canvas.height);

    for (let i = 1; i < points.length; i++) {
      state.ctx.lineTo(points[i].offsetX * state.canvas.width, points[i].offsetY * state.canvas.height);
    }

    state.ctx.stroke();
  });

  // painting the ative strokes as well
  for (const [socketID, points] of state.activeStroke) {
    for (let i = 0; i < points.length; i++) {
      const pt = points[i];
      state.ctx.strokeStyle = pt.color;
      state.ctx.lineWidth = pt.strokeSize;
      state.ctx.lineCap = "round";
      state.ctx.lineJoin = "round";

      state.ctx.beginPath();
      // agar zero hai toh moveTo karna hai
      if (i === 0) {
        state.ctx.moveTo(pt.offsetX * state.canvas.width, pt.offsetY * state.canvas.height);
      }
      else {
        state.ctx.lineTo(pt.offsetX * state.canvas.width, pt.offsetY * state.canvas.height);
      }
      state.ctx.stroke();
    }
  }
}

socket.on("undo", () => {
  if (state.globalUndoStack.length === 0) return;

  const stroke = state.globalUndoStack.pop();
  state.globalRedoStack.push(stroke);

  redrawUndoAndActiveStrokes();
});

socket.on("redo", () => {
  if (state.globalRedoStack.length === 0) return;

  const stroke = state.globalRedoStack.pop();
  state.globalUndoStack.push(stroke);

  redrawUndoAndActiveStrokes();

});

setInterval(() => {
  const startTime = Date.now();
  socket.emit("ping-check", startTime);
}, 1000);

socket.on("pong-check", (startTime) => {
  const ping = Date.now() - startTime;
  const latencyDiv = document.getElementById("latencyCounter");
  if (latencyDiv) latencyDiv.textContent = `Ping: ${ping}ms`;
});
