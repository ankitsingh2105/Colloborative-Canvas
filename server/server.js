import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const PORT = process.env.PORT || 3000;

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.get("/", (req, res) => {
  res.send("canvas running on AWS.");
});

// function to generate randome color for each user - in backeend only
function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// map -> room -> players
const rooms = new Map();
const individualUndoRedoMap = new Map(); // mapping the sokcetID to its current operation, prevent overlapping operations

io.on("connection", (socket) => {
  const { roomID, username } = socket.handshake.query;
  console.log(`🟢 ${username || "User"} connected to room ${roomID} using ${socket.id}`);
  socket.join(roomID);

  // Events 
  if (rooms.has(roomID)) {
    rooms.get(roomID).push({ socketID: socket.id, username, color: getRandomColor() });
  }
  else {
    rooms.set(roomID, [{ socketID: socket.id, username, color: getRandomColor() }]);
  }

  let playersInRoom = JSON.stringify(rooms.get(roomID));

  // todo: event : when a new user joins 

  io.to(roomID).emit("user-joined", {
    playersInRoom
  });

  // * use io if to all, 
  // * socket if to everyone else
  socket.on("beginPath", ({ color, offsetX, offsetY, strokeSize, playerName }) => {
    // console.log("🟢 ", playerName, " :: ", offsetX, " and ", offsetY);
    individualUndoRedoMap.set(socket.id, [{ offsetX, offsetY, strokeSize, color, playerName }]);
    io.to(roomID).emit("beginPath", {
      socketID: socket.id,
      color,
      offsetX,
      offsetY,
      roomID,
      strokeSize,
      playerName
    });
  });

  socket.on("draw", ({ offsetX, offsetY, color, strokeSize, playerName }) => {
    // console.log("🟢 🟢", playerName, " :: ", offsetX, " and ", offsetY);
    // individualUndoRedoMap.get(socket.id).push({ offsetX, offsetY, strokeSize, color, playerName });
    individualUndoRedoMap.get(socket.id).push({ offsetX, offsetY, strokeSize, color, playerName });
    io.to(roomID).emit("draw", {
      socketID: socket.id,
      offsetX,
      offsetY,
      color,
      strokeSize,
      playerName
    });
  });


  socket.on("stopDrawing", () => {
    console.log("🔴 stopDrawing from", socket.id);
    const currentPlayer = individualUndoRedoMap.get(socket.id);
    const eventActionObject = {
      socketID: socket.id,
      operation_id: Date.now() + socket.id,
      color: currentPlayer[0].color,
      strokeSize: currentPlayer[0].strokeSize,
      playerName: currentPlayer[0].playerName,
      coordinate_batch_array: currentPlayer,
    }
    individualUndoRedoMap.set(socket.id, []);
    io.to(roomID).emit("stopDrawing", { socketID: socket.id, eventActionObject: JSON.stringify(eventActionObject) });
  });

  socket.on("clear", () => {
    socket.to(roomID).emit("clear");
  });

  socket.on("undo", () => {
    io.to(roomID).emit("undo");
  })

  socket.on("redo", () => {
    io.to(roomID).emit("redo");
  })

  socket.on("ping-check", (startTime) => {
    socket.emit("pong-check", startTime);
  });


  socket.on("disconnect", () => {
    io.to(roomID).emit("user-disconnected", { socketID: socket.id });
    let playerInCurrentRoom = rooms.get(roomID).filter((players) => {
      return players.socketID !== socket.id;
    })
    rooms.set(roomID, playerInCurrentRoom);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

