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

io.on("connection", (socket) => {
  const { roomID, username } = socket.handshake.query;
  console.log(`🟢 ${username || "User"} connected to room ${roomID} using ${socket.id}`);
  socket.join(roomID);


  // todo: events 
  // * use io if to all, 
  // * socket if to everyone else
  socket.on("beginPath", ({ color, x, y, strokeSize }) => {
    io.to(roomID).emit("beginPath", {
      socketID: socket.id,
      color,
      x,
      y,
      roomID,
      strokeSize
    });
  });

  socket.on("draw", ({ offsetX, offsetY, color, strokeSize }) => {
    io.to(roomID).emit("draw", {
      socketID: socket.id,
      offsetX,
      offsetY,
      color,
      strokeSize
    });
  });


  socket.on("stopDrawing", () => {
    socket.to(roomID).emit("stopDrawing");
  });

  socket.on("clear", ({ width, height }) => {
    socket.to(roomID).emit("clear", { width, height });
  });

  socket.on("disconnect", () => {
    console.log(`${username} disconnected from ${roomID}`);
  });
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

