export const state = (() => {
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
  const saveSessionButton = document.getElementById("saveSessionBtn");

  const params = new URLSearchParams(window.location.search);
  const roomID = params.get("room") || "defaultRoom";
  const playerName = params.get("user") || "defaultName";
  const loadSession = params.get("loadSession") || "";

  roomName.innerText = `RoomID : ${roomID}`;

  function resizeCanvas() {
    canvas.width = window.innerWidth * (window.innerWidth <= 600 ? 0.95 : 0.7);
    canvas.height = window.innerHeight * (window.innerWidth <= 600 ? 0.5 : 0.7);
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  return {
    canvas,
    ctx,
    clearBtn,
    eraserBtn,
    strokeSlider,
    colorPalette,
    selectColor,
    roomName,
    playersList,
    undoButton,
    redoButton,
    saveSessionButton,

    params,
    roomID,
    playerName,
    loadSession,

    isDrawing: false,
    color: '#000000',
    strokeSize: 4,

    // dynamic data
    remotePaths: {},     // todo: { socketID: { color, strokeSize, points: [{x,y}, ...] } }
    floatingLabels: {},  // todo: { socketID: HTMLDivElement }
    globalRedoStack: [],
    globalUndoStack: [],

    colors: ['#a855f7', '#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#000000'],

    lastFrameTime: performance.now()
  };
})();
