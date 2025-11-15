// server.js
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

import { rooms, addPlayerToRoom, removePlayerFromRoom } from "./room.js";
import { startStroke, appendToStroke, completeStroke } from "./drawing-state.js";

const app = express();
const PORT = 3000;

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET"],
  },
});

app.get("/", (req, res) => {
  res.send("canvas running on AWS.");
});

io.on("connection", (socket) => {
  const { roomID, username } = socket.handshake.query;
  console.log(`🟢 ${username || "User"} connected to room ${roomID} using ${socket.id}`);
  socket.join(roomID);

  // Events 
  const playersInRoom = addPlayerToRoom(roomID, socket.id, username);

  // todo: event : when a new user joins 
  io.to(roomID).emit("user-joined", {
    playersInRoom
  });

  // * use io if to all, 
  // * socket if to everyone else
  socket.on("beginPath", ({ color, offsetX, offsetY, strokeSize, playerName }) => {
    startStroke(socket.id, { offsetX, offsetY, strokeSize, color, playerName });

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
    appendToStroke(socket.id, { offsetX, offsetY, strokeSize, color, playerName });

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

    const eventActionObject = completeStroke(socket.id);

    io.to(roomID).emit("stopDrawing", { 
      socketID: socket.id, 
      eventActionObject: JSON.stringify(eventActionObject) 
    });
  });

  socket.on("clear", () => {
    socket.to(roomID).emit("clear");
  });

  socket.on("undo", () => {
    io.to(roomID).emit("undo");
  });

  socket.on("redo", () => {
    io.to(roomID).emit("redo");
  });

  socket.on("ping-check", (startTime) => {
    socket.emit("pong-check", startTime);
  });

  socket.on("disconnect", () => {
    io.to(roomID).emit("user-disconnected", { socketID: socket.id });
    removePlayerFromRoom(roomID, socket.id);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
