import { state } from './state.js';

function getCurrentDateTime() {
  const now = new Date();

  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');

  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// todo : color palett 
state.colors.forEach(c => {
  const div = document.createElement('div');
  div.className = 'color-circle';
  div.style.backgroundColor = c;
  div.addEventListener('click', () => { state.color = c; });
  state.colorPalette.appendChild(div);
});

// * eraser button
state.eraserBtn.addEventListener('click', () => { state.color = 'white'; });

// * clear button
state.clearBtn.addEventListener('click', () => {
  state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
});

// * stroke size setter
state.strokeSlider.addEventListener('input', e => { state.strokeSize = e.target.value; });

// * select color 
state.selectColor.addEventListener("input", (e) => {
  state.color = e.target.value;
});

// *save session button to localstragfe
state.saveSessionButton.addEventListener("click", () => {
  let sessions = JSON.parse(localStorage.getItem("colloborative-canvas-session")) || [];
  sessions.push({
    sessionId: state.roomID,
    globalRedoStack: state.globalRedoStack,
    globalUndoStack: state.globalUndoStack,
    time: getCurrentDateTime()
  });

  localStorage.setItem("colloborative-canvas-session", JSON.stringify(sessions));
  alert("Session saved successfully!");
});

// *checking the url if i need to store the session
if (state.loadSession !== "") {
  const sessions = JSON.parse(localStorage.getItem("colloborative-canvas-session")) || [];
  const session = sessions[parseInt(state.loadSession)];
  if (session) {
    state.globalRedoStack = session.globalRedoStack || [];
    state.globalUndoStack = session.globalUndoStack || [];
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
  }
}

function updateFPS() {
  const now = performance.now();
  const delta = now - state.lastFrameTime;
  state.lastFrameTime = now;

  const fps = Math.round(1000 / delta);

  const fpsDiv = document.getElementById("fpsCounter");
  if (fpsDiv) fpsDiv.textContent = `FPS: ${fps}`;

  requestAnimationFrame(updateFPS);
}
requestAnimationFrame(updateFPS);
