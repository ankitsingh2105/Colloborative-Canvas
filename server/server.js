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


// map -> room -> players
const rooms = new Map();

// function to generate randome color for each user - in backeend only
function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';  
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  } 
  return color;
}

io.on("connection", (socket) => {
  const { roomID, username } = socket.handshake.query;
  console.log(`🟢 ${username || "User"} connected to room ${roomID} using ${socket.id}`);
  socket.join(roomID);

  // Events 
  if(rooms.has(roomID)){
    rooms.get(roomID).push({ socketID: socket.id, username, color: getRandomColor() });
  }
  else{
    rooms.set(roomID, [{ socketID: socket.id, username, color: getRandomColor() }]);
  }

  let playersInRoom = JSON.stringify(rooms.get(roomID));


  // todo: event : when a new user joins 

  io.to(roomID).emit("user-joined", {
    playersInRoom
  });

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

  socket.on("draw", ({ offsetX, offsetY, color, strokeSize, playerName }) => {
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
    io.to(roomID).emit("stopDrawing",  {socketID : socket.id});
  });

  socket.on("clear", ({ width, height }) => {
    socket.to(roomID).emit("clear", { width, height });
  });

  socket.on("disconnect", () => {
    // console.log(`${username} disconnected from ${roomID}`);
    io.to(roomID).emit("user-disconnected", { socketID: socket.id });
    let playerInCurrentRoom = rooms.get(roomID).filter((players)=>{
      return players.socketID !== socket.id;
    }) 
    rooms.set(roomID, playerInCurrentRoom);
    console.log(playersInRoom);
  });
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

