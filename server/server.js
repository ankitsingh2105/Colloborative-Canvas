import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const PORT = process.env.PORT || 3000;

const httpServer = createServer(app);

app.get("/", (req, res) => {
  res.json({ message: "✅ Collaborative Canvas Server is running!" });
});

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  const { roomID, username } = socket.handshake.query;
  console.log(`🟢 ${username || "User"} connected to room ${roomID}`);
  socket.join(roomID);

  // --- Drawing Events ---
  socket.on("beginPath", ({ strokeSize }) => {
    socket.to(roomID).emit("beginPath", {
      socketID: socket.id,
      strokeSize,
    });
  });

  socket.on("draw", ({ offsetX, offsetY, color, strokeSize }) => {
    socket.to(roomID).emit("draw", {
      socketID: socket.id,
      offsetX,
      offsetY,
      color,
      strokeSize,
    });
  });

  socket.on("stopDrawing", () => {
    socket.to(roomID).emit("stopDrawing");
  });

  socket.on("clear", ({ width, height }) => {
    socket.to(roomID).emit("clear", { width, height });
  });

  // --- Disconnect ---
  socket.on("disconnect", () => {
    console.log(`🔴 ${username || "User"} disconnected from ${roomID}`);
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
